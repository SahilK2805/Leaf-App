import os
import json
import logging
import sys
from typing import Dict, Optional, List, Any
from dataclasses import dataclass, field
from datetime import datetime

from groq import Groq
from dotenv import load_dotenv

# Import image feature analyzer
try:
    from .image_features import LeafImageAnalyzer
except ImportError:
    from image_features import LeafImageAnalyzer


# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class DiseaseAnalysisResult:
    """
    Data class for storing comprehensive disease analysis results.

    This class encapsulates all the information returned from a leaf disease
    analysis, including detection status, disease identification, severity
    assessment, treatment recommendations, and comprehensive feature analysis.

    Attributes:
        disease_detected (bool): Whether a disease was detected in the leaf image
        disease_name (Optional[str]): Name of the identified disease, None if healthy
        disease_type (str): Category of disease (fungal, bacterial, viral, pest, etc.)
        severity (str): Severity level (mild, moderate, severe, none)
        confidence (float): Confidence score (0-100)
        symptoms (List[str]): List of observed symptoms
        possible_causes (List[str]): List of possible causes
        treatment (List[str]): List of treatment recommendations
        analysis_timestamp (str): Timestamp of analysis
        feature_analysis (Dict): Comprehensive feature analysis including all 12 features
        farmer_recommendations (Dict): Farmer-specific recommendations including economic impact
    """
    disease_detected: bool
    disease_name: Optional[str]
    disease_type: str
    severity: str
    confidence: float
    symptoms: List[str]
    possible_causes: List[str]
    treatment: List[str]
    analysis_timestamp: str = field(default_factory=lambda: datetime.now().astimezone().isoformat())
    feature_analysis: Dict[str, Any] = field(default_factory=dict)
    farmer_recommendations: Dict[str, Any] = field(default_factory=dict)


class LeafDiseaseDetector:
    """
    Advanced Leaf Disease Detection System using AI Vision Analysis.

    This class provides comprehensive leaf disease detection capabilities using
    the Groq API with Llama Vision models. It can analyze leaf images to identify
    diseases, assess severity, and provide treatment recommendations. The system
    also validates that uploaded images contain actual plant leaves and rejects
    images of humans, animals, or other non-plant objects.

    The system supports base64 encoded images and returns structured JSON results
    containing disease information, confidence scores, symptoms, causes, and
    treatment suggestions.

    Features:
        - Image validation (ensures uploaded images contain plant leaves)
        - Multi-disease detection (fungal, bacterial, viral, pest, nutrient deficiency)
        - Severity assessment (mild, moderate, severe)
        - Confidence scoring (0-100%)
        - Symptom identification
        - Treatment recommendations
        - Robust error handling and response parsing
        - Invalid image type detection and rejection

    Attributes:
        MODEL_NAME (str): The AI model used for analysis
        DEFAULT_TEMPERATURE (float): Default temperature for response generation
        DEFAULT_MAX_TOKENS (int): Default maximum tokens for responses
        api_key (str): Groq API key for authentication
        client (Groq): Groq API client instance

    Example:
        >>> detector = LeafDiseaseDetector()
        >>> result = detector.analyze_leaf_image_base64(base64_image_data)
        >>> if result['disease_type'] == 'invalid_image':
        ...     print("Please upload a plant leaf image")
        >>> elif result['disease_detected']:
        ...     print(f"Disease detected: {result['disease_name']}")
        >>> else:
        ...     print("Healthy leaf detected")
    """

    MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"
    DEFAULT_TEMPERATURE = 0.3
    DEFAULT_MAX_TOKENS = 2048  # Increased for comprehensive feature analysis

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Leaf Disease Detector with API credentials.

        Sets up the Groq API client and validates the API key from either
        the parameter or environment variables. Initializes logging for
        tracking analysis operations.

        Args:
            api_key (Optional[str]): Groq API key. If None, will attempt to
                                   load from GROQ_API_KEY environment variable.

        Raises:
            ValueError: If no valid API key is found in parameters or environment.

        Note:
            Ensure your .env file contains GROQ_API_KEY or pass it directly.
        """
        load_dotenv()
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=self.api_key)
        self.image_analyzer = LeafImageAnalyzer()
        logger.info("Leaf Disease Detector initialized with comprehensive feature analysis")

    def create_analysis_prompt(self, feature_summary: Optional[Dict] = None) -> str:
        """
        Create the standardized analysis prompt for the AI model with comprehensive feature evaluation.

        Generates a comprehensive prompt that instructs the AI model to analyze
        leaf images for diseases and evaluate all 12 key features. The prompt
        specifies the required output format and analysis criteria.

        Args:
            feature_summary (Optional[Dict]): Summary of computer vision extracted features

        Returns:
            str: Formatted prompt string with instructions for disease analysis
                 and comprehensive feature evaluation.
        """
        feature_context = ""
        if feature_summary:
            feature_context = f"""
            
