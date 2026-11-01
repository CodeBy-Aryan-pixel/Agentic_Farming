"""Train a 38-class, calibrated crop-disease ensemble.

Pipeline: CLAHE + HSV lesion-mask preprocessing -> class-balanced
fine-tuning of MobileNetV2/ResNet50/EfficientNet-B0 -> temperature
scaling -> weighted soft-voting -> calibrated class centroids.

Expected dataset layout (PlantVillage + Indian field images):

    data/
      train/
        Tomato___Early_blight/
        Tomato___Healthy/
        ...
      val/            # optional; a stratified split is used when absent
        Tomato___Early_blight/
        ...

Usage:
    python ml/train_crop_disease_ensemble.py --data-dir data/plantvillage
    python ml/train_crop_disease_ensemble.py --data-dir data --epochs 24 --freeze-backbone
"""

from __future__ import annotations

import argparse
import contextlib
import json
import random
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import datasets, transforms
from torchvision.models import (
    EfficientNet_B0_Weights,
    MobileNet_V2_Weights,
    ResNet50_Weights,
    efficientnet_b0,
    mobilenet_v2,
    resnet50,
)

try:
    import cv2
except ImportError:  # pragma: no cover - reported at runtime
    cv2 = None

MODEL_ORDER = ['mobilenet_v2', 'resnet50', 'efficientnet_b0']
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
DEFAULT_CENTROIDS_PATH = Path(__file__).resolve().parent / 'calibrated_centroids.json'

PLANTVILLAGE_CLASSES: Dict[str, int] = {
    'Apple___Apple_scab': 0,
    'Apple___Black_rot': 1,
    'Apple___Cedar_apple_rust': 2,
    'Apple___healthy': 3,
    'Blueberry___healthy': 4,
    'Cherry_(including_sour)___Powdery_mildew': 5,
    'Cherry_(including_sour)___healthy': 6,
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 7,
    'Corn_(maize)___Common_rust_': 8,
    'Corn_(maize)___Northern_Leaf_Blight': 9,
    'Corn_(maize)___healthy': 10,
    'Grape___Black_rot': 11,
    'Grape___Esca_(Black_Measles)': 12,
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 13,
    'Grape___healthy': 14,
    'Orange___Haunglongbing_(Citrus_greening)': 15,
    'Peach___Bacterial_spot': 16,
    'Peach___healthy': 17,
    'Pepper,_bell___Bacterial_spot': 18,
    'Pepper,_bell___healthy': 19,
    'Potato___Early_blight': 20,
    'Potato___Late_blight': 21,
    'Potato___healthy': 22,
    'Raspberry___healthy': 23,
    'Soybean___healthy': 24,
    'Squash___Powdery_mildew': 25,
    'Strawberry___Leaf_scorch': 26,
    'Strawberry___healthy': 27,
    'Tomato___Bacterial_spot': 28,
    'Tomato___Early_blight': 29,
    'Tomato___Late_blight': 30,
    'Tomato___Leaf_Mold': 31,
    'Tomato___Septoria_leaf_spot': 32,
    'Tomato___Spider_mites Two-spotted_spider_mite': 33,
    'Tomato___Target_Spot': 34,
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 35,
    'Tomato___Tomato_mosaic_virus': 36,
    'Tomato___healthy': 37,
}
PLANTVILLAGE_CLASS_NAMES = tuple(PLANTVILLAGE_CLASSES.keys())


@dataclass
class ModelSpec:
    name: str
    head_prefix: str
    image_size: int = 224


