

import streamlit as st
import requests

import streamlit as st
import requests

# Set Streamlit theme to light and wide mode
st.set_page_config(
    page_title="Leaf Disease Detection",
    layout="wide",
    initial_sidebar_state="collapsed"
)


# Enhanced modern CSS
st.markdown("""
    <style>
    .stApp {
        background: linear-gradient(135deg, #e3f2fd 0%, #f7f9fa 100%);
    }
    .result-card {
        background: rgba(255,255,255,0.95);
        border-radius: 18px;
        box-shadow: 0 4px 24px rgba(44,62,80,0.10);
        padding: 2.5em 2em;
        margin-top: 1.5em;
        margin-bottom: 1.5em;
        transition: box-shadow 0.3s;
    }
    .result-card:hover {
        box-shadow: 0 8px 32px rgba(44,62,80,0.18);
    }
    .disease-title {
        color: #1b5e20;
        font-size: 2.2em;
        font-weight: 700;
        margin-bottom: 0.5em;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px #e0e0e0;
    }
    .section-title {
        color: #1976d2;
        font-size: 1.25em;
        margin-top: 1.2em;
        margin-bottom: 0.5em;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
    .timestamp {
        color: #616161;
        font-size: 0.95em;
        margin-top: 1.2em;
        text-align: right;
    }
    .info-badge {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 8px;
        padding: 0.3em 0.8em;
        font-size: 1em;
        margin-right: 0.5em;
        margin-bottom: 0.3em;
    }
    .symptom-list, .cause-list, .treatment-list {
        margin-left: 1em;
        margin-bottom: 0.5em;
    }
    .feature-card {
        background: rgba(255,255,255,0.9);
        border-left: 4px solid #1976d2;
        border-radius: 8px;
        padding: 1em;
        margin: 0.5em 0;
    }
    .feature-title {
        color: #1976d2;
        font-size: 1.1em;
        font-weight: 600;
        margin-bottom: 0.3em;
    }
    .feature-value {
        color: #424242;
        font-size: 0.95em;
        margin-left: 1em;
    }
    .health-status {
        font-size: 1.3em;
        font-weight: 700;
        padding: 0.5em;
        border-radius: 8px;
        text-align: center;
        margin: 1em 0;
    }
    .health-healthy {
        background: #e8f5e9;
        color: #2e7d32;
    }
    .health-mild {
        background: #fff3e0;
        color: #f57c00;
    }
    .health-severe {
        background: #ffebee;
        color: #c62828;
    }
    </style>
""", unsafe_allow_html=True)


st.markdown("""
    <div style='text-align: center; margin-top: 1em;'>
        <span style='font-size:2.5em;'>🌿</span>
        <h1 style='color: #1565c0; margin-bottom:0;'>Leaf Disease Detection</h1>
        <p style='color: #616161; font-size:1.15em;'>Upload a leaf image to detect diseases and get expert recommendations.</p>
    </div>
""", unsafe_allow_html=True)

api_url = "http://leaf-diseases-detect.vercel.app"

col1, col2 = st.columns([1, 2])
with col1:
    uploaded_file = st.file_uploader(
        "Upload Leaf Image", type=["jpg", "jpeg", "png"])
    if uploaded_file is not None:
        st.image(uploaded_file, caption="Preview")