COMPUTER VISION ANALYSIS SUMMARY (for reference):
- Leaf Color: {feature_summary.get('color_status', 'N/A')}
- Color Uniformity: {feature_summary.get('uniformity_status', 'N/A')}
- Texture: {feature_summary.get('texture_status', 'N/A')}
- Lesions/Spots: {feature_summary.get('lesion_status', 'N/A')}
- Shape: {feature_summary.get('shape_status', 'N/A')}
- Edge Condition: {feature_summary.get('edge_status', 'N/A')}
- Overall Health: {feature_summary.get('health_status', 'N/A')}
"""
        
        return f"""IMPORTANT: First determine if this image contains a plant leaf or vegetation. If the image shows humans, animals, objects, buildings, or anything other than plant leaves/vegetation, return the "invalid_image" response format below.

If this is a valid leaf/plant image, perform COMPREHENSIVE ANALYSIS evaluating all 12 key features and return results in JSON format.

COMPREHENSIVE FEATURE EVALUATION REQUIRED:

1️⃣ LEAF COLOR (MOST IMPORTANT):
   - Evaluate green intensity (chlorophyll proxy)
   - Detect yellowing (nitrogen deficiency indicator)
   - Detect pale color (iron deficiency indicator)
   - Detect dark green (excess nitrogen indicator)
   - Provide color assessment: "Healthy Green" / "Yellowing" / "Pale" / "Dark Green" / "Moderate"

2️⃣ COLOR UNIFORMITY:
   - Check if leaf color is evenly distributed
   - Detect patchy or uneven coloration
   - Assess: "Uniform (Healthy)" / "Patchy (Stress/Deficiency/Disease)" / "Moderately Uniform"

3️⃣ LEAF TEXTURE:
   - Analyze surface patterns
   - Detect smooth vs rough/spotted/wrinkled texture
   - Assess: "Smooth (Healthy)" / "Rough/Spotted (Disease or Stress)" / "Moderate Texture"

4️⃣ SPOTS / LESIONS / DISCOLORATION:
   - Identify brown spots
   - Identify white patches
   - Identify black lesions
   - Identify yellow margins
   - Assess severity: "No Significant Lesions" / "Mild" / "Moderate" / "Severe Lesions/Discoloration"

5️⃣ LEAF SHAPE & DEFORMATION:
   - Detect curling, folding, shrinking, twisting
   - Assess: "Normal Shape" / "Mild Deformation" / "Deformed (Curling/Folding/Shrinking)"

6️⃣ LEAF EDGE (MARGIN) CONDITION:
   - Check for burnt edges (potassium deficiency)
   - Check for yellow edges (magnesium deficiency)
   - Check for dry margins (water stress)
   - Assess: "Healthy Edges" / "Burnt Edges" / "Yellow Edges" / "Dry Margins" / "Moderate Edge Issues"

7️⃣ LEAF SIZE & AREA:
   - Evaluate leaf area and relative size
   - Detect stunted growth
   - Assess: "Normal/Large Size" / "Moderate Size" / "Small Size (Stunted Growth)"

