"""
Image Feature Extraction Module for Leaf Analysis
==================================================

This module provides comprehensive computer vision-based feature extraction
for leaf images, analyzing color, texture, shape, and health indicators.
"""

import cv2
import numpy as np
from typing import Dict, Tuple, Optional
from PIL import Image
import base64
import io


class LeafImageAnalyzer:
    """
    Advanced image analysis for leaf health assessment.
    
    Extracts 12 comprehensive features from leaf images including:
    - Leaf Color (chlorophyll, nutrient indicators)
    - Color Uniformity
    - Texture Analysis
    - Spots/Lesions Detection
    - Shape & Deformation
    - Edge Condition
    - Size & Area
    - Vein Visibility
    - Glossiness/Dullness
    - Stress Indicators
    - Chlorophyll Index
    - pH Proxy
    """
    
    def __init__(self):
        """Initialize the leaf image analyzer."""
        pass
    
    def base64_to_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to OpenCV image."""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array (OpenCV format)
            img_array = np.array(image)
            # Convert RGB to BGR for OpenCV
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            return img_array
        except Exception as e:
            raise ValueError(f"Failed to decode base64 image: {str(e)}")
    
    def extract_leaf_color_features(self, img: np.ndarray) -> Dict:
        """
        Extract leaf color features (Feature #1 - Most Important).
        
        Analyzes:
        - Green intensity (chlorophyll proxy)
        - Yellowing (nitrogen deficiency)
        - Pale color (iron deficiency)
        - Dark green (excess nitrogen)
        """
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Extract color channels
        b, g, r = cv2.split(img)
        h, s, v = cv2.split(hsv)
        
        # Calculate green intensity (chlorophyll proxy)
        green_intensity = np.mean(g)
        green_ratio = np.mean(g) / (np.mean(r) + np.mean(b) + 1)
        
        # Detect yellowing (low saturation, medium-high value in yellow range)
        yellow_mask = cv2.inRange(hsv, (20, 50, 100), (30, 255, 255))
        yellowing_percentage = np.sum(yellow_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect pale color (low saturation)
        pale_mask = cv2.inRange(s, 0, 50)
        pale_percentage = np.sum(pale_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect dark green (high green, low value)
        dark_green_mask = cv2.inRange(hsv, (40, 100, 0), (80, 255, 100))
        dark_green_percentage = np.sum(dark_green_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Overall color health assessment
        if green_intensity > 100 and yellowing_percentage < 10 and pale_percentage < 20:
            color_status = "Healthy Green"
        elif yellowing_percentage > 30:
            color_status = "Yellowing (Possible Nitrogen Deficiency)"
        elif pale_percentage > 40:
            color_status = "Pale (Possible Iron Deficiency)"
        elif dark_green_percentage > 50:
            color_status = "Dark Green (Possible Excess Nitrogen)"
        else:
            color_status = "Moderate Green"
        
        return {
            "green_intensity": float(green_intensity),
            "green_ratio": float(green_ratio),
            "yellowing_percentage": float(yellowing_percentage),
            "pale_percentage": float(pale_percentage),
            "dark_green_percentage": float(dark_green_percentage),
            "color_status": color_status,
            "assessment": self._assess_color_health(green_intensity, yellowing_percentage, pale_percentage)
        }
    
    def _assess_color_health(self, green_intensity: float, yellowing: float, pale: float) -> str:
        """Assess overall color health."""
        if green_intensity > 100 and yellowing < 10 and pale < 20:
            return "Healthy"
        elif yellowing > 30 or pale > 40:
            return "Deficiency Detected"
        else:
            return "Moderate Health"
    
    def extract_color_uniformity(self, img: np.ndarray) -> Dict:
        """
        Extract color uniformity features (Feature #2).
        
        Checks if leaf color is evenly distributed.
        """
        # Convert to LAB color space for better uniformity analysis
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Calculate standard deviation (higher = less uniform)
        l_std = np.std(l)
        a_std = np.std(a)
        b_std = np.std(b)
        
        # Calculate coefficient of variation
        l_mean = np.mean(l)
        l_cv = (l_std / (l_mean + 1)) * 100
        
        # Detect patchy areas (high local variance)
        kernel = np.ones((15, 15), np.float32) / 225
        local_mean = cv2.filter2D(l.astype(np.float32), -1, kernel)
        local_var = cv2.filter2D((l.astype(np.float32) - local_mean) ** 2, -1, kernel)
        patchy_threshold = np.percentile(local_var, 90)
        patchy_mask = local_var > patchy_threshold
        patchiness_percentage = np.sum(patchy_mask) / (img.shape[0] * img.shape[1]) * 100
        
        # Assess uniformity
        if l_cv < 15 and patchiness_percentage < 10:
            uniformity_status = "Uniform (Healthy)"
        elif l_cv > 25 or patchiness_percentage > 30:
            uniformity_status = "Patchy (Stress/Deficiency/Disease)"
        else:
            uniformity_status = "Moderately Uniform"
        
        return {
            "color_variation_coefficient": float(l_cv),
            "patchiness_percentage": float(patchiness_percentage),
            "uniformity_status": uniformity_status,
            "is_uniform": l_cv < 20 and patchiness_percentage < 15
        }
    
    def extract_texture_features(self, img: np.ndarray) -> Dict:
        """
        Extract texture features (Feature #3).
        
        Analyzes surface patterns using contrast, entropy, and edge detection.
        """
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate texture features using GLCM-like approach
        # Contrast (local variance)
        kernel = np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])
        edges = cv2.filter2D(gray, -1, kernel)
        contrast = np.std(edges)
        
        # Entropy (texture randomness)
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        hist = hist / (hist.sum() + 1e-10)
        entropy = -np.sum(hist * np.log2(hist + 1e-10))
        
        # Edge density
        edges_canny = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges_canny > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect rough/spotted areas
        # High contrast areas indicate texture abnormalities
        rough_threshold = np.percentile(edges, 90)
        rough_mask = edges > rough_threshold
        roughness_percentage = np.sum(rough_mask) / (img.shape[0] * img.shape[1]) * 100
        
        # Assess texture
        if contrast < 20 and entropy < 6 and roughness_percentage < 5:
            texture_status = "Smooth (Healthy)"
        elif roughness_percentage > 20 or contrast > 40:
            texture_status = "Rough/Spotted (Disease or Stress)"
        else:
            texture_status = "Moderate Texture"
        
        return {
            "contrast": float(contrast),
            "entropy": float(entropy),
            "edge_density": float(edge_density),
            "roughness_percentage": float(roughness_percentage),
            "texture_status": texture_status,
            "is_smooth": contrast < 25 and roughness_percentage < 10
        }
    
    def extract_spots_lesions(self, img: np.ndarray) -> Dict:
        """
        Extract spots, lesions, and discoloration (Feature #4).
        
        Detects brown spots, white patches, black lesions, yellow margins.
        """
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        
        # Detect brown spots (low value, medium saturation, brown hue)
        brown_lower = np.array([10, 50, 20])
        brown_upper = np.array([25, 255, 150])
        brown_mask = cv2.inRange(hsv, brown_lower, brown_upper)
        brown_percentage = np.sum(brown_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect white patches (high value, low saturation)
        white_mask = cv2.inRange(hsv, (0, 0, 200), (180, 30, 255))
        white_percentage = np.sum(white_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect black lesions (very low value)
        black_mask = cv2.inRange(v, 0, 50)
        black_percentage = np.sum(black_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect yellow margins/edges
        yellow_mask = cv2.inRange(hsv, (20, 100, 100), (30, 255, 255))
        yellow_percentage = np.sum(yellow_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Total abnormality percentage
        total_abnormal = brown_percentage + white_percentage + black_percentage
        
        # Assess lesions
        if total_abnormal < 2:
            lesion_status = "No Significant Lesions Detected"
        elif total_abnormal < 10:
            lesion_status = "Mild Lesions/Discoloration"
        elif total_abnormal < 25:
            lesion_status = "Moderate Lesions/Discoloration"
        else:
            lesion_status = "Severe Lesions/Discoloration"
        
        return {
            "brown_spots_percentage": float(brown_percentage),
            "white_patches_percentage": float(white_percentage),
            "black_lesions_percentage": float(black_percentage),
            "yellow_margins_percentage": float(yellow_percentage),
            "total_abnormality_percentage": float(total_abnormal),
            "lesion_status": lesion_status,
            "has_lesions": total_abnormal > 2
        }
    
    def extract_shape_deformation(self, img: np.ndarray) -> Dict:
        """
        Extract shape and deformation features (Feature #5).
        
        Detects curling, folding, shrinking, twisting.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Find leaf contour
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {
                "shape_status": "Unable to Detect Shape",
                "deformation_detected": False,
                "curvature_index": 0.0,
                "compactness": 0.0
            }
        
        # Get largest contour (assumed to be the leaf)
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Calculate shape metrics
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        
        # Compactness (4π*area/perimeter²) - lower = more deformed
        if perimeter > 0:
            compactness = (4 * np.pi * area) / (perimeter ** 2)
        else:
            compactness = 0
        
        # Curvature analysis (detect curling/folding)
        # Approximate contour to reduce noise
        epsilon = 0.02 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        # Calculate convexity defects (indicates folding/curling)
        hull = cv2.convexHull(largest_contour, returnPoints=False)
        if len(hull) > 3:
            defects = cv2.convexityDefects(largest_contour, hull)
            if defects is not None:
                defect_count = len(defects)
                max_defect_depth = np.max(defects[:, 0, 3]) if len(defects) > 0 else 0
            else:
                defect_count = 0
                max_defect_depth = 0
        else:
            defect_count = 0
            max_defect_depth = 0
        
        # Assess deformation
        if compactness > 0.7 and defect_count < 5:
            shape_status = "Normal Shape (No Significant Deformation)"
        elif compactness < 0.5 or defect_count > 15:
            shape_status = "Deformed (Curling/Folding/Shrinking Detected)"
        else:
            shape_status = "Mild Deformation"
        
        return {
            "shape_status": shape_status,
            "deformation_detected": compactness < 0.6 or defect_count > 10,
            "curvature_index": float(max_defect_depth / 256.0) if max_defect_depth > 0 else 0.0,
            "compactness": float(compactness),
            "defect_count": int(defect_count)
        }
    
    def extract_edge_condition(self, img: np.ndarray) -> Dict:
        """
        Extract leaf edge (margin) condition (Feature #6).
        
        Checks for burnt edges, yellow edges, dry margins.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Create edge mask (outer 10% of image)
        h, w = gray.shape
        mask = np.zeros((h, w), dtype=np.uint8)
        border_width = max(10, min(h, w) // 10)
        mask[0:border_width, :] = 255  # Top
        mask[h-border_width:h, :] = 255  # Bottom
        mask[:, 0:border_width] = 255  # Left
        mask[:, w-border_width:w] = 255  # Right
        
        # Analyze edge regions
        edge_region = cv2.bitwise_and(gray, mask)
        edge_hsv = cv2.bitwise_and(hsv, cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR))
        
        # Detect burnt edges (dark brown/black at edges)
        edge_v = cv2.split(edge_hsv)[2]
        burnt_mask = edge_v < 80
        burnt_percentage = np.sum(burnt_mask) / np.sum(mask > 0) * 100 if np.sum(mask > 0) > 0 else 0
        
        # Detect yellow edges
        edge_h = cv2.split(edge_hsv)[0]
        yellow_edge_mask = cv2.inRange(edge_hsv, (20, 100, 100), (30, 255, 255))
        yellow_edge_percentage = np.sum(yellow_edge_mask > 0) / np.sum(mask > 0) * 100 if np.sum(mask > 0) > 0 else 0
        
        # Detect dry margins (low saturation, medium value)
        edge_s = cv2.split(edge_hsv)[1]
        dry_mask = (edge_s < 50) & (edge_v > 100) & (edge_v < 200)
        dry_percentage = np.sum(dry_mask) / np.sum(mask > 0) * 100 if np.sum(mask > 0) > 0 else 0
        
        # Assess edge condition
        if burnt_percentage < 5 and yellow_edge_percentage < 10 and dry_percentage < 15:
            edge_status = "Healthy Edges"
        elif burnt_percentage > 20:
            edge_status = "Burnt Edges (Possible Potassium Deficiency)"
        elif yellow_edge_percentage > 30:
            edge_status = "Yellow Edges (Possible Magnesium Deficiency)"
        elif dry_percentage > 40:
            edge_status = "Dry Margins (Water Stress)"
        else:
            edge_status = "Moderate Edge Issues"
        
        return {
            "burnt_edges_percentage": float(burnt_percentage),
            "yellow_edges_percentage": float(yellow_edge_percentage),
            "dry_margins_percentage": float(dry_percentage),
            "edge_status": edge_status,
            "edge_issues_detected": burnt_percentage > 10 or yellow_edge_percentage > 15 or dry_percentage > 20
        }
    
    def extract_size_area(self, img: np.ndarray) -> Dict:
        """
        Extract leaf size and area features (Feature #7).
        
        Calculates leaf area and relative size.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Find leaf contour
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {
                "leaf_area_pixels": 0,
                "leaf_area_percentage": 0.0,
                "relative_size": "Unknown",
                "size_status": "Unable to Calculate"
            }
        
        largest_contour = max(contours, key=cv2.contourArea)
        leaf_area = cv2.contourArea(largest_contour)
        total_image_area = img.shape[0] * img.shape[1]
        leaf_area_percentage = (leaf_area / total_image_area) * 100
        
        # Assess size (relative to image)
        if leaf_area_percentage > 60:
            size_status = "Normal/Large Size"
            relative_size = "Normal"
        elif leaf_area_percentage < 30:
            size_status = "Small Size (Possible Stunted Growth)"
            relative_size = "Small"
        else:
            size_status = "Moderate Size"
            relative_size = "Moderate"
        
        return {
            "leaf_area_pixels": float(leaf_area),
            "leaf_area_percentage": float(leaf_area_percentage),
            "relative_size": relative_size,
            "size_status": size_status,
            "is_stunted": leaf_area_percentage < 30
        }
    
    def extract_vein_visibility(self, img: np.ndarray) -> Dict:
        """
        Extract vein color and visibility (Feature #8).
        
        Detects green veins with yellow surface (iron deficiency),
        prominent veins (stress indicators).
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Detect veins using edge detection
        # Veins appear as darker lines
        edges = cv2.Canny(gray, 50, 150)
        
        # Use morphological operations to enhance vein detection
        kernel = np.ones((3, 3), np.uint8)
        veins_enhanced = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        # Calculate vein density
        vein_density = np.sum(veins_enhanced > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Detect green veins (veins should be darker green)
        # Check if veins are green while surface is yellow
        h, s, v = cv2.split(hsv)
        
        # Green regions (veins typically darker green)
        green_mask = cv2.inRange(hsv, (40, 50, 0), (80, 255, 150))
        green_vein_percentage = np.sum(green_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Yellow surface regions
        yellow_mask = cv2.inRange(hsv, (20, 100, 100), (30, 255, 255))
        yellow_surface_percentage = np.sum(yellow_mask > 0) / (img.shape[0] * img.shape[1]) * 100
        
        # Assess vein visibility
        if vein_density < 5:
            vein_status = "Veins Not Prominent (Normal)"
        elif green_vein_percentage > 10 and yellow_surface_percentage > 20:
            vein_status = "Green Veins + Yellow Surface (Possible Iron Deficiency)"
        elif vein_density > 15:
            vein_status = "Prominent Veins (Stress Indicator)"
        else:
            vein_status = "Normal Vein Visibility"
        
        return {
            "vein_density_percentage": float(vein_density),
            "green_vein_percentage": float(green_vein_percentage),
            "yellow_surface_percentage": float(yellow_surface_percentage),
            "vein_status": vein_status,
            "prominent_veins": vein_density > 12,
            "iron_deficiency_indicator": green_vein_percentage > 10 and yellow_surface_percentage > 20
        }
    
    def extract_glossiness(self, img: np.ndarray) -> Dict:
        """
        Extract glossiness/dullness features (Feature #9).
        
        Analyzes surface reflection and brightness variation.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate brightness variation (glossy = high variation, dull = low variation)
        brightness_std = np.std(gray)
        brightness_mean = np.mean(gray)
        
        # Detect glossy regions (high local brightness variation)
        kernel = np.ones((10, 10), np.float32) / 100
        local_mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        local_std = cv2.filter2D((gray.astype(np.float32) - local_mean) ** 2, -1, kernel)
        local_std = np.sqrt(local_std)
        
        glossy_threshold = np.percentile(local_std, 75)
        glossy_mask = local_std > glossy_threshold
        glossiness_percentage = np.sum(glossy_mask) / (img.shape[0] * img.shape[1]) * 100
        
        # Assess glossiness
        if glossiness_percentage > 30 and brightness_std > 30:
            glossiness_status = "Glossy (Healthy)"
        elif glossiness_percentage < 10 and brightness_std < 20:
            glossiness_status = "Dull/Dusty (Stress or Aging)"
        else:
            glossiness_status = "Moderate Glossiness"
        
        return {
            "brightness_variation": float(brightness_std),
            "glossiness_percentage": float(glossiness_percentage),
            "glossiness_status": glossiness_status,
            "is_glossy": glossiness_percentage > 25 and brightness_std > 25
        }
    
    def calculate_chlorophyll_index(self, img: np.ndarray) -> Dict:
        """
        Calculate chlorophyll index (Feature #11 - Advanced).
        
        Estimates from green channel intensity.
        """
        b, g, r = cv2.split(img)
        
        # Simple chlorophyll index (green intensity normalized)
        chlorophyll_index = np.mean(g) / 255.0
        
        # More sophisticated index using normalized difference
        total_intensity = np.mean(r) + np.mean(g) + np.mean(b)
        if total_intensity > 0:
            green_ratio = np.mean(g) / total_intensity
        else:
            green_ratio = 0
        
        # Assess chlorophyll level
        if chlorophyll_index > 0.5 and green_ratio > 0.4:
            chlorophyll_status = "High (Good Nitrogen Level)"
        elif chlorophyll_index < 0.3 or green_ratio < 0.3:
            chlorophyll_status = "Low (Possible Nitrogen Deficiency)"
        else:
            chlorophyll_status = "Moderate"
        
        return {
            "chlorophyll_index": float(chlorophyll_index),
            "green_ratio": float(green_ratio),
            "chlorophyll_status": chlorophyll_status,
            "estimated_nitrogen_level": "High" if chlorophyll_index > 0.5 else ("Low" if chlorophyll_index < 0.3 else "Moderate")
        }
    
    def estimate_ph_proxy(self, img: np.ndarray, color_features: Dict, 
                          texture_features: Dict, stress_score: float) -> Dict:
        """
        Estimate pH proxy (Feature #12 - Advanced).
        
        pH is not directly visible but can be estimated from:
        - Color changes
        - Stress patterns
        - Chlorophyll level
        - Texture changes
        """
        # Collect indicators
        yellowing = color_features.get("yellowing_percentage", 0)
        pale = color_features.get("pale_percentage", 0)
        dark_green = color_features.get("dark_green_percentage", 0)
        roughness = texture_features.get("roughness_percentage", 0)
        
        # Low pH indicators (acidic soil)
        low_ph_indicators = 0
        if yellowing > 20:
            low_ph_indicators += 1
        if pale > 30:
            low_ph_indicators += 1
        if roughness > 15:
            low_ph_indicators += 1
        
        # High pH indicators (alkaline soil)
        high_ph_indicators = 0
        if dark_green > 40:
            high_ph_indicators += 1
        if stress_score > 0.6:
            high_ph_indicators += 1
        
        # Estimate pH
        if low_ph_indicators >= 2:
            ph_estimate = "Low pH (Acidic)"
        elif high_ph_indicators >= 2:
            ph_estimate = "High pH (Alkaline)"
        else:
            ph_estimate = "Normal pH"
        
        return {
            "ph_estimate": ph_estimate,
            "low_ph_indicators": low_ph_indicators,
            "high_ph_indicators": high_ph_indicators,
            "confidence": "Low (Indirect Estimation)"
        }
    
    def calculate_stress_score(self, all_features: Dict) -> Dict:
        """
        Calculate overall stress indicators (Feature #10).
        
        Combines all features to classify:
        - Healthy
        - Mild Stress
        - Severe Stress
        """
        stress_factors = 0
        max_stress = 10
        
        # Check each feature for stress indicators
        if not all_features.get("color_features", {}).get("assessment") == "Healthy":
            stress_factors += 1
        if not all_features.get("color_uniformity", {}).get("is_uniform", True):
            stress_factors += 1
        if not all_features.get("texture_features", {}).get("is_smooth", True):
            stress_factors += 1
        if all_features.get("spots_lesions", {}).get("has_lesions", False):
            stress_factors += 2  # Lesions are more serious
        if all_features.get("shape_deformation", {}).get("deformation_detected", False):
            stress_factors += 1
        if all_features.get("edge_condition", {}).get("edge_issues_detected", False):
            stress_factors += 1
        if all_features.get("size_area", {}).get("is_stunted", False):
            stress_factors += 1
        if all_features.get("vein_visibility", {}).get("prominent_veins", False):
            stress_factors += 1
        if not all_features.get("glossiness", {}).get("is_glossy", True):
            stress_factors += 1
        
        stress_score = stress_factors / max_stress
        
        # Classify health status
        if stress_score < 0.2:
            health_status = "🟢 Healthy"
        elif stress_score < 0.5:
            health_status = "🟡 Mild Stress"
        else:
            health_status = "🔴 Severe Stress"
        
        return {
            "stress_score": float(stress_score),
            "stress_factors_count": stress_factors,
            "health_status": health_status,
            "overall_assessment": health_status
        }
    
    def analyze_complete(self, base64_image: str) -> Dict:
        """
        Perform complete analysis of all 12 features.
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            Dictionary containing all extracted features
        """
        try:
            # Convert base64 to image
            img = self.base64_to_image(base64_image)
            
            # Extract all features
            color_features = self.extract_leaf_color_features(img)
            color_uniformity = self.extract_color_uniformity(img)
            texture_features = self.extract_texture_features(img)
            spots_lesions = self.extract_spots_lesions(img)
            shape_deformation = self.extract_shape_deformation(img)
            edge_condition = self.extract_edge_condition(img)
            size_area = self.extract_size_area(img)
            vein_visibility = self.extract_vein_visibility(img)
            glossiness = self.extract_glossiness(img)
            chlorophyll_index = self.calculate_chlorophyll_index(img)
            
            # Combine features for stress calculation
            all_features = {
                "color_features": color_features,
                "color_uniformity": color_uniformity,
                "texture_features": texture_features,
                "spots_lesions": spots_lesions,
                "shape_deformation": shape_deformation,
                "edge_condition": edge_condition,
                "size_area": size_area,
                "vein_visibility": vein_visibility,
                "glossiness": glossiness
            }
            
            # Calculate stress indicators
            stress_indicators = self.calculate_stress_score(all_features)
            
            # Estimate pH proxy
            ph_proxy = self.estimate_ph_proxy(img, color_features, texture_features, 
                                             stress_indicators["stress_score"])
            
            # Return complete analysis
            return {
                "1_leaf_color": color_features,
                "2_color_uniformity": color_uniformity,
                "3_leaf_texture": texture_features,
                "4_spots_lesions_discoloration": spots_lesions,
                "5_leaf_shape_deformation": shape_deformation,
                "6_leaf_edge_condition": edge_condition,
                "7_leaf_size_area": size_area,
                "8_vein_color_visibility": vein_visibility,
                "9_glossiness_dullness": glossiness,
                "10_stress_indicators": stress_indicators,
                "11_chlorophyll_index": chlorophyll_index,
                "12_ph_proxy": ph_proxy
            }
            
        except Exception as e:
            return {
                "error": f"Image analysis failed: {str(e)}",
                "1_leaf_color": {},
                "2_color_uniformity": {},
                "3_leaf_texture": {},
                "4_spots_lesions_discoloration": {},
                "5_leaf_shape_deformation": {},
                "6_leaf_edge_condition": {},
                "7_leaf_size_area": {},
                "8_vein_color_visibility": {},
                "9_glossiness_dullness": {},
                "10_stress_indicators": {},
                "11_chlorophyll_index": {},
                "12_ph_proxy": {}
            }