class LesionAwarePreprocess:
    """CLAHE illumination correction plus an HSV lesion-mask boost.

    The mask separates healthy green tissue from chlorotic, necrotic,
    powdery and rust-coloured pixels. It is used to lift lesion contrast
    before RandomResizedCrop, without painting synthetic pixels.
    """

    def __init__(
        self,
        clip_limit: float = 2.0,
        tile_grid_size: int = 8,
        lesion_boost: float = 0.18,
    ) -> None:
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size
        self.lesion_boost = lesion_boost

    def __call__(self, image: Image.Image) -> Image.Image:
        if cv2 is None:
            return image.convert('RGB')

        array = np.asarray(image.convert('RGB'), dtype=np.uint8)
        lab = cv2.cvtColor(array, cv2.COLOR_RGB2LAB)
        lightness, channel_a, channel_b = cv2.split(lab)
        clahe = cv2.createCLAHE(
            clipLimit=self.clip_limit,
            tileGridSize=(self.tile_grid_size, self.tile_grid_size),
        )
        enhanced = cv2.cvtColor(
            cv2.merge((clahe.apply(lightness), channel_a, channel_b)),
            cv2.COLOR_LAB2RGB,
        )
        hsv = cv2.cvtColor(enhanced, cv2.COLOR_RGB2HSV)
        hue, saturation, value = cv2.split(hsv)
        healthy_green = (
            (hue >= 25)
            & (hue <= 95)
            & (saturation >= 45)
            & (value >= 35)
        )
        lesion_mask = np.where(
            healthy_green | (value < 18),
            0,
            255,
        ).astype(np.uint8)
        kernel = np.ones((3, 3), np.uint8)
        lesion_mask = cv2.morphologyEx(
            lesion_mask, cv2.MORPH_OPEN, kernel
        )
        lesion_mask = cv2.morphologyEx(
            lesion_mask, cv2.MORPH_CLOSE, kernel
        )
        soft_mask = cv2.GaussianBlur(
            lesion_mask.astype(np.float32), (0, 0), sigmaX=3
        )
        soft_mask = np.clip(soft_mask / 255.0, 0.0, 1.0)
        boosted = enhanced.astype(np.float32)
        boosted[..., 0] += soft_mask * self.lesion_boost * 110.0
        boosted[..., 1] += soft_mask * self.lesion_boost * 34.0
        boosted[..., 2] += soft_mask * self.lesion_boost * 12.0

        hsv_boosted = cv2.cvtColor(
            np.clip(boosted, 0, 255).astype(np.uint8),
            cv2.COLOR_RGB2HSV,
        )
        hsv_boosted[..., 1] = np.clip(
            hsv_boosted[..., 1].astype(np.float32)
            * (1.0 + 0.22 * soft_mask),
            0,
            255,
        ).astype(np.uint8)

        return Image.fromarray(
            cv2.cvtColor(hsv_boosted, cv2.COLOR_HSV2RGB)
        )


class TransformSubset(Dataset):
    def __init__(
        self,
        base: datasets.ImageFolder,
        indices: Sequence[int],
        transform: transforms.Compose,
    ) -> None:
        self.base = base
        self.indices = list(indices)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, index: int):
        path, target = self.base.samples[self.indices[index]]
        image = self.base.loader(path)

        if self.transform is not None:
            image = self.transform(image)

        return image, target


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Train a tri-model crop disease ensemble.'
    )
    parser.add_argument('--data-dir', required=True, type=str)
    parser.add_argument(
        '--output-dir',
        default='ml/artifacts/crop_disease_ensemble',
        type=str,
    )
    parser.add_argument('--epochs', default=18, type=int)
    parser.add_argument('--warmup-epochs', default=2, type=int)
    parser.add_argument('--batch-size', default=32, type=int)
    parser.add_argument('--lr', default=3e-4, type=float)
    parser.add_argument('--weight-decay', default=1e-4, type=float)
    parser.add_argument('--label-smoothing', default=0.05, type=float)
    parser.add_argument('--image-size', default=224, type=int)
    parser.add_argument('--val-split', default=0.2, type=float)
    parser.add_argument('--num-workers', default=4, type=int)
    parser.add_argument('--seed', default=42, type=int)
    parser.add_argument(
        '--device',
        default='auto',
        choices=['auto', 'cpu', 'cuda', 'mps'],
    )
    parser.add_argument('--patience', default=5, type=int)
    parser.add_argument('--log-every', default=40, type=int)
    parser.add_argument('--freeze-backbone', action='store_true')
    parser.add_argument(
        '--no-balance-classes',
        dest='balance_classes',
        action='store_false',
    )
    parser.add_argument('--class-weight-power', default=0.75, type=float)
    parser.add_argument(
        '--clahe-clip',
        default=2.0,
        type=float,
        help='CLAHE contrast clip limit for lesion-aware preprocessing.',
    )
    parser.add_argument(
        '--no-lesion-preprocess',
        dest='lesion_preprocess',
        action='store_false',
        help='Disable CLAHE and the HSV lesion-mask boost.',
    )
    parser.add_argument(
        '--centroids-out',
        default=str(DEFAULT_CENTROIDS_PATH),
        type=str,
        help='Path for the calibrated class centroids consumed by the app.',
    )
    parser.add_argument(
        '--allow-missing-classes',
        dest='strict_classes',
        action='store_false',
        help='Allow datasets that do not contain all 38 PlantVillage classes.',
    )
    parser.add_argument(
        '--no-pretrained',
        dest='pretrained',
        action='store_false',
    )
    parser.add_argument(
        '--models',
        nargs='+',
        default=MODEL_ORDER,
        choices=MODEL_ORDER,
    )
    parser.set_defaults(
        pretrained=True,
        balance_classes=True,
        lesion_preprocess=True,
        strict_classes=True,
    )
    return parser.parse_args()


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def resolve_device(value: str) -> torch.device:
    if value != 'auto':
        return torch.device(value)

    if torch.cuda.is_available():
        return torch.device('cuda')

    mps = getattr(torch.backends, 'mps', None)

    if mps is not None and mps.is_available():
        return torch.device('mps')

    return torch.device('cpu')


