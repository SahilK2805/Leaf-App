from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
import logging
import os
import numpy as np
from utils import convert_image_to_base64_and_test, test_with_base64_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Leaf Disease Detection API", version="1.0.0")

@app.post('/disease-detection-file')
async def disease_detection_file(file: UploadFile = File(...)):
    """
    Endpoint to detect diseases in leaf images using direct image file upload.
    Accepts multipart/form-data with an image file.
    """
    try:
        logger.info("Received image file for disease detection")
        
        # Read uploaded file into memory
        contents = await file.read()
        logger.info(f"Read {len(contents)} bytes from uploaded file")
        
    # Process file directly from memory
        result = convert_image_to_base64_and_test(contents)
        logger.info(f"Image processing completed. Result type: {type(result)}")
        
    # No cleanup needed since file is not saved locally
        
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to process image file")
        
        # Convert NumPy types to Python native types for JSON serialization
        def convert_numpy_types(obj):
            """Recursively convert NumPy types to native Python types"""
            if isinstance(obj, (np.integer, np.intc, np.intp, np.int8,
                               np.int16, np.int32, np.int64, np.uint8, np.uint16,
                               np.uint32, np.uint64)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float16, np.float32, np.float64)):
                return float(obj)
            elif isinstance(obj, (np.bool_)):
                return bool(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {key: convert_numpy_types(value) for key, value in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [convert_numpy_types(item) for item in obj]
            else:
                return obj
        
        # Convert the result
        result = convert_numpy_types(result)
        
        # Debug: Log if feature_analysis is present
        if "feature_analysis" in result:
            logger.info(f"Feature analysis included: {len(result.get('feature_analysis', {}))} keys")
        else:
            logger.warning("Feature analysis NOT found in result")
            logger.info(f"Result keys: {list(result.keys())}")
        
        logger.info("Disease detection from file completed successfully")
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error in disease detection (file): {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint providing API information"""
    return {
        "message": "Leaf Disease Detection API",
        "version": "1.0.0",
        "endpoints": {
            "disease_detection_file": "/disease-detection-file (POST, file upload)"
        }
    }