with col2:
    if uploaded_file is not None:
        if st.button("🔍 Detect Disease", use_container_width=True):
            with st.spinner("Analyzing image and contacting API..."):
                try:
                    files = {
                        "file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                    response = requests.post(
                        f"{api_url}/disease-detection-file", files=files)
                    if response.status_code == 200:
                        result = response.json()

                        # Check if it's an invalid image
                        if result.get("disease_type") == "invalid_image":
                            st.markdown("<div class='result-card'>",
                                        unsafe_allow_html=True)
                            st.markdown(
                                "<div class='disease-title'>⚠️ Invalid Image</div>", unsafe_allow_html=True)
                            st.markdown(
                                "<div style='color: #ff5722; font-size: 1.1em; margin-bottom: 1em;'>Please upload a clear image of a plant leaf for accurate disease detection.</div>", unsafe_allow_html=True)

                            # Show the symptoms (which contain the error message)
                            if result.get("symptoms"):
                                st.markdown(
                                    "<div class='section-title'>Issue</div>", unsafe_allow_html=True)
                                st.markdown("<ul class='symptom-list'>",
                                            unsafe_allow_html=True)
                                for symptom in result.get("symptoms", []):
                                    st.markdown(
                                        f"<li>{symptom}</li>", unsafe_allow_html=True)
                                st.markdown("</ul>", unsafe_allow_html=True)

                            # Show treatment recommendations
                            if result.get("treatment"):
                                st.markdown(
                                    "<div class='section-title'>What to do</div>", unsafe_allow_html=True)
                                st.markdown("<ul class='treatment-list'>",
                                            unsafe_allow_html=True)
                                for treat in result.get("treatment", []):
                                    st.markdown(
                                        f"<li>{treat}</li>", unsafe_allow_html=True)
                                st.markdown("</ul>", unsafe_allow_html=True)

                            st.markdown("</div>", unsafe_allow_html=True)

                        elif result.get("disease_detected"):
                            st.markdown("<div class='result-card'>",
                                        unsafe_allow_html=True)
                            st.markdown(
                                f"<div class='disease-title'>🦠 {result.get('disease_name', 'N/A')}</div>", unsafe_allow_html=True)
                            st.markdown(
                                f"<span class='info-badge'>Type: {result.get('disease_type', 'N/A')}</span>", unsafe_allow_html=True)
                            st.markdown(
                                f"<span class='info-badge'>Severity: {result.get('severity', 'N/A')}</span>", unsafe_allow_html=True)
                            st.markdown(
                                f"<span class='info-badge'>Confidence: {result.get('confidence', 'N/A')}%</span>", unsafe_allow_html=True)
                            st.markdown(
                                "<div class='section-title'>Symptoms</div>", unsafe_allow_html=True)
                            st.markdown("<ul class='symptom-list'>",
                                        unsafe_allow_html=True)
                            for symptom in result.get("symptoms", []):
                                st.markdown(
                                    f"<li>{symptom}</li>", unsafe_allow_html=True)
                            st.markdown("</ul>", unsafe_allow_html=True)
                            st.markdown(
                                "<div class='section-title'>Possible Causes</div>", unsafe_allow_html=True)
                            st.markdown("<ul class='cause-list'>",
                                        unsafe_allow_html=True)
                            for cause in result.get("possible_causes", []):
                                st.markdown(
                                    f"<li>{cause}</li>", unsafe_allow_html=True)
                            st.markdown("</ul>", unsafe_allow_html=True)
                            st.markdown(
                                "<div class='section-title'>Treatment</div>", unsafe_allow_html=True)
                            st.markdown("<ul class='treatment-list'>",
                                        unsafe_allow_html=True)
                            for treat in result.get("treatment", []):
                                st.markdown(
                                    f"<li>{treat}</li>", unsafe_allow_html=True)
                            st.markdown("</ul>", unsafe_allow_html=True)
                            
                            # Display Comprehensive Feature Analysis
                            feature_analysis = result.get("feature_analysis", {})
                            if feature_analysis:
                                st.markdown("<hr style='margin: 2em 0; border: 1px solid #e0e0e0;'>", unsafe_allow_html=True)
                                st.markdown(
                                    "<div class='section-title' style='font-size: 1.5em; color: #1565c0;'>📊 Comprehensive Leaf Analysis</div>", unsafe_allow_html=True)
                                
                                # Get combined analysis or AI evaluation
                                combined = feature_analysis.get("combined_analysis", {})
                                if not combined:
                                    combined = feature_analysis.get("ai_evaluation", {})
                                if not combined:
                                    combined = feature_analysis.get("computer_vision_analysis", {})
                                
                                # Overall Health Status (Feature #10)
                                stress_indicators = combined.get("10_stress_indicators", {})
                                if stress_indicators:
                                    health_status = stress_indicators.get("health_status", stress_indicators.get("overall_assessment", "N/A"))
                                    if "🟢" in str(health_status) or "Healthy" in str(health_status):
                                        health_class = "health-healthy"
                                    elif "🟡" in str(health_status) or "Mild" in str(health_status):
                                        health_class = "health-mild"
                                    elif "🔴" in str(health_status) or "Severe" in str(health_status):
                                        health_class = "health-severe"
                                    else:
                                        health_class = "health-healthy"
                                    st.markdown(
                                        f"<div class='health-status {health_class}'>{health_status}</div>", unsafe_allow_html=True)
                                
                                # Create expandable sections for features
                                with st.expander("1️⃣ Leaf Color (Most Important)", expanded=True):
                                    color_data = combined.get("1_leaf_color", {})
                                    if color_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Color Assessment:</div><div class='feature-value'>{color_data.get('color_status', color_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if color_data.get('green_intensity'):
                                            st.markdown(f"<div class='feature-value'>Green Intensity: {color_data.get('green_intensity', 0):.1f}</div>", unsafe_allow_html=True)
                                        if color_data.get('yellowing_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Yellowing: {color_data.get('yellowing_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                        if color_data.get('pale_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Pale Areas: {color_data.get('pale_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                
                                with st.expander("2️⃣ Color Uniformity"):
                                    uniformity_data = combined.get("2_color_uniformity", {})
                                    if uniformity_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Uniformity Status:</div><div class='feature-value'>{uniformity_data.get('uniformity_status', uniformity_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if uniformity_data.get('patchiness_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Patchiness: {uniformity_data.get('patchiness_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                
                                with st.expander("3️⃣ Leaf Texture"):
                                    texture_data = combined.get("3_leaf_texture", {})
                                    if texture_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Texture Status:</div><div class='feature-value'>{texture_data.get('texture_status', texture_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if texture_data.get('roughness_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Roughness: {texture_data.get('roughness_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                
                                with st.expander("4️⃣ Spots / Lesions / Discoloration"):
                                    lesions_data = combined.get("4_spots_lesions_discoloration", {})
                                    if lesions_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Lesion Status:</div><div class='feature-value'>{lesions_data.get('lesion_status', lesions_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if lesions_data.get('brown_spots_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Brown Spots: {lesions_data.get('brown_spots_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                        if lesions_data.get('white_patches_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>White Patches: {lesions_data.get('white_patches_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                        if lesions_data.get('black_lesions_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Black Lesions: {lesions_data.get('black_lesions_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                
                                with st.expander("5️⃣ Leaf Shape & Deformation"):
                                    shape_data = combined.get("5_leaf_shape_deformation", {})
                                    if shape_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Shape Status:</div><div class='feature-value'>{shape_data.get('shape_status', shape_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if shape_data.get('deformation_type'):
                                            st.markdown(f"<div class='feature-value'>Deformation Type: {shape_data.get('deformation_type', 'None')}</div>", unsafe_allow_html=True)
                                
                                with st.expander("6️⃣ Leaf Edge (Margin) Condition"):
                                    edge_data = combined.get("6_leaf_edge_condition", {})
                                    if edge_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Edge Status:</div><div class='feature-value'>{edge_data.get('edge_status', edge_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if edge_data.get('burnt_edges_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Burnt Edges: {edge_data.get('burnt_edges_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                        if edge_data.get('yellow_edges_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Yellow Edges: {edge_data.get('yellow_edges_percentage', 0):.1f}%</div>", unsafe_allow_html=True)
                                
                                with st.expander("7️⃣ Leaf Size & Area"):
                                    size_data = combined.get("7_leaf_size_area", {})
                                    if size_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Size Status:</div><div class='feature-value'>{size_data.get('size_status', size_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if size_data.get('leaf_area_percentage') is not None:
                                            st.markdown(f"<div class='feature-value'>Leaf Area: {size_data.get('leaf_area_percentage', 0):.1f}% of image</div>", unsafe_allow_html=True)
                                
                                with st.expander("8️⃣ Vein Color & Visibility"):
                                    vein_data = combined.get("8_vein_color_visibility", {})
                                    if vein_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Vein Status:</div><div class='feature-value'>{vein_data.get('vein_status', vein_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if vein_data.get('iron_deficiency_indicator'):
                                            st.markdown(f"<div class='feature-value' style='color: #f57c00; font-weight: 600;'>⚠️ Iron Deficiency Indicator Detected</div>", unsafe_allow_html=True)
                                
                                with st.expander("9️⃣ Glossiness / Dullness"):
                                    gloss_data = combined.get("9_glossiness_dullness", {})
                                    if gloss_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Surface Quality:</div><div class='feature-value'>{gloss_data.get('glossiness_status', gloss_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("1️⃣0️⃣ Stress Indicators (Overall Health)"):
                                    stress_data = combined.get("10_stress_indicators", {})
                                    if stress_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Overall Health:</div><div class='feature-value'>{stress_data.get('health_status', stress_data.get('overall_assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if stress_data.get('stress_score') is not None:
                                            st.markdown(f"<div class='feature-value'>Stress Score: {stress_data.get('stress_score', 0):.2f} (0 = Healthy, 1 = Severe Stress)</div>", unsafe_allow_html=True)
                                
                                with st.expander("1️⃣1️⃣ Chlorophyll Index (Advanced)"):
                                    chlorophyll_data = combined.get("11_chlorophyll_index", {})
                                    if chlorophyll_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Chlorophyll Status:</div><div class='feature-value'>{chlorophyll_data.get('chlorophyll_status', chlorophyll_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if chlorophyll_data.get('estimated_nitrogen_level'):
                                            st.markdown(f"<div class='feature-value'>Estimated Nitrogen Level: {chlorophyll_data.get('estimated_nitrogen_level', 'N/A')}</div>", unsafe_allow_html=True)
                                
                                with st.expander("1️⃣2️⃣ Leaf pH Proxy (Advanced)"):
                                    ph_data = combined.get("12_ph_proxy", {})
                                    if ph_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>pH Estimate:</div><div class='feature-value'>{ph_data.get('ph_estimate', 'N/A')}</div></div>", unsafe_allow_html=True)
                                        st.markdown(f"<div class='feature-value' style='font-size: 0.85em; color: #757575;'>(Indirect estimation based on visual indicators)</div>", unsafe_allow_html=True)
                            
                            st.markdown(
                                f"<div class='timestamp'>🕒 {result.get('analysis_timestamp', 'N/A')}</div>", unsafe_allow_html=True)
                            st.markdown("</div>", unsafe_allow_html=True)
                        else:
                            # Healthy leaf case
                            st.markdown("<div class='result-card'>",
                                        unsafe_allow_html=True)
                            st.markdown(
                                "<div class='disease-title'>✅ Healthy Leaf</div>", unsafe_allow_html=True)
                            st.markdown(
                                "<div style='color: #4caf50; font-size: 1.1em; margin-bottom: 1em;'>No disease detected in this leaf. The plant appears to be healthy!</div>", unsafe_allow_html=True)
                            st.markdown(
                                f"<span class='info-badge'>Status: {result.get('disease_type', 'healthy')}</span>", unsafe_allow_html=True)
                            st.markdown(
                                f"<span class='info-badge'>Confidence: {result.get('confidence', 'N/A')}%</span>", unsafe_allow_html=True)
                            
                            # Display Comprehensive Feature Analysis for healthy leaves too
                            feature_analysis = result.get("feature_analysis", {})
                            if feature_analysis:
                                st.markdown("<hr style='margin: 2em 0; border: 1px solid #e0e0e0;'>", unsafe_allow_html=True)
                                st.markdown(
                                    "<div class='section-title' style='font-size: 1.5em; color: #1565c0;'>📊 Comprehensive Leaf Analysis</div>", unsafe_allow_html=True)
                                
                                # Get combined analysis or AI evaluation
                                combined = feature_analysis.get("combined_analysis", {})
                                if not combined:
                                    combined = feature_analysis.get("ai_evaluation", {})
                                if not combined:
                                    combined = feature_analysis.get("computer_vision_analysis", {})
                                
                                # Overall Health Status (Feature #10)
                                stress_indicators = combined.get("10_stress_indicators", {})
                                if stress_indicators:
                                    health_status = stress_indicators.get("health_status", stress_indicators.get("overall_assessment", "N/A"))
                                    if "🟢" in str(health_status) or "Healthy" in str(health_status):
                                        health_class = "health-healthy"
                                    elif "🟡" in str(health_status) or "Mild" in str(health_status):
                                        health_class = "health-mild"
                                    elif "🔴" in str(health_status) or "Severe" in str(health_status):
                                        health_class = "health-severe"
                                    else:
                                        health_class = "health-healthy"
                                    st.markdown(
                                        f"<div class='health-status {health_class}'>{health_status}</div>", unsafe_allow_html=True)
                                
                                # Create expandable sections for features (same as disease case)
                                with st.expander("1️⃣ Leaf Color (Most Important)", expanded=True):
                                    color_data = combined.get("1_leaf_color", {})
                                    if color_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Color Assessment:</div><div class='feature-value'>{color_data.get('color_status', color_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                        if color_data.get('green_intensity'):
                                            st.markdown(f"<div class='feature-value'>Green Intensity: {color_data.get('green_intensity', 0):.1f}</div>", unsafe_allow_html=True)
                                
                                with st.expander("2️⃣ Color Uniformity"):
                                    uniformity_data = combined.get("2_color_uniformity", {})
                                    if uniformity_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Uniformity Status:</div><div class='feature-value'>{uniformity_data.get('uniformity_status', uniformity_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("3️⃣ Leaf Texture"):
                                    texture_data = combined.get("3_leaf_texture", {})
                                    if texture_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Texture Status:</div><div class='feature-value'>{texture_data.get('texture_status', texture_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("4️⃣ Spots / Lesions / Discoloration"):
                                    lesions_data = combined.get("4_spots_lesions_discoloration", {})
                                    if lesions_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Lesion Status:</div><div class='feature-value'>{lesions_data.get('lesion_status', lesions_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("5️⃣ Leaf Shape & Deformation"):
                                    shape_data = combined.get("5_leaf_shape_deformation", {})
                                    if shape_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Shape Status:</div><div class='feature-value'>{shape_data.get('shape_status', shape_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("6️⃣ Leaf Edge (Margin) Condition"):
                                    edge_data = combined.get("6_leaf_edge_condition", {})
                                    if edge_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Edge Status:</div><div class='feature-value'>{edge_data.get('edge_status', edge_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("7️⃣ Leaf Size & Area"):
                                    size_data = combined.get("7_leaf_size_area", {})
                                    if size_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Size Status:</div><div class='feature-value'>{size_data.get('size_status', size_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("8️⃣ Vein Color & Visibility"):
                                    vein_data = combined.get("8_vein_color_visibility", {})
                                    if vein_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Vein Status:</div><div class='feature-value'>{vein_data.get('vein_status', vein_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("9️⃣ Glossiness / Dullness"):
                                    gloss_data = combined.get("9_glossiness_dullness", {})
                                    if gloss_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Surface Quality:</div><div class='feature-value'>{gloss_data.get('glossiness_status', gloss_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("1️⃣0️⃣ Stress Indicators (Overall Health)"):
                                    stress_data = combined.get("10_stress_indicators", {})
                                    if stress_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Overall Health:</div><div class='feature-value'>{stress_data.get('health_status', stress_data.get('overall_assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("1️⃣1️⃣ Chlorophyll Index (Advanced)"):
                                    chlorophyll_data = combined.get("11_chlorophyll_index", {})
                                    if chlorophyll_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>Chlorophyll Status:</div><div class='feature-value'>{chlorophyll_data.get('chlorophyll_status', chlorophyll_data.get('assessment', 'N/A'))}</div></div>", unsafe_allow_html=True)
                                
                                with st.expander("1️⃣2️⃣ Leaf pH Proxy (Advanced)"):
                                    ph_data = combined.get("12_ph_proxy", {})
                                    if ph_data:
                                        st.markdown(f"<div class='feature-card'><div class='feature-title'>pH Estimate:</div><div class='feature-value'>{ph_data.get('ph_estimate', 'N/A')}</div></div>", unsafe_allow_html=True)
                            
                            st.markdown(
                                f"<div class='timestamp'>🕒 {result.get('analysis_timestamp', 'N/A')}</div>", unsafe_allow_html=True)
                            st.markdown("</div>", unsafe_allow_html=True)
                    else:
                        st.error(f"API Error: {response.status_code}")
                        st.write(response.text)
                except Exception as e:
                    st.error(f"Error: {str(e)}")
