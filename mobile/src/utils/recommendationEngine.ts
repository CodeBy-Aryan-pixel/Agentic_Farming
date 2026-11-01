import { AGRI_PRODUCTS, AgriProduct } from '@/data/agriProducts';

export type SeverityLevel = 'Low' | 'Moderate' | 'High';
export type TreatmentRole = 'primary' | 'recovery' | 'organic';

export interface DiseaseProfile {
  disease: string;
  defaultCrop: string;
  defaultSeverity: SeverityLevel;
  summary: string;
  symptomKeywords: string[];
  primaryProductIds: string[];
  recoveryProductIds: string[];
  organicProductIds: string[];
  preventionTips: string[];
}

export interface TreatmentSlot {
  role: TreatmentRole;
  label: string;
  product: AgriProduct;
}

export interface TreatmentBundle {
  disease: string;
  crop: string;
  severity: SeverityLevel;
  profile: DiseaseProfile;
  primary: AgriProduct;
  recovery: AgriProduct;
  organic: AgriProduct;
  slots: TreatmentSlot[];
  products: AgriProduct[];
  totalPrice: number;
  totalOriginalPrice: number;
}

export interface NormalizedDiagnosis {
  disease: string;
  crop: string;
  severity: SeverityLevel;
  confidence?: number;
  rawLabel?: string;
}

export const SUPPORTED_DISEASES = [
  'Late Blight',
  'Powdery Mildew',
  'Bacterial Leaf Blight',
  'Leaf Rust',
  'Aphid Infestation',
  'Nitrogen Deficiency',
  'Tomato Early Blight',
  'Onion Purple Blotch',
  'Sugarcane Red Rot',
  'Soybean Rust',
  'Paddy Blast',
  'Wheat Yellow Rust',
  'Cotton Bollworm',
  'Cotton Leaf Curl',
  'Spinach Cercospora Leaf Spot',
  'Spinach Downy Mildew',
  'Spinach Anthracnose',
] as const;