8️⃣ VEIN COLOR & VISIBILITY:
   - Detect green veins with yellow surface (iron deficiency)
   - Detect prominent veins (stress indicators)
   - Assess: "Normal Vein Visibility" / "Green Veins + Yellow Surface (Iron Deficiency)" / "Prominent Veins (Stress)"

9️⃣ GLOSSINESS / DULLNESS:
   - Evaluate surface reflection
   - Assess: "Glossy (Healthy)" / "Dull/Dusty (Stress or Aging)" / "Moderate Glossiness"

🔟 STRESS INDICATORS (OVERALL HEALTH SCORE):
   - Combine all features to classify:
   - "🟢 Healthy" / "🟡 Mild Stress" / "🔴 Severe Stress"

1️⃣1️⃣ CHLOROPHYLL INDEX (ADVANCED):
   - Estimate from green channel intensity
   - Assess nitrogen level and photosynthesis efficiency
   - Provide: "High (Good Nitrogen)" / "Moderate" / "Low (Nitrogen Deficiency)"

1️⃣2️⃣ LEAF pH PROXY (ADVANCED - INDIRECT ESTIMATION):
   - Estimate indirectly from color changes, stress patterns, chlorophyll level, texture
   - Provide: "Low pH (Acidic)" / "Normal pH" / "High pH (Alkaline)"
   - Note: This is an indirect estimate, not exact numeric value
{feature_context}

For NON-LEAF images, return:
{{
    "disease_detected": false,
    "disease_name": null,
    "disease_type": "invalid_image",
    "severity": "none",
    "confidence": 95,
    "symptoms": ["This image does not contain a plant leaf"],
    "possible_causes": ["Invalid image type uploaded"],
    "treatment": ["Please upload an image of a plant leaf for disease analysis"],
    "feature_evaluation": {{
        "1_leaf_color": {{"assessment": "N/A - Invalid Image"}},
        "2_color_uniformity": {{"assessment": "N/A - Invalid Image"}},
        "3_leaf_texture": {{"assessment": "N/A - Invalid Image"}},
        "4_spots_lesions": {{"assessment": "N/A - Invalid Image"}},
        "5_shape_deformation": {{"assessment": "N/A - Invalid Image"}},
        "6_edge_condition": {{"assessment": "N/A - Invalid Image"}},
        "7_size_area": {{"assessment": "N/A - Invalid Image"}},
        "8_vein_visibility": {{"assessment": "N/A - Invalid Image"}},
        "9_glossiness": {{"assessment": "N/A - Invalid Image"}},
        "10_stress_indicators": {{"health_status": "N/A - Invalid Image"}},
        "11_chlorophyll_index": {{"assessment": "N/A - Invalid Image"}},
        "12_ph_proxy": {{"ph_estimate": "N/A - Invalid Image"}}
    }}
}}

