from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError
from io import BytesIO

app = FastAPI(
    title="Future Farming ML Service",
    description="Crop disease detection API",
    version="1.0.0",
)


@app.get("/")
def health_check():
    return {
        "message": "Future Farming ML Service is running!",
        "status": "OK",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/crop/analyze")
async def analyze_crop(image: UploadFile = File(...)):
    if image.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WEBP image.",
        )

    contents = await image.read()

    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 5 MB.",
        )

    try:
        with Image.open(BytesIO(contents)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    # The image is validated, but no trained model is loaded yet.
    return {
        "success": True,
        "message": "Image received and validated successfully.",
        "prediction": None,
        "model_connected": False,
        "next_step": (
            "Connect a trained crop disease classification model "
            "to generate real predictions."
        ),
    }