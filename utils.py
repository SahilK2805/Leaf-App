"""
Base64 Image Test for Leaf Disease Detection
===========================================

This script demonstrates how to send base64 image data directly to the detector.
"""

import json
import sys,os
import base64
from pathlib import Path

# Add the Leaf Disease directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "Leaf Disease"))

try:
    from main import LeafDiseaseDetector
except ImportError as e:
    print(f'{{"error": "Could not import LeafDiseaseDetector: {str(e)}"}}')
    sys.exit(1)


def test_with_base64_data(base64_image_string: str):
    """
    Test disease detection with base64 image data

    Args:
        base64_image_string (str): Base64 encoded image data
    """
    import traceback
    try:
        detector = LeafDiseaseDetector()
        print("Detector initialized, calling analyze_leaf_image_base64...")
        result = detector.analyze_leaf_image_base64(base64_image_string)
        print("Analysis complete")
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        print(f'ERROR in test_with_base64_data: {str(e)}')
        print(f'Traceback: {traceback.format_exc()}')
        return None


def convert_image_to_base64_and_test(image_bytes: bytes):
    """
    Convert image bytes to base64 and test it

    Args:
        image_bytes (bytes): Image data in bytes
    """
    import traceback
    try:
        if not image_bytes:
            print('{"error": "No image bytes provided"}')
            return None

        base64_string = base64.b64encode(image_bytes).decode('utf-8')
        print(f"Converted image to base64 ({len(base64_string)} characters)")
        result = test_with_base64_data(base64_string)
        if result is None:
            print("ERROR: test_with_base64_data returned None")
        return result
    except Exception as e:
        print(f'ERROR in convert_image_to_base64_and_test: {str(e)}')
        print(f'Traceback: {traceback.format_exc()}')
        return None


def main():
    """Test with base64 conversion"""
    image_path = "Media/brown-spot-4 (1).jpg"
    convert_image_to_base64_and_test(image_path)


if __name__ == "__main__":
    main()
