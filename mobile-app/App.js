import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// API Configuration - Your computer's IP address
const API_URL = 'http://10.42.138.194:8000';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for placeholder
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Shimmer effect for loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loading]);

  // Animate results when they appear
  useEffect(() => {
    if (result) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 30,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [result]);

  // Animate health progress bar
  useEffect(() => {
    if (result?.feature_analysis?.combined_analysis?.['10_stress_indicators']) {
      const stressData = result.feature_analysis.combined_analysis['10_stress_indicators'];
      const stressScore = stressData.stress_score || 0;
      const healthPercent = (1 - stressScore) * 100;
      
      Animated.timing(progressAnim, {
        toValue: healthPercent,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [result]);

  // Button press animation
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Pick image from gallery
  const pickImage = async () => {
    animateButtonPress();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to analyze plant health.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setResult(null);
        scaleAnim.setValue(0.9);
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    animateButtonPress();
    try {
      if (hasPermission === null) {
        Alert.alert('Permission needed', 'Camera permission is required.');
        return;
      }
      if (hasPermission === false) {
        Alert.alert('Permission denied', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setResult(null);
        scaleAnim.setValue(0.9);
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  // Analyze image
  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }

    animateButtonPress();
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('file', {
        uri: image,
        name: filename,
        type: type,
      });

      const response = await axios.post(`${API_URL}/disease-detection-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.status === 200) {
        setResult(response.data);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      let errorMessage = 'Could not analyze image. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timeout. The server took too long to respond.';
      } else if (error.message === 'Network Error') {
        errorMessage += `Network error. Make sure:\n1. Backend server is running on ${API_URL}\n2. Your device and computer are on the same WiFi network\n3. Firewall allows port 8000`;
      } else if (error.response) {
        errorMessage += error.response.data?.detail || `Server error: ${error.response.status}`;
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (severity) => {
    if (severity?.toLowerCase() === 'severe') return '#f44336';
    if (severity?.toLowerCase() === 'moderate') return '#ff9800';
    return '#4caf50';
  };

  // Get status icon
  const getStatusIcon = (severity) => {
    if (severity?.toLowerCase() === 'severe') return '🔴';
    if (severity?.toLowerCase() === 'moderate') return '🟡';
    return '✅';
  };

  const cardScale = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const cardOpacity = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />

      {/* Soft decorative background shapes */}
      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View style={[styles.decorCircle, styles.decorCircleTopLeft]} />
        <View style={[styles.decorCircle, styles.decorCircleRight]} />
        <View style={[styles.decorCircle, styles.decorCircleBottom]} />
      </View>

      <LinearGradient
        colors={['#1565c0', '#1976d2', '#42a5f5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.headerTitle}>🌿 Plant Health Check</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Plant Disease Detection</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Selection */}
        <Animated.View
          style={[
            styles.imageSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {image ? (
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                <View style={styles.imageOverlay} />
              </View>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setImage(null);
                  setResult(null);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.changeImageButtonContent}>
                  <Text style={styles.changeImageIcon}>✏️</Text>
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.placeholderContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>No photo selected</Text>
              <Text style={styles.placeholderHint}>Take or choose a leaf photo to begin</Text>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Animated.View style={{ transform: [{ scale: buttonScale }], flex: 1 }}>
              <TouchableOpacity
                style={styles.button}
                onPress={pickImage}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2196f3', '#1976d2', '#1565c0']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.buttonIconContainer}>
                    <Text style={styles.buttonIcon}>📷</Text>
                  </View>
                  <Text style={styles.buttonText}>Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: buttonScale }], flex: 1 }}>
              <TouchableOpacity
                style={styles.button}
                onPress={takePhoto}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#4caf50', '#388e3c', '#2e7d32']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.buttonIconContainer}>
                    <Text style={styles.buttonIcon}>📸</Text>
                  </View>
                  <Text style={styles.buttonText}>Camera</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {image && (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.analyzeButton, loading && styles.buttonDisabled]}
                onPress={analyzeImage}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#1565c0', '#0d47a1', '#0277bd']}
                  style={styles.analyzeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View style={{ opacity: shimmerOpacity }}>
                        <ActivityIndicator color="#fff" size="small" />
                      </Animated.View>
                      <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.analyzeIconContainer}>
                        <Text style={styles.analyzeButtonIcon}>🔍</Text>
                      </View>
                      <Text style={styles.analyzeButtonText}>Check Plant Health</Text>
                      <Text style={styles.analyzeButtonSubtext}>Tap to analyze</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Results */}
        {result && (
          <Animated.View
            style={[
              styles.resultsSection,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            {/* Status Card */}
            {result.disease_detected ? (
              <View style={[styles.statusCard, { borderColor: getStatusColor(result.severity) }]}>
                <LinearGradient
                  colors={[
                    getStatusColor(result.severity) + '20',
                    getStatusColor(result.severity) + '08',
                    '#ffffff',
                  ]}
                  style={styles.statusCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statusIconContainer}>
                    <Text style={[styles.statusIcon, { fontSize: 56 }]}>
                      {getStatusIcon(result.severity)}
                    </Text>
                  </View>
                  <Text style={[styles.statusTitle, { color: getStatusColor(result.severity) }]}>
                    {result.disease_name || 'Disease Detected'}
                  </Text>
                  <View style={styles.badgeContainer}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: getStatusColor(result.severity),
                        },
                      ]}
                    >
                      <Text style={styles.badgeTextWhite}>
                        {result.severity?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>
                    <View style={[styles.badge, styles.badgeInfo]}>
                      <Text style={styles.badgeText}>{result.confidence}% Confidence</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <View style={[styles.statusCard, styles.statusHealthy]}>
                <LinearGradient
                  colors={['#e8f5e9', '#c8e6c9', '#ffffff']}
                  style={styles.statusCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statusIconContainer}>
                    <Text style={[styles.statusIcon, { fontSize: 56 }]}>✅</Text>
                  </View>
                  <Text style={[styles.statusTitle, styles.statusTitleHealthy]}>
                    Your Plant is Healthy!
                  </Text>
                  <Text style={styles.healthyMessage}>
                    Great news! No diseases detected. Your plant appears to be in excellent condition.
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Health Progress Bar */}
            {result.feature_analysis?.combined_analysis?.['10_stress_indicators'] && (
              <View style={styles.healthBarSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📊</Text>
                  <Text style={styles.sectionTitle}>Overall Plant Health</Text>
                </View>
                {(() => {
                  const stressData = result.feature_analysis.combined_analysis['10_stress_indicators'];
                  const stressScore = stressData.stress_score || 0;
                  const healthPercent = (1 - stressScore) * 100;
                  const healthStatus = stressData.health_status || stressData.overall_assessment || 'Unknown';
                  const progressColor = healthPercent > 70 ? '#4caf50' : healthPercent > 40 ? '#ff9800' : '#f44336';
                  
                  return (
                    <View>
                      <View style={styles.progressBarContainer}>
                        <Animated.View
                          style={[
                            styles.progressBar,
                            {
                              width: progressAnim.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                              }),
                              backgroundColor: progressColor,
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={[progressColor, progressColor + 'CC']}
                            style={styles.progressBarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          />
                        </Animated.View>
                      </View>
                      <View style={styles.progressTextContainer}>
                        <Animated.Text
                          style={[
                            styles.progressText,
                            {
                              color: progressColor,
                            },
                          ]}
                        >
                          {Math.round(healthPercent)}%
                        </Animated.Text>
                        <Text style={styles.healthStatusText}>{healthStatus}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Symptoms */}
            {result.symptoms && result.symptoms.length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.iconBadge}>
                    <Text style={styles.sectionIcon}>🔍</Text>
                  </View>
                  <Text style={styles.sectionTitle}>What's Wrong?</Text>
                </View>
                {result.symptoms.map((symptom, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.listItem,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateX: slideAnim.interpolate({
                              inputRange: [0, 50],
                              outputRange: [0, -20],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.bulletPoint} />
                    <Text style={styles.listText}>{symptom}</Text>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Treatment */}
            {result.treatment && result.treatment.length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, styles.iconBadgeSuccess]}>
                    <Text style={styles.sectionIcon}>💡</Text>
                  </View>
                  <Text style={styles.sectionTitle}>What You Should Do</Text>
                </View>
                {result.treatment.map((action, index) => (
                  <View key={index} style={styles.listItem}>
                    <LinearGradient
                      colors={['#2196f3', '#1976d2']}
                      style={styles.numberBadge}
                    >
                      <Text style={styles.numberText}>{index + 1}</Text>
                    </LinearGradient>
                    <View style={styles.treatmentTextContainer}>
                      <Text style={styles.listText}>{action}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Causes */}
            {result.possible_causes && result.possible_causes.length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, styles.iconBadgeInfo]}>
                    <Text style={styles.sectionIcon}>🤔</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Why This Happened</Text>
                </View>
                {result.possible_causes.map((cause, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.bulletPoint, styles.bulletPointInfo]} />
                    <Text style={styles.listText}>{cause}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Farmer-Specific Recommendations */}
            {result.farmer_recommendations && (
              <>
                {/* Action Urgency & Economic Impact */}
                <View style={styles.infoCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.iconBadge, { backgroundColor: '#ff5722' }]}>
                      <Text style={styles.sectionIcon}>⏰</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Action Timeline & Impact</Text>
                  </View>
                  
                  {result.farmer_recommendations.action_urgency && (
                    <View style={styles.farmCard}>
                      <Text style={styles.farmLabel}>⚡ Action Needed:</Text>
                      <Text style={styles.farmValue}>{result.farmer_recommendations.action_urgency}</Text>
                    </View>
                  )}
                  
                  {result.farmer_recommendations.economic_impact && (
                    <View style={styles.farmCard}>
                      <Text style={styles.farmLabel}>💰 Economic Impact:</Text>
                      <Text style={styles.farmValue}>{result.farmer_recommendations.economic_impact}</Text>
                    </View>
                  )}
                  
                  {result.farmer_recommendations.spread_risk && (
                    <View style={styles.farmCard}>
                      <Text style={styles.farmLabel}>🌾 Spread Risk:</Text>
                      <Text style={styles.farmValue}>{result.farmer_recommendations.spread_risk}</Text>
                    </View>
                  )}
                  
                  {result.farmer_recommendations.estimated_recovery_time && (
                    <View style={styles.farmCard}>
                      <Text style={styles.farmLabel}>⏱️ Recovery Time:</Text>
                      <Text style={styles.farmValue}>{result.farmer_recommendations.estimated_recovery_time}</Text>
                    </View>
                  )}
                </View>

                {/* Treatment Options */}
                {(result.farmer_recommendations.organic_solutions || result.farmer_recommendations.chemical_solutions) && (
                  <View style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.iconBadge, { backgroundColor: '#4caf50' }]}>
                        <Text style={styles.sectionIcon}>🌿</Text>
                      </View>
                      <Text style={styles.sectionTitle}>Treatment Solutions</Text>
                    </View>

                    {result.farmer_recommendations.organic_solutions && result.farmer_recommendations.organic_solutions.length > 0 && (
                      <View style={styles.treatmentSection}>
                        <Text style={styles.treatmentTitle}>🍃 Organic/Natural Solutions:</Text>
                        {result.farmer_recommendations.organic_solutions.map((solution, index) => (
                          <View key={index} style={styles.listItem}>
                            <View style={[styles.bulletPoint, { backgroundColor: '#4caf50' }]} />
                            <Text style={styles.listText}>{solution}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {result.farmer_recommendations.chemical_solutions && result.farmer_recommendations.chemical_solutions.length > 0 && (
                      <View style={styles.treatmentSection}>
                        <Text style={styles.treatmentTitle}>⚗️ Chemical Solutions:</Text>
                        {result.farmer_recommendations.chemical_solutions.map((solution, index) => (
                          <View key={index} style={styles.listItem}>
                            <View style={[styles.bulletPoint, { backgroundColor: '#ff9800' }]} />
                            <Text style={styles.listText}>{solution}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Prevention & Harvest */}
                <View style={styles.infoCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.iconBadge, { backgroundColor: '#9c27b0' }]}>
                      <Text style={styles.sectionIcon}>🛡️</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Prevention & Harvest Guide</Text>
                  </View>

                  {result.farmer_recommendations.prevention_tips && result.farmer_recommendations.prevention_tips.length > 0 && (
                    <View style={styles.treatmentSection}>
                      <Text style={styles.treatmentTitle}>🛡️ Prevention Tips:</Text>
                      {result.farmer_recommendations.prevention_tips.map((tip, index) => (
                        <View key={index} style={styles.listItem}>
                          <LinearGradient
                            colors={['#9c27b0', '#7b1fa2']}
                            style={styles.numberBadge}
                          >
                            <Text style={styles.numberText}>{index + 1}</Text>
                          </LinearGradient>
                          <View style={styles.treatmentTextContainer}>
                            <Text style={styles.listText}>{tip}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {result.farmer_recommendations.harvest_recommendation && (
                    <View style={styles.farmCard}>
                      <Text style={styles.farmLabel}>🌾 Harvest Status:</Text>
                      <Text style={styles.farmValue}>{result.farmer_recommendations.harvest_recommendation}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Advanced Features */}
            {(result.feature_analysis?.combined_analysis || result.feature_analysis?.ai_evaluation) && (() => {
              const features = result.feature_analysis?.combined_analysis || result.feature_analysis?.ai_evaluation || {};
              return (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, styles.iconBadgeAdvanced]}>
                    <Text style={styles.sectionIcon}>🔬</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Advanced Health Indicators</Text>
                </View>

                {/* Chlorophyll Index */}
                {features['11_chlorophyll_index'] && (
                  <View style={styles.featureCard}>
                    <LinearGradient
                      colors={['#e3f2fd', '#f5f5f5', '#ffffff']}
                      style={styles.featureCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.featureTitle}>🌱 Plant Nutrition (Nitrogen)</Text>
                      {(() => {
                        const chlData = features['11_chlorophyll_index'];
                        const level = chlData.estimated_nitrogen_level || 'Unknown';
                        const explanation =
                          level === 'High'
                            ? '✅ Good! Your plant has enough nitrogen'
                            : level === 'Low'
                            ? '⚠️ Low nitrogen - add nitrogen fertilizer (like urea or compost)'
                            : '⚠️ Moderate nitrogen - monitor and fertilize if needed';
                        const color = level === 'High' ? '#2e7d32' : level === 'Low' ? '#c62828' : '#f57c00';
                        
                        return (
                          <>
                            <View style={[styles.featureValueBadge, { borderColor: color }]}>
                              <Text style={[styles.featureValue, { color }]}>{level}</Text>
                            </View>
                            <Text style={styles.featureExplanation}>{explanation}</Text>
                          </>
                        );
                      })()}
                    </LinearGradient>
                  </View>
                )}

                {/* pH Proxy */}
                {features['12_ph_proxy'] && (
                  <View style={styles.featureCard}>
                    <LinearGradient
                      colors={['#fff3e0', '#f5f5f5', '#ffffff']}
                      style={styles.featureCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.featureTitle}>🧪 Soil Acidity (pH Level)</Text>
                      {(() => {
                        const phData = features['12_ph_proxy'];
                        const phEstimate = phData.ph_estimate || 'Unknown';
                        let explanation = '';
                        let color = '#666';
                        
                        if (phEstimate.includes('Low') || phEstimate.includes('Acidic')) {
                          explanation = '⚠️ Soil may be too acidic - add lime or wood ash to balance';
                          color = '#f57c00';
                        } else if (phEstimate.includes('High') || phEstimate.includes('Alkaline')) {
                          explanation = '⚠️ Soil may be too alkaline - add sulfur or organic matter';
                          color = '#f57c00';
                        } else {
                          explanation = '✅ Soil pH appears balanced';
                          color = '#2e7d32';
                        }
                        
                        return (
                          <>
                            <View style={[styles.featureValueBadge, { borderColor: color }]}>
                              <Text style={[styles.featureValue, { color }]}>{phEstimate}</Text>
                            </View>
                            <Text style={styles.featureExplanation}>{explanation}</Text>
                          </>
                        );
                      })()}
                    </LinearGradient>
                  </View>
                )}
              </View>
              );
            })()}
          </Animated.View>
        )}

        {/* Instructions */}
        {!result && !image && (
          <Animated.View
            style={[
              styles.instructionsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.instructionsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.instructionsHeader}>
                <Text style={styles.instructionsIcon}>📖</Text>
                <Text style={styles.instructionsTitle}>How to Use</Text>
              </View>
              <View style={styles.instructionsList}>
                {[
                  'Take a clear photo of a single leaf',
                  'Our AI will analyze your plant\'s health',
                  'Get clear recommendations on what to do',
                  'Follow the steps to help your plant recover',
                ].map((text, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <LinearGradient
                      colors={['#1565c0', '#1976d2']}
                      style={styles.instructionNumber}
                    >
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </LinearGradient>
                    <Text style={styles.instructionText}>{text}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>
                  Tip: For best results, take the photo in good lighting with the leaf clearly visible.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1128',
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorCircleTopLeft: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.6,
    left: -width * 0.3,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  decorCircleRight: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.25,
    right: -width * 0.3,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  decorCircleBottom: {
    width: width * 1.1,
    height: width * 1.1,
    bottom: -width * 0.7,
    left: -width * 0.2,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b3e5fc',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  imageSection: {
    padding: 24,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  image: {
    width: '100%',
    height: 360,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  placeholderContainer: {
    width: '100%',
    height: 360,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  placeholderIcon: {
    fontSize: 84,
    marginBottom: 20,
    opacity: 0.8,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  placeholderHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    letterSpacing: 0.5,
  },
  changeImageButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  changeImageButtonContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  changeImageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  button: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  buttonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 22,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  analyzeButton: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1565c0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  analyzeButtonGradient: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  analyzeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonIcon: {
    fontSize: 26,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  analyzeButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  resultsSection: {
    padding: 24,
    paddingTop: 0,
  },
  statusCard: {
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  statusHealthy: {
    borderColor: '#4caf50',
  },
  statusCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  statusIconContainer: {
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 72,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statusTitleHealthy: {
    color: '#2e7d32',
  },
  healthyMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeInfo: {
    backgroundColor: 'rgba(227, 242, 253, 0.95)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#1976d2',
  },
  badgeTextWhite: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#fff',
  },
  healthBarSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeSuccess: {
    backgroundColor: '#e8f5e9',
  },
  iconBadgeInfo: {
    backgroundColor: '#e3f2fd',
  },
  iconBadgeAdvanced: {
    backgroundColor: '#fff3e0',
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    height: 32,
    backgroundColor: '#e8eaf6',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  progressBarGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  healthStatusText: {
    fontSize: 17,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 28,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196f3',
    marginTop: 10,
    marginRight: 16,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  bulletPointInfo: {
    backgroundColor: '#42a5f5',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  numberText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  treatmentTextContainer: {
    flex: 1,
    paddingTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 17,
    color: '#2a2a2a',
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  featureCard: {
    borderRadius: 24,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(33, 150, 243, 0.2)',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  featureCardGradient: {
    padding: 24,
    borderRadius: 24,
    borderLeftWidth: 6,
    borderLeftColor: '#2196f3',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  farmCard: {
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#2196f3',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  farmLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#555',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  farmValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  treatmentSection: {
    marginBottom: 18,
  },
  treatmentTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 14,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  featureValueBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderWidth: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  featureExplanation: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontWeight: '500',
  },
  instructionsCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  instructionsGradient: {
    padding: 28,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  instructionsIcon: {
    fontSize: 28,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1565c0',
    letterSpacing: 0.5,
  },
  instructionsList: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#1565c0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  instructionText: {
    flex: 1,
    fontSize: 17,
    color: '#333',
    lineHeight: 26,
    fontWeight: '600',
    paddingTop: 8,
    letterSpacing: 0.2,
  },
  tipBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#1976d2',
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