def build_transforms(
    image_size: int,
    lesion_preprocess: bool,
    clahe_clip: float,
) -> Tuple[transforms.Compose, transforms.Compose]:
    preprocess: List[Any] = []

    if lesion_preprocess:
        preprocess.append(
            LesionAwarePreprocess(clip_limit=clahe_clip)
        )

    train_transform = transforms.Compose(
        preprocess
        + [
            transforms.RandomResizedCrop(
                image_size, scale=(0.6, 1.0), ratio=(0.75, 1.33)
            ),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.RandomRotation(20),
            transforms.ColorJitter(
                brightness=0.25, contrast=0.25, saturation=0.2, hue=0.05
            ),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    val_transform = transforms.Compose(
        preprocess
        + [
            transforms.Resize(int(image_size * 1.14)),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )

    return train_transform, val_transform


def find_dir(root: Path, names: Sequence[str]) -> Path | None:
    for name in names:
        candidate = root / name

        if candidate.is_dir():
            return candidate

    return None


def validate_class_names(
    class_names: Sequence[str], strict: bool
) -> None:
    discovered = set(class_names)
    expected = set(PLANTVILLAGE_CLASSES)
    missing = sorted(expected - discovered)
    extra = sorted(discovered - expected)

    if missing:
        message = (
            f'Dataset is missing {len(missing)} PlantVillage classes: '
            f'{", ".join(missing[:6])}'
        )

        if strict:
            raise ValueError(
                message
                + '. Pass --allow-missing-classes for partial datasets.'
            )

        print(f'WARNING: {message}')

    if extra:
        message = (
            f'Dataset has {len(extra)} non-PlantVillage classes: '
            f'{", ".join(extra[:6])}'
        )

        if strict:
            raise ValueError(
                message
                + '. Pass --allow-missing-classes for custom datasets.'
            )

        print(f'WARNING: {message}')

    if len(class_names) != len(PLANTVILLAGE_CLASSES):
        print(
            f'WARNING: expected {len(PLANTVILLAGE_CLASSES)} classes but '
            f'found {len(class_names)}; crop hard-mask indices will follow '
            'the discovered class order.'
        )


def stratified_split(
    targets: Sequence[int], val_split: float, seed: int
) -> Tuple[List[int], List[int]]:
    rng = random.Random(seed)
    by_class: Dict[int, List[int]] = {}

    for index, target in enumerate(targets):
        by_class.setdefault(int(target), []).append(index)

    train_indices: List[int] = []
    val_indices: List[int] = []

    for indices in by_class.values():
        shuffled = indices[:]
        rng.shuffle(shuffled)
        val_count = max(1, int(round(len(shuffled) * val_split)))

        if len(shuffled) - val_count < 1:
            val_count = 0

        val_indices.extend(shuffled[:val_count])
        train_indices.extend(shuffled[val_count:])

    rng.shuffle(train_indices)
    rng.shuffle(val_indices)
    return train_indices, val_indices


def build_datasets(
    data_dir: Path,
    image_size: int,
    val_split: float,
    seed: int,
    lesion_preprocess: bool,
    clahe_clip: float,
    strict_classes: bool,
) -> Tuple[Dataset, Dataset, List[str]]:
    train_dir = find_dir(data_dir, ['train', 'training'])
    val_dir = find_dir(data_dir, ['val', 'valid', 'validation', 'test'])
    root_dir = train_dir or data_dir
    train_transform, val_transform = build_transforms(
        image_size, lesion_preprocess, clahe_clip
    )
    base = datasets.ImageFolder(root_dir)
    class_names = list(base.classes)
    validate_class_names(class_names, strict_classes)

    print(
        f'Found {len(class_names)} classes and {len(base.samples)} images in {root_dir}'
    )

    if val_dir is not None:
        val_base = datasets.ImageFolder(val_dir)
        class_lookup = {name: index for index, name in enumerate(class_names)}
        val_indices = [
            index
            for index, (_, target) in enumerate(val_base.samples)
            if val_base.classes[target] in class_lookup
        ]
        remapped_targets = [
            class_lookup[val_base.classes[val_base.samples[index][1]]]
            for index in val_indices
        ]

        for index, target in zip(val_indices, remapped_targets):
            val_base.samples[index] = (
                val_base.samples[index][0],
                target,
            )

        val_base.targets = [target for _, target in val_base.samples]
        train_indices = list(range(len(base.samples)))
        train_dataset = TransformSubset(
            base, train_indices, train_transform
        )
        val_dataset = TransformSubset(
            val_base, val_indices, val_transform
        )
        print(
            f'Using validation directory {val_dir} with {len(val_dataset)} images'
        )
    else:
        train_indices, val_indices = stratified_split(
            base.targets, val_split, seed
        )
        train_dataset = TransformSubset(
            base, train_indices, train_transform
        )
        val_dataset = TransformSubset(base, val_indices, val_transform)
        print(
            f'Using a stratified validation split: {len(train_dataset)} train / {len(val_dataset)} val'
        )

    return train_dataset, val_dataset, class_names


def build_model(
    name: str, num_classes: int, pretrained: bool
) -> Tuple[nn.Module, ModelSpec]:
    if name == 'mobilenet_v2':
        weights = (
            MobileNet_V2_Weights.IMAGENET1K_V1 if pretrained else None
        )
        model = mobilenet_v2(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model, ModelSpec(name=name, head_prefix='classifier')

    if name == 'resnet50':
        weights = (
            ResNet50_Weights.IMAGENET1K_V2 if pretrained else None
        )
        model = resnet50(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
        return model, ModelSpec(name=name, head_prefix='fc')

    if name == 'efficientnet_b0':
        weights = (
            EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None
        )
        model = efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model, ModelSpec(name=name, head_prefix='classifier')

    raise ValueError(f'Unsupported model: {name}')


def set_backbone_trainable(
    model: nn.Module, head_prefix: str, trainable: bool
) -> None:
    for parameter_name, parameter in model.named_parameters():
        parameter.requires_grad = trainable or parameter_name.startswith(
            head_prefix
        )


@contextlib.contextmanager
def autocast_context(device: torch.device, enabled: bool):
    if enabled and device.type == 'cuda':
        if hasattr(torch, 'amp') and hasattr(torch.amp, 'autocast'):
            with torch.amp.autocast(device_type='cuda'):
                yield
        else:
            with torch.cuda.amp.autocast():
                yield
    else:
        yield


def make_grad_scaler(enabled: bool):
    if not enabled:
        return None

    try:
        return torch.amp.GradScaler('cuda')
    except (AttributeError, TypeError):
        return torch.cuda.amp.GradScaler()


def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    scaler,
    device: torch.device,
    use_amp: bool,
    epoch: int,
    total_epochs: int,
    log_every: int,
) -> Tuple[float, float]:
    model.train()
    running_loss = 0.0
    correct = 0
    seen = 0

    for batch_index, (images, labels) in enumerate(loader, start=1):
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)

        with autocast_context(device, use_amp):
            logits = model(images)
            loss = criterion(logits, labels)

        if scaler is not None:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()

        batch_size = labels.size(0)
        running_loss += loss.item() * batch_size
        correct += (logits.argmax(dim=1) == labels).sum().item()
        seen += batch_size

        if log_every > 0 and batch_index % log_every == 0:
            print(
                f'  epoch {epoch}/{total_epochs} batch {batch_index}/{len(loader)} '
                f'loss {running_loss / max(1, seen):.4f} '
                f'acc {correct / max(1, seen):.4f}'
            )

    return running_loss / max(1, seen), correct / max(1, seen)


@torch.no_grad()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    use_amp: bool,
) -> Tuple[float, np.ndarray, np.ndarray]:
    model.eval()
    running_loss = 0.0
    seen = 0
    probability_batches: List[torch.Tensor] = []
    target_batches: List[torch.Tensor] = []

    for images, labels in loader:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        with autocast_context(device, use_amp):
            logits = model(images)
            loss = criterion(logits, labels)

        probabilities = F.softmax(logits.float(), dim=1)
        batch_size = labels.size(0)
        running_loss += loss.item() * batch_size
        seen += batch_size
        probability_batches.append(probabilities.cpu())
        target_batches.append(labels.cpu())

    probabilities = (
        torch.cat(probability_batches).numpy()
        if probability_batches
        else np.zeros((0, 1), dtype=np.float32)
    )
    targets = (
        torch.cat(target_batches).numpy()
        if target_batches
        else np.zeros((0,), dtype=np.int64)
    )

    return running_loss / max(1, seen), probabilities, targets


def fit_temperature(
    probabilities: np.ndarray, targets: np.ndarray
) -> float:
    if len(targets) == 0 or probabilities.shape[0] == 0:
        return 1.0

    logits = torch.from_numpy(
        np.log(np.clip(probabilities, 1e-8, 1.0))
    ).float()
    labels = torch.from_numpy(targets).long()
    raw_temperature = torch.nn.Parameter(
        torch.zeros(1, dtype=torch.float32)
    )
    optimizer = torch.optim.LBFGS(
        [raw_temperature],
        lr=0.1,
        max_iter=100,
        line_search_fn='strong_wolfe',
    )

    def closure():
        optimizer.zero_grad()
        temperature = torch.exp(raw_temperature.clamp(-2.5, 2.5))
        loss = F.cross_entropy(logits / temperature, labels)
        loss.backward()
        return loss

    optimizer.step(closure)

    return float(
        torch.exp(raw_temperature.detach().clamp(-2.5, 2.5)).item()
    )


def apply_temperature(
    probabilities: np.ndarray, temperature: float
) -> np.ndarray:
    if probabilities.shape[0] == 0:
        return probabilities

    logits = np.log(np.clip(probabilities, 1e-8, 1.0))
    scaled = logits / max(0.1, temperature)
    scaled -= scaled.max(axis=1, keepdims=True)
    calibrated = np.exp(scaled)

    return calibrated / np.clip(
        calibrated.sum(axis=1, keepdims=True), 1e-12, None
    )


def negative_log_likelihood(
    probabilities: np.ndarray, targets: np.ndarray
) -> float:
    if len(targets) == 0:
        return 0.0

    picked = probabilities[np.arange(len(targets)), targets]

    return float(-np.log(np.clip(picked, 1e-8, 1.0)).mean())


def class_metadata(class_name: str) -> Dict[str, str]:
    crop, _, disease = class_name.partition('___')
    crop = re.sub(r'[_,]+', ' ', crop).strip()
    disease = disease.replace('_', ' ').strip() or 'Healthy'

    return {
        'crop': crop,
        'disease': disease,
        'healthy': 'healthy' in disease.lower(),
    }


def build_calibrated_centroids(
    probabilities: np.ndarray,
    targets: np.ndarray,
    class_names: Sequence[str],
    weights: Sequence[float],
    model_names: Sequence[str],
    temperatures: Dict[str, float],
) -> Dict[str, object]:
    centroids: Dict[str, Any] = {}

    for index, class_name in enumerate(class_names):
        mask = targets == index
        support = int(mask.sum())

        if support > 0:
            centroid = probabilities[mask].mean(axis=0)
            centroid = centroid / max(1e-12, float(centroid.sum()))
            confidence = float(centroid[index])
        else:
            centroid = np.zeros(len(class_names), dtype=np.float64)
            confidence = 0.0

        centroids[class_name] = {
            **class_metadata(class_name),
            'class_index': index,
            'support': support,
            'confidence': round(confidence, 6),
            'centroid': [round(float(value), 6) for value in centroid],
        }

    return {
        'version': 1,
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'classes': list(class_names),
        'class_count': len(class_names),
        'models': list(model_names),
        'weights': {
            name: round(float(weight), 6)
            for name, weight in zip(model_names, weights)
        },
        'temperatures': {
            name: round(float(temperature), 6)
            for name, temperature in temperatures.items()
        },
        'normalization': {
            'mean': list(IMAGENET_MEAN),
            'std': list(IMAGENET_STD),
        },
        'class_centroids': centroids,
    }


def save_calibrated_centroids(
    output_dir: Path,
    centroids_out: Path,
    payload: Dict[str, object],
) -> None:
    serialized = json.dumps(payload, indent=2)
    (output_dir / 'calibrated_centroids.json').write_text(
        serialized, encoding='utf-8'
    )

    if centroids_out.resolve() != (
        output_dir / 'calibrated_centroids.json'
    ).resolve():
        centroids_out.parent.mkdir(parents=True, exist_ok=True)
        centroids_out.write_text(serialized, encoding='utf-8')


def fit_ensemble_weights(
    probability_sets: Sequence[np.ndarray],
    targets: np.ndarray,
) -> List[float]:
    if len(probability_sets) <= 1:
        return [1.0] * len(probability_sets)

    if len(targets) == 0 or any(
        probabilities.shape[0] == 0
        for probabilities in probability_sets
    ):
        return [1.0 / len(probability_sets)] * len(probability_sets)

    probabilities = torch.from_numpy(
        np.stack(probability_sets, axis=0)
    ).float()
    labels = torch.from_numpy(targets).long()
    raw_weights = torch.nn.Parameter(
        torch.zeros(len(probability_sets), dtype=torch.float32)
    )
    optimizer = torch.optim.LBFGS(
        [raw_weights], lr=0.25, max_iter=150, line_search_fn='strong_wolfe'
    )

    def closure():
        optimizer.zero_grad()
        weights = torch.softmax(raw_weights, dim=0)
        mixed = torch.einsum('m,mnc->nc', weights, probabilities)
        loss = F.nll_loss(
            torch.log(mixed.clamp_min(1e-8)), labels
        )
        loss.backward()
        return loss

    optimizer.step(closure)
    weights = torch.softmax(raw_weights.detach(), dim=0).numpy()
    return [float(value) for value in weights]


def mix_probabilities(
    probability_sets: Sequence[np.ndarray],
    weights: Sequence[float],
) -> np.ndarray:
    stacked = np.stack(probability_sets, axis=0)
    mixed = np.tensordot(
        np.asarray(weights, dtype=np.float64),
        stacked,
        axes=(0, 0),
    )

    return mixed / np.clip(
        mixed.sum(axis=1, keepdims=True), 1e-12, None
    )


def classification_metrics(
    probabilities: np.ndarray,
    targets: np.ndarray,
    class_names: Sequence[str],
) -> Dict[str, object]:
    if len(targets) == 0:
        return {
            'accuracy': 0.0,
            'top3_accuracy': 0.0,
            'macro_f1': 0.0,
            'samples': 0,
            'per_class': [],
            'confusion_matrix': [],
        }

    predictions = probabilities.argmax(axis=1)
    top_k = min(3, probabilities.shape[1])
    top3 = np.argsort(probabilities, axis=1)[:, -top_k:]
    top3_correct = np.any(top3 == targets[:, None], axis=1)
    num_classes = len(class_names)
    confusion = np.zeros((num_classes, num_classes), dtype=np.int64)

    for target, prediction in zip(targets, predictions):
        confusion[int(target), int(prediction)] += 1

    per_class = []
    f1_scores = []

    for index, class_name in enumerate(class_names):
        true_positive = int(confusion[index, index])
        false_positive = int(confusion[:, index].sum() - true_positive)
        false_negative = int(confusion[index, :].sum() - true_positive)
        precision = true_positive / max(
            1, true_positive + false_positive
        )
        recall = true_positive / max(1, true_positive + false_negative)
        f1 = (
            2 * precision * recall / max(1e-8, precision + recall)
            if precision + recall > 0
            else 0.0
        )
        f1_scores.append(f1)
        per_class.append(
            {
                'class': class_name,
                'precision': round(precision, 4),
                'recall': round(recall, 4),
                'f1': round(f1, 4),
                'support': int(confusion[index, :].sum()),
            }
        )

    return {
        'accuracy': round(float((predictions == targets).mean()), 4),
        'top3_accuracy': round(float(top3_correct.mean()), 4),
        'macro_f1': round(float(np.mean(f1_scores)) if f1_scores else 0.0, 4),
        'samples': int(len(targets)),
        'per_class': per_class,
        'confusion_matrix': confusion.tolist(),
    }


def save_metrics(
    output_dir: Path,
    class_names: Sequence[str],
    model_metrics: Dict[str, object],
    ensemble_metrics: Dict[str, object],
    weights: Sequence[float],
    temperatures: Dict[str, float],
    history: Dict[str, List[Dict[str, float]]],
    args: argparse.Namespace,
) -> None:
    payload = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'class_count': len(class_names),
        'classes': list(class_names),
        'models': list(model_metrics.keys()),
        'ensemble_weights': {
            name: round(float(weight), 6)
            for name, weight in zip(model_metrics.keys(), weights)
        },
        'temperature_scaling': {
            name: round(float(temperature), 6)
            for name, temperature in temperatures.items()
        },
        'model_metrics': model_metrics,
        'ensemble_metrics': ensemble_metrics,
        'history': history,
        'config': {
            'image_size': args.image_size,
            'batch_size': args.batch_size,
            'epochs': args.epochs,
            'learning_rate': args.lr,
            'weight_decay': args.weight_decay,
            'label_smoothing': args.label_smoothing,
            'freeze_backbone': args.freeze_backbone,
            'balance_classes': args.balance_classes,
            'class_weight_power': args.class_weight_power,
            'lesion_preprocess': args.lesion_preprocess,
            'clahe_clip': args.clahe_clip,
            'strict_classes': args.strict_classes,
            'pretrained': args.pretrained,
            'normalization': {
                'mean': list(IMAGENET_MEAN),
                'std': list(IMAGENET_STD),
            },
        },
    }
    (output_dir / 'metrics.json').write_text(
        json.dumps(payload, indent=2), encoding='utf-8'
    )
    (output_dir / 'class_names.json').write_text(
        json.dumps(list(class_names), indent=2), encoding='utf-8'
    )
    (output_dir / 'ensemble_weights.json').write_text(
        json.dumps(payload['ensemble_weights'], indent=2),
        encoding='utf-8',
    )


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    device = resolve_device(args.device)
    use_amp = device.type == 'cuda'
    data_dir = Path(args.data_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not data_dir.exists():
        raise FileNotFoundError(f'Dataset directory not found: {data_dir}')

    if device.type == 'cuda':
        torch.backends.cudnn.benchmark = True

    print(f'Device: {device} | AMP: {use_amp} | output: {output_dir}')

    train_dataset, val_dataset, class_names = build_datasets(
        data_dir,
        args.image_size,
        args.val_split,
        args.seed,
        args.lesion_preprocess,
        args.clahe_clip,
        args.strict_classes,
    )
    num_classes = len(class_names)
    pin_memory = device.type == 'cuda'
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        pin_memory=pin_memory,
        persistent_workers=args.num_workers > 0,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=pin_memory,
        persistent_workers=args.num_workers > 0,
    )

    train_targets = [
        int(train_dataset.base.samples[index][1])
        for index in train_dataset.indices
    ]
    class_weight = None

    if args.balance_classes:
        counts = np.bincount(train_targets, minlength=num_classes).astype(
            np.float64
        )
        weights = (
            len(train_targets)
            / (num_classes * np.maximum(counts, 1.0))
        ) ** max(0.0, args.class_weight_power)
        weights = np.clip(weights, 0.25, 4.0)
        class_weight = torch.tensor(
            weights, dtype=torch.float32, device=device
        )
        print(
            'Using balanced class weights:',
            np.round(weights, 3).tolist(),
        )

    criterion = nn.CrossEntropyLoss(
        weight=class_weight, label_smoothing=args.label_smoothing
    )
    scaler = make_grad_scaler(use_amp)
    best_probabilities: Dict[str, np.ndarray] = {}
    model_metrics: Dict[str, object] = {}
    history: Dict[str, List[Dict[str, float]]] = {}
    temperatures: Dict[str, float] = {}

    for model_name in args.models:
        print(f'\n=== Training {model_name} ===')
        model, spec = build_model(
            model_name, num_classes, args.pretrained
        )
        model.to(device)
        frozen = args.freeze_backbone

        if frozen:
            set_backbone_trainable(model, spec.head_prefix, False)
            print(
                f'Backbone frozen for the first {args.warmup_epochs} epoch(s)'
            )

        optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=args.lr,
            weight_decay=args.weight_decay,
        )
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=max(1, args.epochs)
        )
        best_accuracy = -1.0
        best_state = None
        best_model_probabilities = None
        epochs_without_improvement = 0
        model_history: List[Dict[str, float]] = []
        checkpoint_path = output_dir / f'best_{model_name}.pt'

        for epoch in range(1, args.epochs + 1):
            started_at = time.time()

            if frozen and epoch == args.warmup_epochs + 1:
                set_backbone_trainable(model, spec.head_prefix, True)
                frozen = False
                print('Backbone unfrozen for fine-tuning')

            train_loss, train_accuracy = train_one_epoch(
                model,
                train_loader,
                criterion,
                optimizer,
                scaler,
                device,
                use_amp,
                epoch,
                args.epochs,
                args.log_every,
            )
            val_loss, val_probabilities, val_targets = evaluate(
                model, val_loader, criterion, device, use_amp
            )
            val_accuracy = (
                float(
                    (
                        val_probabilities.argmax(axis=1)
                        == val_targets
                    ).mean()
                )
                if len(val_targets)
                else 0.0
            )
            scheduler.step()
            elapsed = time.time() - started_at
            model_history.append(
                {
                    'epoch': epoch,
                    'train_loss': round(train_loss, 6),
                    'train_accuracy': round(train_accuracy, 6),
                    'val_loss': round(val_loss, 6),
                    'val_accuracy': round(val_accuracy, 6),
                    'seconds': round(elapsed, 2),
                }
            )
            print(
                f'{model_name} epoch {epoch}/{args.epochs} '
                f'train_loss {train_loss:.4f} train_acc {train_accuracy:.4f} '
                f'val_loss {val_loss:.4f} val_acc {val_accuracy:.4f} '
                f'({elapsed:.1f}s)'
            )

            if val_accuracy > best_accuracy:
                best_accuracy = val_accuracy
                best_state = {
                    key: value.detach().cpu().clone()
                    for key, value in model.state_dict().items()
                }
                best_model_probabilities = val_probabilities.copy()
                epochs_without_improvement = 0
                torch.save(
                    {
                        'arch': model_name,
                        'state_dict': best_state,
                        'class_names': class_names,
                        'image_size': args.image_size,
                        'normalization': {
                            'mean': list(IMAGENET_MEAN),
                            'std': list(IMAGENET_STD),
                        },
                        'val_accuracy': best_accuracy,
                    },
                    checkpoint_path,
                )
                print(f'  saved new best checkpoint to {checkpoint_path}')
            else:
                epochs_without_improvement += 1

            if epochs_without_improvement >= args.patience:
                print(
                    f'Early stopping {model_name} after {epoch} epochs'
                )
                break

        if best_state is None or best_model_probabilities is None:
            raise RuntimeError(f'{model_name} did not produce a checkpoint')

        model.load_state_dict(best_state)
        temperature = fit_temperature(
            best_model_probabilities, val_targets
        )
        calibrated_probabilities = apply_temperature(
            best_model_probabilities, temperature
        )
        best_probabilities[model_name] = calibrated_probabilities
        temperatures[model_name] = temperature
        history[model_name] = model_history
        model_metrics[model_name] = {
            'best_val_accuracy': round(best_accuracy, 4),
            'temperature': round(temperature, 6),
            'raw_nll': round(
                negative_log_likelihood(
                    best_model_probabilities, val_targets
                ),
                6,
            ),
            'calibrated_nll': round(
                negative_log_likelihood(
                    calibrated_probabilities, val_targets
                ),
                6,
            ),
            **classification_metrics(
                calibrated_probabilities, val_targets, class_names
            ),
        }

        model.to('cpu')

        if device.type == 'cuda':
            torch.cuda.empty_cache()

    probability_sets = [
        best_probabilities[name] for name in args.models
    ]
    ensemble_weights = fit_ensemble_weights(
        probability_sets, val_targets
    )
    ensemble_probabilities = mix_probabilities(
        probability_sets, ensemble_weights
    )
    ensemble_metrics = classification_metrics(
        ensemble_probabilities, val_targets, class_names
    )

    print('\n=== Ensemble validation ===')

    for name, weight in zip(args.models, ensemble_weights):
        print(
            f'{name}: weight {weight:.4f} '
            f'T {temperatures[name]:.4f} '
            f'val_acc {model_metrics[name]["accuracy"]:.4f}'
        )

    print(
        f'ensemble: val_acc {ensemble_metrics["accuracy"]:.4f} '
        f'macro_f1 {ensemble_metrics["macro_f1"]:.4f} '
        f'top3 {ensemble_metrics["top3_accuracy"]:.4f}'
    )

    calibrated_centroids = build_calibrated_centroids(
        ensemble_probabilities,
        val_targets,
        class_names,
        ensemble_weights,
        args.models,
        temperatures,
    )
    centroids_out = Path(args.centroids_out).expanduser().resolve()
    save_calibrated_centroids(
        output_dir, centroids_out, calibrated_centroids
    )
    save_metrics(
        output_dir,
        class_names,
        model_metrics,
        ensemble_metrics,
        ensemble_weights,
        temperatures,
        history,
        args,
    )

    ensemble_config = {
        'models': args.models,
        'weights': {
            name: round(float(weight), 6)
            for name, weight in zip(args.models, ensemble_weights)
        },
        'temperatures': {
            name: round(float(temperature), 6)
            for name, temperature in temperatures.items()
        },
        'class_names': class_names,
        'class_count': len(class_names),
        'class_indices': {
            name: index for index, name in enumerate(class_names)
        },
        'image_size': args.image_size,
        'lesion_preprocess': args.lesion_preprocess,
        'clahe_clip': args.clahe_clip,
        'calibrated_centroids': str(centroids_out),
        'normalization': {
            'mean': list(IMAGENET_MEAN),
            'std': list(IMAGENET_STD),
        },
    }
    (output_dir / 'ensemble_config.json').write_text(
        json.dumps(ensemble_config, indent=2), encoding='utf-8'
    )
    print(f'\nArtifacts written to {output_dir}')
    print(f'Calibrated centroids written to {centroids_out}')


if __name__ == '__main__':
    main()