For VALID LEAF images, return this COMPREHENSIVE format:
{{
    "disease_detected": true/false,
    "disease_name": "name of disease or null",
    "disease_type": "fungal/bacterial/viral/pest/nutrient deficiency/healthy",
    "severity": "mild/moderate/severe/none",
    "confidence": 85,
    "symptoms": ["list", "of", "symptoms"],
    "possible_causes": ["list", "of", "causes"],
    "treatment": ["list", "of", "treatments"],
    "farmer_recommendations": {{
        "action_urgency": "Immediate (1-2 days) / Soon (3-7 days) / Monitor (7-14 days) / No urgent action",
        "economic_impact": "High risk - may lose 30-70% yield / Moderate risk - 10-30% yield loss / Low risk - less than 10% impact / No economic impact",
        "prevention_tips": ["tip 1 to prevent disease spread", "tip 2 for future crops"],
        "organic_solutions": ["natural/organic treatment option 1", "organic option 2"],
        "chemical_solutions": ["chemical treatment option 1 with recommended dosage", "option 2"],
        "estimated_recovery_time": "2-3 weeks with treatment / 4-6 weeks / Disease is severe, may not recover",
        "spread_risk": "High - isolate immediately / Moderate - monitor nearby plants / Low - contained",
        "harvest_recommendation": "Safe to harvest / Wait 2-3 weeks after treatment / Do not harvest - contaminated",
        "spray_window": "Best time to spray (early morning/evening), avoid rain or strong wind",
        "application_recipe": ["step 1 mix instructions", "step 2 application pattern", "step 3 aftercare"],
        "supply_checklist": ["gloves", "mask", "clean sprayer", "measuring cup", "soap/bleach for cleanup"],
        "isolation_sanitation": ["isolate sick plants", "sanitize tools before/after", "avoid walking from sick to healthy rows"],
        "water_nutrition": "Irrigation and fertilization guidance that fits this disease/severity",
        "scouting_checklist": ["what to re-check over the next 7 days", "leaves/branches/soil cues to watch"],
        "rescan_reminder": "When to take the next photo to verify recovery",
        "harvest_withdrawal": "Waiting period before harvest after any chemical spray",
        "photo_tip": "How to take a clearer leaf photo next time for better AI analysis",
        "product_recommendations": [
            {{
                "product_name": "Product name farmers can buy",
                "store": "Amazon or Flipkart",
                "url": "https://... (use a real, currently available product link from Amazon.in or Flipkart)",
                "price_hint": "INR price range if known",
                "usage_note": "How/when to use it for this disease"
            }}
        ]
    }},
    "feature_evaluation": {{
        "1_leaf_color": {{
            "green_intensity": "high/moderate/low",
            "yellowing_detected": true/false,
            "pale_detected": true/false,
            "dark_green_detected": true/false,
            "assessment": "Healthy Green / Yellowing / Pale / Dark Green / Moderate",
            "nutrient_indicators": ["nitrogen deficiency" if yellowing, "iron deficiency" if pale, etc.]
        }},
        "2_color_uniformity": {{
            "is_uniform": true/false,
            "patchiness_detected": true/false,
            "assessment": "Uniform (Healthy) / Patchy (Stress/Deficiency/Disease) / Moderately Uniform"
        }},
        "3_leaf_texture": {{
            "texture_type": "smooth/rough/spotted/wrinkled",
            "abnormalities_detected": true/false,
            "assessment": "Smooth (Healthy) / Rough/Spotted (Disease or Stress) / Moderate Texture"
        }},
        "4_spots_lesions_discoloration": {{
            "brown_spots": true/false,
            "white_patches": true/false,
            "black_lesions": true/false,
            "yellow_margins": true/false,
            "severity": "none/mild/moderate/severe",
            "assessment": "No Significant Lesions / Mild / Moderate / Severe Lesions/Discoloration"
        }},
        "5_leaf_shape_deformation": {{
            "deformation_detected": true/false,
            "deformation_type": "curling/folding/shrinking/twisting/none",
            "assessment": "Normal Shape / Mild Deformation / Deformed"
        }},
        "6_leaf_edge_condition": {{
            "burnt_edges": true/false,
            "yellow_edges": true/false,
            "dry_margins": true/false,
            "assessment": "Healthy Edges / Burnt Edges (Potassium Deficiency) / Yellow Edges (Magnesium Deficiency) / Dry Margins (Water Stress)"
        }},
        "7_leaf_size_area": {{
            "size_assessment": "normal/moderate/small",
            "stunted_growth": true/false,
            "assessment": "Normal/Large Size / Moderate Size / Small Size (Stunted Growth)"
        }},
        "8_vein_color_visibility": {{
            "vein_visibility": "normal/prominent/not_visible",
            "green_veins_yellow_surface": true/false,
            "iron_deficiency_indicator": true/false,
            "assessment": "Normal Vein Visibility / Green Veins + Yellow Surface (Iron Deficiency) / Prominent Veins (Stress)"
        }},
        "9_glossiness_dullness": {{
            "surface_quality": "glossy/dull/moderate",
            "assessment": "Glossy (Healthy) / Dull/Dusty (Stress or Aging) / Moderate Glossiness"
        }},
        "10_stress_indicators": {{
            "health_status": "🟢 Healthy / 🟡 Mild Stress / 🔴 Severe Stress",
            "stress_level": "low/moderate/high",
            "overall_assessment": "Healthy / Mild Stress / Severe Stress"
        }},
        "11_chlorophyll_index": {{
            "chlorophyll_level": "high/moderate/low",
            "nitrogen_level_estimate": "high/moderate/low",
            "assessment": "High (Good Nitrogen Level) / Moderate / Low (Possible Nitrogen Deficiency)"
        }},
        "12_ph_proxy": {{
            "ph_estimate": "Low pH (Acidic) / Normal pH / High pH (Alkaline)",
            "confidence": "Low (Indirect Estimation)",
            "indicators": ["list of indicators used for estimation"]
        }}
    }}
}}