export const DISEASE_PROFILES: DiseaseProfile[] = [
  {
    disease: 'Late Blight',
    defaultCrop: 'Tomato',
    defaultSeverity: 'High',
    summary:
      'A fast-spreading water mould disease. Remove infected foliage immediately and begin a protective fungicide programme before symptoms spread to neighbouring plants.',
    symptomKeywords: [
      'water-soaked patches',
      'brown lesions',
      'white mould',
      'wilting leaves',
      'fruit rot',
    ],
    primaryProductIds: ['ridomil-gold-mz', 'indofil-m45'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['t-stanes-bioderma-viride', 'katyayani-neem-oil'],
    preventionTips: [
      'Remove and destroy infected leaves away from the field.',
      'Improve air movement by spacing plants and avoiding overhead irrigation.',
      'Avoid working in the field when foliage is wet.',
    ],
  },
  {
    disease: 'Powdery Mildew',
    defaultCrop: 'Tomato',
    defaultSeverity: 'Moderate',
    summary:
      'A fungal disease that coats leaves in a white powder and reduces photosynthesis. Early systemic treatment plus improved airflow keeps it from spreading.',
    symptomKeywords: [
      'white powder',
      'white spots',
      'leaf curling',
      'yellowing leaves',
      'stunted growth',
    ],
    primaryProductIds: ['amistar-top-325', 'tilt-250-ec'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil'],
    preventionTips: [
      'Prune dense foliage to improve sunlight penetration.',
      'Avoid excess nitrogen, which encourages soft, susceptible growth.',
      'Water at the base and keep leaves dry through the evening.',
    ],
  },
  {
    disease: 'Bacterial Leaf Blight',
    defaultCrop: 'Rice',
    defaultSeverity: 'High',
    summary:
      'A bacterial infection that spreads quickly in warm, humid conditions. Copper-based protection and field sanitation are critical during the early stages.',
    symptomKeywords: [
      'yellow leaf edges',
      'wilting seedlings',
      'oozing leaves',
      'grey lesions',
      'leaf drying',
    ],
    primaryProductIds: ['blitox-50-wp'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['t-stanes-bioderma-viride'],
    preventionTips: [
      'Drain standing water from affected patches where possible.',
      'Avoid excess nitrogen application during an outbreak.',
      'Use certified seed and clean field tools between plots.',
    ],
  },
  {
    disease: 'Leaf Rust',
    defaultCrop: 'Wheat',
    defaultSeverity: 'Moderate',
    summary:
      'Rust fungi produce orange-brown pustules that drain nutrients from the leaf. A triazole spray at first symptoms protects the flag leaf and grain fill.',
    symptomKeywords: [
      'orange pustules',
      'rust spots',
      'brown powder',
      'yellowing leaves',
      'premature leaf drop',
    ],
    primaryProductIds: ['tilt-250-ec', 'amistar-top-325'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil'],
    preventionTips: [
      'Sow rust-resistant varieties where available.',
      'Avoid late planting and excessive nitrogen.',
      'Monitor the lower canopy weekly during humid weather.',
    ],
  },
  {
    disease: 'Aphid Infestation',
    defaultCrop: 'Cotton',
    defaultSeverity: 'Moderate',
    summary:
      'Sap-sucking aphids weaken plants and leave sticky honeydew that invites sooty mould. Target the undersides of leaves and conserve natural predators.',
    symptomKeywords: [
      'tiny green insects',
      'sticky honeydew',
      'curled leaves',
      'sooty mould',
      'stunted shoots',
    ],
    primaryProductIds: ['confidor-200-sl', 'syngenta-actara'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil'],
    preventionTips: [
      'Check the underside of leaves twice a week during dry spells.',
      'Avoid broad-spectrum sprays that kill ladybirds and parasitic wasps.',
      'Use yellow sticky traps to monitor early populations.',
    ],
  },
  {
    disease: 'Nitrogen Deficiency',
    defaultCrop: 'Rice',
    defaultSeverity: 'Moderate',
    summary:
      'Pale yellow leaves and slow growth signal a nitrogen shortfall. A split application of nitrogen plus a balanced nutrient spray helps the crop recover without excess runoff.',
    symptomKeywords: [
      'pale yellow leaves',
      'stunted growth',
      'weak stems',
      'thin canopy',
      'older leaves yellowing first',
    ],
    primaryProductIds: ['iffco-nano-urea', 'iffco-npk-19-19-19'],
    recoveryProductIds: ['gromor-npk-10-26-26', 'iffco-npk-19-19-19'],
    organicProductIds: ['iffco-sagarika'],
    preventionTips: [
      'Apply nitrogen in split doses instead of a single heavy application.',
      'Incorporate organic matter to improve nutrient retention.',
      'Avoid applying urea to dry soil or immediately before heavy rain.',
    ],
  },
  {
    disease: 'Tomato Early Blight',
    defaultCrop: 'Tomato',
    defaultSeverity: 'Moderate',
    summary:
      'Alternaria solani causes concentric brown lesions with yellow halos on older tomato leaves. Protect the canopy early and remove badly infected foliage before the lesions spread upwards.',
    symptomKeywords: [
      'concentric brown lesions',
      'yellow halo spots',
      'lower-canopy defoliation',
      'stem collar darkening',
    ],
    primaryProductIds: ['indofil-m45', 'amistar-top-325'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['t-stanes-bioderma-viride', 'katyayani-neem-oil'],
    preventionTips: [
      'Remove infected lower leaves and keep them away from the field.',
      'Stake plants and improve airflow to dry the canopy faster.',
      'Avoid overhead irrigation in the evening.',
    ],
  },
  {
    disease: 'Onion Purple Blotch',
    defaultCrop: 'Onion',
    defaultSeverity: 'Moderate',
    summary:
      'Alternaria porri produces purple-centred leaf spots that can collapse the photosynthetic canopy. Begin a protectant fungicide programme as soon as lesions appear.',
    symptomKeywords: [
      'purple-centred leaf spots',
      'white sunken lesions',
      'leaf tip dieback',
      'bulb neck infection',
    ],
    primaryProductIds: ['indofil-m45', 'blitox-50-wp'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil', 't-stanes-bioderma-viride'],
    preventionTips: [
      'Rotate onion with a non-host crop for at least two seasons.',
      'Avoid dense planting and overhead irrigation.',
      'Remove volunteer onion plants that can carry the pathogen.',
    ],
  },
  {
    disease: 'Sugarcane Red Rot',
    defaultCrop: 'Sugarcane',
    defaultSeverity: 'High',
    summary:
      'Colletotrichum falcatum rots the internal cane tissue and can wipe out infected stools. Remove affected clumps, improve drainage and protect the remaining root zone.',
    symptomKeywords: [
      'reddish internal cane rot',
      'alcohol-sour odour',
      'drying crown leaves',
      'white fungal growth at nodes',
    ],
    primaryProductIds: ['blitox-50-wp', 'amistar-top-325'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['t-stanes-bioderma-viride'],
    preventionTips: [
      'Use disease-free seed setts from a certified nursery.',
      'Avoid waterlogging and improve field drainage.',
      'Uproot and destroy severely infected stools before replanting.',
    ],
  },
  {
    disease: 'Soybean Rust',
    defaultCrop: 'Soybean',
    defaultSeverity: 'Moderate',
    summary:
      'Phakopsora pachyrhizi creates small rust pustules that rapidly defoliate soybean. Protect the canopy at first pustules and rotate fungicide modes of action.',
    symptomKeywords: [
      'orange-brown pustules',
      'yellowing upper leaves',
      'premature defoliation',
      'pustules on leaf undersides',
    ],
    primaryProductIds: ['tilt-250-ec', 'amistar-top-325'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil', 't-stanes-bioderma-viride'],
    preventionTips: [
      'Monitor the lower canopy weekly during humid weather.',
      'Avoid late sowing and excessive plant density.',
      'Rotate triazole and strobilurin fungicides between sprays.',
    ],
  },
  {
    disease: 'Paddy Blast',
    defaultCrop: 'Paddy',
    defaultSeverity: 'High',
    summary:
      'Magnaporthe oryzae causes spindle-shaped leaf lesions and neck rot that can severely reduce grain filling. Treat at boot leaf and protect the panicle during flowering.',
    symptomKeywords: [
      'spindle-shaped grey lesions',
      'brown lesion margins',
      'neck rot on panicles',
      'empty or chaffy grains',
    ],
    primaryProductIds: ['amistar-top-325', 'tilt-250-ec'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['t-stanes-bioderma-viride', 'katyayani-neem-oil'],
    preventionTips: [
      'Avoid excess nitrogen, which makes the canopy more susceptible.',
      'Keep the field drained during active tillering.',
      'Use certified seed and remove infected stubble after harvest.',
    ],
  },
  {
    disease: 'Wheat Yellow Rust',
    defaultCrop: 'Wheat',
    defaultSeverity: 'Moderate',
    summary:
      'Puccinia striiformis forms yellow stripe pustules that drain the flag leaf. Early triazole protection preserves grain fill and prevents a field-wide outbreak.',
    symptomKeywords: [
      'yellow stripe pustules',
      'powdery spore masses',
      'leaf chlorosis',
      'early flag-leaf drying',
    ],
    primaryProductIds: ['tilt-250-ec', 'amistar-top-325'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil'],
    preventionTips: [
      'Sow rust-resistant wheat varieties where available.',
      'Avoid late sowing and excessive nitrogen application.',
      'Scout the lower canopy weekly during cool, humid weather.',
    ],
  },
  {
    disease: 'Cotton Bollworm',
    defaultCrop: 'Cotton',
    defaultSeverity: 'High',
    summary:
      'Helicoverpa armigera larvae bore into squares and bolls, causing direct yield loss. Rotate modes of action and conserve natural predators.',
    symptomKeywords: [
      'circular entry holes in bolls',
      'frass on squares',
      'chewed flower buds',
      'larvae inside bolls',
    ],
    primaryProductIds: ['fmc-coragen', 'dhanuka-em-1'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil'],
    preventionTips: [
      'Install pheromone traps to monitor moth activity.',
      'Avoid broad-spectrum sprays that destroy natural enemies.',
      'Rotate insecticide modes of action between generations.',
    ],
  },
  {
    disease: 'Cotton Leaf Curl',
    defaultCrop: 'Cotton',
    defaultSeverity: 'Moderate',
    summary:
      'Cotton leaf curl virus is spread by whiteflies and deforms new growth. Suppress the vector, rogue infected plants and protect the healthy canopy.',
    symptomKeywords: [
      'upward leaf curling',
      'thickened dark veins',
      'stunted new growth',
      'whitefly clusters',
    ],
    primaryProductIds: ['confidor-200-sl', 'syngenta-actara'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'gromor-npk-10-26-26'],
    organicProductIds: ['katyayani-neem-oil'],
    preventionTips: [
      'Use yellow sticky traps to monitor whitefly populations.',
      'Remove and destroy severely infected plants early.',
      'Avoid planting cotton near infected fields or volunteer plants.',
    ],
  },
  {
    disease: 'Spinach Cercospora Leaf Spot',
    defaultCrop: 'Spinach',
    defaultSeverity: 'Moderate',
    summary:
      'Cercospora beticola produces circular grey-centred spots with dark margins on spinach leaves. Remove heavily infected foliage, improve airflow and begin a protectant fungicide programme before the spots merge.',
    symptomKeywords: [
      'circular grey leaf spots',
      'dark brown lesion margins',
      'yellow halos around spots',
      'holes in older leaves',
      'premature leaf drop',
    ],
    primaryProductIds: ['indofil-m45', 'amistar-top-325'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'aries-agromin-max'],
    organicProductIds: ['katyayani-neem-oil-10000'],
    preventionTips: [
      'Remove and destroy infected lower leaves away from the field.',
      'Avoid overhead irrigation and water early so leaves dry before evening.',
      'Rotate spinach with a non-host crop and avoid dense sowing.',
    ],
  },
  {
    disease: 'Spinach Downy Mildew',
    defaultCrop: 'Spinach',
    defaultSeverity: 'High',
    summary:
      'Peronospora farinosa causes pale yellow patches on the upper leaf surface and grey-purple mould underneath. Act quickly in cool, humid weather to protect new growth and neighbouring beds.',
    symptomKeywords: [
      'pale yellow upper-leaf patches',
      'grey-purple underside mould',
      'curling leaf margins',
      'stunted new growth',
      'damping off seedlings',
    ],
    primaryProductIds: ['ridomil-gold-mz', 'blitox-50-wp'],
    recoveryProductIds: ['iffco-npk-19-19-19', 'aries-agromin-max'],
    organicProductIds: ['t-stanes-bioderma-viride'],
    preventionTips: [
      'Improve airflow and avoid dense, shaded spinach beds.',
      'Water at the base in the morning instead of overhead irrigation.',
      'Remove infected leaves and avoid working among wet plants.',
    ],
  },
  {
    disease: 'Spinach Anthracnose',
    defaultCrop: 'Spinach',
    defaultSeverity: 'High',
    summary:
      'Colletotrichum dematium causes dark sunken lesions on spinach leaves and stems, especially during warm, wet spells. Remove infected debris, reduce leaf wetness and protect the remaining canopy.',
    symptomKeywords: [
      'dark sunken leaf lesions',
      'brown stem lesions',
      'shot-hole leaf damage',
      'leaf distortion',
      'seedling damping off',
    ],
    primaryProductIds: ['upl-saaf', 'bayer-nativo-75-wg'],
    recoveryProductIds: ['iffco-sagarika', 'iffco-npk-19-19-19'],
    organicProductIds: ['t-stanes-bioderma-viride'],
    preventionTips: [
      'Use clean, treated seed from a reliable source.',
      'Rotate away from spinach and related crops for at least two seasons.',
      'Remove crop debris and avoid overhead irrigation during humid weather.',
    ],
  },
];

const DISEASE_ALIASES: Record<string, string> = {
  'late blight': 'Late Blight',
  'tomato late blight': 'Late Blight',
  'potato late blight': 'Late Blight',
  'phytophthora infestans': 'Late Blight',
  'लेट ब्लाइट': 'Late Blight',
  'टमाटर लेट ब्लाइट': 'Late Blight',
  'टोमॅटो लेट ब्लाइट': 'Late Blight',
  'टोमॅटोवरील करपा': 'Late Blight',
  'powdery mildew': 'Powdery Mildew',
  'पाउडरी मिल्ड्यू': 'Powdery Mildew',
  'पावडरी मिल्ड्यू': 'Powdery Mildew',
  'भुरी रोग': 'Powdery Mildew',
  भुरी: 'Powdery Mildew',
  'bacterial leaf blight': 'Bacterial Leaf Blight',
  'bacterial blight': 'Bacterial Leaf Blight',
  'leaf blight': 'Bacterial Leaf Blight',
  'बैक्टीरियल लीफ ब्लाइट': 'Bacterial Leaf Blight',
  'जीवाणु पत्ती झुलसा': 'Bacterial Leaf Blight',
  'जिवाणूजन्य पान करपा': 'Bacterial Leaf Blight',
  'पान करपा': 'Bacterial Leaf Blight',
  'leaf rust': 'Leaf Rust',
  rust: 'Leaf Rust',
  'लीफ रस्ट': 'Leaf Rust',
  'पत्ती रतुआ': 'Leaf Rust',
  रतुआ: 'Leaf Rust',
  तांबेरा: 'Leaf Rust',
  'पानावरील तांबेरा': 'Leaf Rust',
  'aphid infestation': 'Aphid Infestation',
  aphid: 'Aphid Infestation',
  aphids: 'Aphid Infestation',
  'माहू का प्रकोप': 'Aphid Infestation',
  माहू: 'Aphid Infestation',
  'मावा प्रादुर्भाव': 'Aphid Infestation',
  मावा: 'Aphid Infestation',
  'nitrogen deficiency': 'Nitrogen Deficiency',
  'nitrogen deficiency symptoms': 'Nitrogen Deficiency',
  'नाइट्रोजन की कमी': 'Nitrogen Deficiency',
  'नाइट्रोजन कमी': 'Nitrogen Deficiency',
  'नायट्रोजनची कमतरता': 'Nitrogen Deficiency',
  'नायट्रोजन कमतरता': 'Nitrogen Deficiency',
  'tomato early blight': 'Tomato Early Blight',
  'tomato blight': 'Tomato Early Blight',
  'early blight': 'Tomato Early Blight',
  'alternaria solani': 'Tomato Early Blight',
  'onion purple blotch': 'Onion Purple Blotch',
  'purple blotch': 'Onion Purple Blotch',
  'alternaria porri': 'Onion Purple Blotch',
  'sugarcane red rot': 'Sugarcane Red Rot',
  'red rot': 'Sugarcane Red Rot',
  'colletotrichum falcatum': 'Sugarcane Red Rot',
  'soybean rust': 'Soybean Rust',
  'phakopsora pachyrhizi': 'Soybean Rust',
  'paddy blast': 'Paddy Blast',
  'rice blast': 'Paddy Blast',
  'magnaporthe oryzae': 'Paddy Blast',
  'wheat yellow rust': 'Wheat Yellow Rust',
  'yellow rust': 'Wheat Yellow Rust',
  'stripe rust': 'Wheat Yellow Rust',
  'puccinia striiformis': 'Wheat Yellow Rust',
  'cotton bollworm': 'Cotton Bollworm',
  bollworm: 'Cotton Bollworm',
  'helicoverpa armigera': 'Cotton Bollworm',
  'cotton leaf curl': 'Cotton Leaf Curl',
  'cotton leaf curl virus': 'Cotton Leaf Curl',
  'leaf curl': 'Cotton Leaf Curl',
  'spinach cercospora leaf spot': 'Spinach Cercospora Leaf Spot',
  'cercospora leaf spot': 'Spinach Cercospora Leaf Spot',
  'cercospora beticola': 'Spinach Cercospora Leaf Spot',
  'spinach downy mildew': 'Spinach Downy Mildew',
  'peronospora farinosa': 'Spinach Downy Mildew',
  'spinach anthracnose': 'Spinach Anthracnose',
  'colletotrichum dematium': 'Spinach Anthracnose',
};

const KNOWN_CROPS = [
  'Tomato',
  'Potato',
  'Wheat',
  'Rice',
  'Onion',
  'Soybean',
  'Cotton',
  'Sugarcane',
  'Grapes',
  'Chilli',
  'Maize',
  'Spinach',
] as const;

const CROP_ALIASES: Record<string, string> = {
  paddy: 'Rice',
  spinach: 'Spinach',
  palak: 'Spinach',
  'spinacia oleracea': 'Spinach',
  टमाटर: 'Tomato',
  टोमॅटो: 'Tomato',
  आलू: 'Potato',
  बटाटा: 'Potato',
  गेहूं: 'Wheat',
  गहू: 'Wheat',
  धान: 'Rice',
  भात: 'Rice',
  कपास: 'Cotton',
  कापूस: 'Cotton',
  गन्ना: 'Sugarcane',
  ऊस: 'Sugarcane',
  अंगूर: 'Grapes',
  द्राक्ष: 'Grapes',
  मिर्च: 'Chilli',
  मिरची: 'Chilli',
  मक्का: 'Maize',
  मका: 'Maize',
};

const ROLE_LABELS: Record<TreatmentRole, string> = {
  primary: 'Primary Cure',
  recovery: 'Recovery & Soil Nutrition',
  organic: 'Organic Alternative',
};

export function canonicalizeDisease(input?: string | null): string | null {
  if (!input) return null;

  const normalized = input
    .toLowerCase()
    .replace(/[_/|,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  const aliasKeys = Object.keys(DISEASE_ALIASES).sort(
    (a, b) => b.length - a.length
  );

  for (const alias of aliasKeys) {
    if (normalized === alias || normalized.includes(alias)) {
      return DISEASE_ALIASES[alias];
    }
  }

  return null;
}

export function normalizeCrop(input?: string | null): string | null {
  if (!input) return null;

  const normalized = input.toLowerCase().trim();
  const aliasKeys = Object.keys(CROP_ALIASES).sort(
    (a, b) => b.length - a.length
  );

  for (const alias of aliasKeys) {
    if (normalized.includes(alias)) {
      return CROP_ALIASES[alias];
    }
  }

  const match = KNOWN_CROPS.find((crop) =>
    normalized.includes(crop.toLowerCase())
  );

  return match ?? null;
}

export function normalizeSeverity(
  input?: string | number | null,
  confidence?: number | null
): SeverityLevel {
  if (typeof input === 'string') {
    const value = input.toLowerCase().trim();

    if (['high', 'severe', 'critical'].includes(value)) return 'High';
    if (['moderate', 'medium', 'mid'].includes(value)) return 'Moderate';
    if (['low', 'mild', 'minor'].includes(value)) return 'Low';
  }

  if (typeof input === 'number') {
    if (input >= 7) return 'High';
    if (input >= 4) return 'Moderate';
    return 'Low';
  }

  if (typeof confidence === 'number') {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.65) return 'Moderate';
    return 'Low';
  }

  return 'Moderate';
}

export function getDiseaseProfile(
  diseaseInput?: string | null
): DiseaseProfile | undefined {
  const disease = canonicalizeDisease(diseaseInput);
  if (!disease) return undefined;

  return DISEASE_PROFILES.find((profile) => profile.disease === disease);
}

export function getDiseaseOptions(): DiseaseProfile[] {
  return DISEASE_PROFILES;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return null;
}

function readString(
  record: Record<string, unknown> | null,
  keys: string[]
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(
  record: Record<string, unknown> | null,
  keys: string[]
): number | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function normalizeConfidence(value: number | null): number | undefined {
  if (value === null) return undefined;

  const ratio = value > 1 && value <= 100 ? value / 100 : value;
  if (!Number.isFinite(ratio)) return undefined;

  return Math.max(0, Math.min(1, ratio));
}

export function normalizeCropDoctorPrediction(
  prediction: unknown,
  cropHint?: string | null,
  severityHint?: string | null
): NormalizedDiagnosis | null {
  const record = toRecord(prediction);

  const rawLabel =
    typeof prediction === 'string'
      ? prediction
      : readString(record, [
          'disease',
          'prediction',
          'disease_name',
          'label',
          'class',
          'className',
        ]);

  const disease = canonicalizeDisease(rawLabel);
  if (!disease) return null;

  const confidence = normalizeConfidence(
    readNumber(record, ['confidence', 'score', 'probability', 'confidence_score'])
  );

  const cropFromPrediction = normalizeCrop(rawLabel);
  const cropFromRecord = normalizeCrop(
    readString(record, ['crop', 'crop_name', 'plant', 'host'])
  );
  const crop =
    normalizeCrop(cropHint) ??
    cropFromRecord ??
    cropFromPrediction ??
    getDiseaseProfile(disease)?.defaultCrop ??
    'Tomato';

  const severityInput =
    readString(record, ['severity', 'severity_level', 'risk']) ?? severityHint;
  const severity = normalizeSeverity(severityInput, confidence ?? undefined);

  return {
    disease,
    crop,
    severity,
    confidence,
    rawLabel: rawLabel ?? undefined,
  };
}

function findRole(
  productId: string,
  profile?: DiseaseProfile
): TreatmentRole | undefined {
  if (!profile) return undefined;
  if (profile.primaryProductIds.includes(productId)) return 'primary';
  if (profile.recoveryProductIds.includes(productId)) return 'recovery';
  if (profile.organicProductIds.includes(productId)) return 'organic';
  return undefined;
}

function pickProduct(
  ids: string[],
  fallbackProducts: AgriProduct[]
): AgriProduct | undefined {
  const available = ids
    .map((id) => AGRI_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is AgriProduct => Boolean(product));

  return (
    available.find((product) => product.inStock) ??
    available[0] ??
    fallbackProducts[0]
  );
}

export function getTreatmentBundle(
  diseaseInput?: string | null,
  cropInput?: string | null,
  severityInput?: string | null
): TreatmentBundle | null {
  const profile = getDiseaseProfile(diseaseInput);
  if (!profile) return null;

  const crop = normalizeCrop(cropInput) ?? profile.defaultCrop;
  const severity =
    severityInput && severityInput.trim()
      ? normalizeSeverity(severityInput)
      : profile.defaultSeverity;

  const matchingProducts = AGRI_PRODUCTS.filter((product) =>
    product.targetDiseases.includes(profile.disease)
  );

  const primary = pickProduct(profile.primaryProductIds, matchingProducts);
  const recovery = pickProduct(profile.recoveryProductIds, matchingProducts);
  const organic = pickProduct(profile.organicProductIds, matchingProducts);

  if (!primary || !recovery || !organic) return null;

  const seen = new Set<string>();
  const products = [primary, recovery, organic].filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });

  const slots = (
    [
      {
        role: 'primary',
        label: ROLE_LABELS.primary,
        product: primary,
      },
      {
        role: 'recovery',
        label: ROLE_LABELS.recovery,
        product: recovery,
      },
      {
        role: 'organic',
        label: ROLE_LABELS.organic,
        product: organic,
      },
    ] satisfies TreatmentSlot[]
  ).filter((slot) =>
    products.some((product) => product.id === slot.product.id)
  );

  return {
    disease: profile.disease,
    crop,
    severity,
    profile,
    primary,
    recovery,
    organic,
    slots,
    products,
    totalPrice: products.reduce((sum, product) => sum + product.price, 0),
    totalOriginalPrice: products.reduce(
      (sum, product) => sum + product.originalPrice,
      0
    ),
  };
}

export function getProductMatchScore(
  product: AgriProduct,
  diseaseInput?: string | null,
  cropInput?: string | null
): number | null {
  const disease = canonicalizeDisease(diseaseInput);
  if (!disease) return null;

  const profile = getDiseaseProfile(disease);
  const crop = normalizeCrop(cropInput) ?? profile?.defaultCrop ?? null;
  const role = findRole(product.id, profile);
  const targetsDisease = product.targetDiseases.includes(disease);

  let score = targetsDisease ? 84 : role ? 80 : 48;

  if (
    crop &&
    product.suitableCrops.some(
      (productCrop) => productCrop.toLowerCase() === crop.toLowerCase()
    )
  ) {
    score += 6;
  }

  if (targetsDisease) score += 2;
  if (role === 'primary') score += 6;
  if (role === 'recovery') score += 4;
  if (role === 'organic') score += 3;
  if (product.inStock) score += 2;
  else score -= 14;

  score += Math.round((product.rating - 4.3) * 4);

  return Math.max(35, Math.min(98, score));
}

export function getRecommendedProducts(
  diseaseInput?: string | null,
  cropInput?: string | null
): AgriProduct[] {
  const bundle = getTreatmentBundle(diseaseInput, cropInput);
  if (!bundle) return [];

  const scored = AGRI_PRODUCTS.map((product) => ({
    product,
    score: getProductMatchScore(product, diseaseInput, cropInput) ?? 0,
    role: findRole(product.id, bundle.profile),
  }));

  return scored
    .filter(
      (entry) =>
        entry.role !== undefined ||
        entry.product.targetDiseases.includes(bundle.disease)
    )
    .sort((a, b) => {
      if (a.role && !b.role) return -1;
      if (!a.role && b.role) return 1;
      if (b.score !== a.score) return b.score - a.score;
      return b.product.rating - a.product.rating;
    })
    .map((entry) => entry.product);
}

export function productMatchesQuery(
  product: AgriProduct,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const symptomKeywords = product.targetDiseases.flatMap(
    (disease) => getDiseaseProfile(disease)?.symptomKeywords ?? []
  );

  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.activeIngredients,
    product.unit,
    product.description,
    product.dosagePerAcre,
    product.applicationMethod,
    ...product.targetDiseases,
    ...product.suitableCrops,
    ...symptomKeywords,
  ]
    .join(' ')
    .toLowerCase();

  return normalizedQuery
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

export function getRoleLabel(role: TreatmentRole): string {
  return ROLE_LABELS[role];
}

export function findTreatmentRole(
  productId: string,
  diseaseInput?: string | null
): TreatmentRole | undefined {
  return findRole(productId, getDiseaseProfile(diseaseInput));
}