IMPORTANT: Provide detailed, accurate evaluation for ALL 12 features. This analysis helps farmers understand their crop health comprehensively."""

    def analyze_leaf_image_base64(self, base64_image: str,
                                  temperature: float = None,
                                  max_tokens: int = None) -> Dict:
        """
        Analyze base64 encoded image data for leaf diseases with comprehensive feature analysis.

        First validates that the image contains a plant leaf. If the image shows
        humans, animals, objects, or other non-plant content, returns an 
        'invalid_image' response. For valid leaf images, performs comprehensive
        disease analysis including all 12 feature evaluations.

        Args:
            base64_image (str): Base64 encoded image data (without data:image prefix)
            temperature (float, optional): Model temperature for response generation
            max_tokens (int, optional): Maximum tokens for response

        Returns:
            Dict: Analysis results as dictionary (JSON serializable)
                 - For invalid images: disease_type will be 'invalid_image'
                 - For valid leaves: comprehensive disease analysis with all 12 features

        Raises:
            Exception: If analysis fails
        """
        try:
            logger.info("Starting comprehensive analysis for base64 image data")

            # Validate base64 input
            if not isinstance(base64_image, str):
                raise ValueError("base64_image must be a string")

            if not base64_image:
                raise ValueError("base64_image cannot be empty")

            # Clean base64 string (remove data URL prefix if present)
            clean_base64 = base64_image
            if base64_image.startswith('data:'):
                clean_base64 = base64_image.split(',', 1)[1]

            # Extract computer vision features first
            logger.info("Extracting computer vision features...")
            cv_features = self.image_analyzer.analyze_complete(clean_base64)
            
            # Create feature summary for AI prompt
            feature_summary = {}
            if "10_stress_indicators" in cv_features:
                feature_summary["health_status"] = cv_features["10_stress_indicators"].get("health_status", "N/A")
            if "1_leaf_color" in cv_features:
                feature_summary["color_status"] = cv_features["1_leaf_color"].get("color_status", "N/A")
            if "2_color_uniformity" in cv_features:
                feature_summary["uniformity_status"] = cv_features["2_color_uniformity"].get("uniformity_status", "N/A")
            if "3_leaf_texture" in cv_features:
                feature_summary["texture_status"] = cv_features["3_leaf_texture"].get("texture_status", "N/A")
            if "4_spots_lesions_discoloration" in cv_features:
                feature_summary["lesion_status"] = cv_features["4_spots_lesions_discoloration"].get("lesion_status", "N/A")
            if "5_leaf_shape_deformation" in cv_features:
                feature_summary["shape_status"] = cv_features["5_leaf_shape_deformation"].get("shape_status", "N/A")
            if "6_leaf_edge_condition" in cv_features:
                feature_summary["edge_status"] = cv_features["6_leaf_edge_condition"].get("edge_status", "N/A")

            # Prepare request parameters
            temperature = temperature or self.DEFAULT_TEMPERATURE
            max_tokens = max_tokens or self.DEFAULT_MAX_TOKENS

            # Create enhanced prompt with feature context
            prompt = self.create_analysis_prompt(feature_summary)

            # Make API request
            logger.info("Sending request to AI model for comprehensive analysis...")
            completion = self.client.chat.completions.create(
                model=self.MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{clean_base64}"
                                }
                            }
                        ]
                    }
                ],
                temperature=temperature,
                max_completion_tokens=max_tokens,
                top_p=1,
                stream=False,
                stop=None,
            )

            logger.info("API request completed successfully")
            result = self._parse_response(
                completion.choices[0].message.content, cv_features)

            # Return as dictionary for JSON serialization
            result_dict = result.__dict__
            
            # Convert NumPy types to Python native types for JSON serialization
            import numpy as np
            def convert_numpy_types(obj):
                """Recursively convert NumPy types to native Python types"""
                if isinstance(obj, (np.integer, np.intc, np.intp, np.int8,
                                   np.int16, np.int32, np.int64, np.uint8, np.uint16,
                                   np.uint32, np.uint64)):
                    return int(obj)
                elif isinstance(obj, (np.floating, np.float16, np.float32, np.float64)):
                    return float(obj)
                elif isinstance(obj, np.bool_):
                    return bool(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                elif isinstance(obj, dict):
                    return {key: convert_numpy_types(value) for key, value in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [convert_numpy_types(item) for item in obj]
                else:
                    return obj
            
            result_dict = convert_numpy_types(result_dict)
            
            logger.info(f"Returning result with keys: {list(result_dict.keys())}")
            return result_dict

        except Exception as e:
            logger.error(f"Analysis failed for base64 image data: {str(e)}")
            raise

    def _parse_response(self, response_content: str, cv_features: Dict = None) -> DiseaseAnalysisResult:
        """
        Parse and validate API response with comprehensive feature analysis

        Args:
            response_content (str): Raw response from API
            cv_features (Dict, optional): Computer vision extracted features

        Returns:
            DiseaseAnalysisResult: Parsed and validated results with feature analysis
        """
        try:
            # Clean up response - remove markdown code blocks if present
            cleaned_response = response_content.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response.replace(
                    '```json', '').replace('```', '').strip()
            elif cleaned_response.startswith('```'):
                cleaned_response = cleaned_response.replace('```', '').strip()

            # Parse JSON
            disease_data = json.loads(cleaned_response)
            logger.info("Response parsed successfully as JSON")

            # Extract feature evaluation from AI response
            ai_feature_evaluation = disease_data.get('feature_evaluation', {})
            
            # Merge AI evaluation with computer vision features
            feature_analysis = {}
            if cv_features:
                # Combine CV features with AI evaluation
                feature_analysis = {
                    "computer_vision_analysis": cv_features,
                    "ai_evaluation": ai_feature_evaluation,
                    "combined_analysis": {
                        "1_leaf_color": {
                            **cv_features.get("1_leaf_color", {}),
                            **ai_feature_evaluation.get("1_leaf_color", {})
                        },
                        "2_color_uniformity": {
                            **cv_features.get("2_color_uniformity", {}),
                            **ai_feature_evaluation.get("2_color_uniformity", {})
                        },
                        "3_leaf_texture": {
                            **cv_features.get("3_leaf_texture", {}),
                            **ai_feature_evaluation.get("3_leaf_texture", {})
                        },
                        "4_spots_lesions_discoloration": {
                            **cv_features.get("4_spots_lesions_discoloration", {}),
                            **ai_feature_evaluation.get("4_spots_lesions", {})
                        },
                        "5_leaf_shape_deformation": {
                            **cv_features.get("5_leaf_shape_deformation", {}),
                            **ai_feature_evaluation.get("5_leaf_shape_deformation", {})
                        },
                        "6_leaf_edge_condition": {
                            **cv_features.get("6_leaf_edge_condition", {}),
                            **ai_feature_evaluation.get("6_leaf_edge_condition", {})
                        },
                        "7_leaf_size_area": {
                            **cv_features.get("7_leaf_size_area", {}),
                            **ai_feature_evaluation.get("7_leaf_size_area", {})
                        },
                        "8_vein_color_visibility": {
                            **cv_features.get("8_vein_color_visibility", {}),
                            **ai_feature_evaluation.get("8_vein_color_visibility", {})
                        },
                        "9_glossiness_dullness": {
                            **cv_features.get("9_glossiness_dullness", {}),
                            **ai_feature_evaluation.get("9_glossiness_dullness", {})
                        },
                        "10_stress_indicators": {
                            **cv_features.get("10_stress_indicators", {}),
                            **ai_feature_evaluation.get("10_stress_indicators", {})
                        },
                        "11_chlorophyll_index": {
                            **cv_features.get("11_chlorophyll_index", {}),
                            **ai_feature_evaluation.get("11_chlorophyll_index", {})
                        },
                        "12_ph_proxy": {
                            **cv_features.get("12_ph_proxy", {}),
                            **ai_feature_evaluation.get("12_ph_proxy", {})
                        }
                    }
                }
            else:
                # Use only AI evaluation if CV features not available
                feature_analysis = {"ai_evaluation": ai_feature_evaluation}

            # Validate required fields and create result object
            return DiseaseAnalysisResult(
                disease_detected=bool(
                    disease_data.get('disease_detected', False)),
                disease_name=disease_data.get('disease_name'),
                disease_type=disease_data.get('disease_type', 'unknown'),
                severity=disease_data.get('severity', 'unknown'),
                confidence=float(disease_data.get('confidence', 0)),
                symptoms=disease_data.get('symptoms', []),
                possible_causes=disease_data.get('possible_causes', []),
                treatment=disease_data.get('treatment', []),
                feature_analysis=feature_analysis,
                farmer_recommendations=disease_data.get('farmer_recommendations', {})
            )

        except json.JSONDecodeError:
            logger.warning(
                "Failed to parse as JSON, attempting to extract JSON from response")

            # Try to find JSON in the response using regex
            import re
            json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
            if json_match:
                try:
                    disease_data = json.loads(json_match.group())
                    logger.info("JSON extracted and parsed successfully")

                    # Extract feature evaluation
                    ai_feature_evaluation = disease_data.get('feature_evaluation', {})
                    
                    # Merge CV and AI features for combined analysis
                    combined_analysis = {}
                    if cv_features:
                        combined_analysis.update(cv_features)
                    combined_analysis.update(ai_feature_evaluation)
                    
                    feature_analysis = {
                        "computer_vision_analysis": cv_features if cv_features else {},
                        "ai_evaluation": ai_feature_evaluation,
                        "combined_analysis": combined_analysis
                    }

                    return DiseaseAnalysisResult(
                        disease_detected=bool(
                            disease_data.get('disease_detected', False)),
                        disease_name=disease_data.get('disease_name'),
                        disease_type=disease_data.get(
                            'disease_type', 'unknown'),
                        severity=disease_data.get('severity', 'unknown'),
                        confidence=float(disease_data.get('confidence', 0)),
                        symptoms=disease_data.get('symptoms', []),
                        possible_causes=disease_data.get(
                            'possible_causes', []),
                        treatment=disease_data.get('treatment', []),
                        feature_analysis=feature_analysis,
                        farmer_recommendations=disease_data.get('farmer_recommendations', {})
                    )
                except json.JSONDecodeError:
                    pass

            # If all parsing attempts fail, log the raw response and raise error
            logger.error(
                f"Could not parse response as JSON. Raw response: {response_content}")
            raise ValueError(
                f"Unable to parse API response as JSON: {response_content[:200]}...")


def main():
    """Main execution function for testing"""
    try:
        # Example usage
        detector = LeafDiseaseDetector()
        print("Leaf Disease Detector (minimal version) initialized successfully!")
        print("Use analyze_leaf_image_base64() method with base64 image data.")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
