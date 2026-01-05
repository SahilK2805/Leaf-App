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
  Linking,
  Modal,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Replace with your Render URL after deployment
const API_URL = 'https://YOUR_RENDER_URL_HERE.onrender.com';
const HISTORY_KEY = 'leaf_history_v1';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState([]);
  
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

  // Load stored history on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load history', err);
      }
    })();
  }, []);

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
        await addHistoryEntry(response.data);
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

  const addHistoryEntry = async (analysis) => {
    try {
      const entry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        disease_name: analysis?.disease_name || 'Healthy',
        severity: analysis?.severity || 'unknown',
        confidence: Math.round(analysis?.confidence || 0),
        image,
      };

      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 50);
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch((err) =>
          console.warn('Failed to persist history', err)
        );
        return updated;
      });
    } catch (err) {
      console.warn('Failed to save history entry', err);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
      setHistory([]);
    } catch (err) {
      console.warn('Failed to clear history', err);
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

  // Farmer recommendation visibility checks to avoid empty cards
  const farmer = result?.farmer_recommendations || {};
  const hasActionData =
    farmer.action_urgency || farmer.economic_impact || farmer.spread_risk || farmer.estimated_recovery_time;
  const hasTreatmentSolutions =
    (farmer.organic_solutions && farmer.organic_solutions.length > 0) ||
    (farmer.chemical_solutions && farmer.chemical_solutions.length > 0);
  const hasPreventionData =
    (farmer.prevention_tips && farmer.prevention_tips.length > 0) || farmer.harvest_recommendation;
  const hasTreatmentPlaybook =
    farmer.spray_window || farmer.application_recipe || (farmer.supply_checklist && farmer.supply_checklist.length > 0);
  const hasSafetyHygiene =
    (farmer.isolation_sanitation && farmer.isolation_sanitation.length > 0) ||
    farmer.rescan_reminder ||
    farmer.harvest_withdrawal;
  const hasWaterNutrition = !!farmer.water_nutrition;
  const hasFieldChecklist =
    (farmer.scouting_checklist && farmer.scouting_checklist.length > 0) || farmer.photo_tip;
  const hasProductLinks =
    farmer.product_recommendations && Array.isArray(farmer.product_recommendations) && farmer.product_recommendations.length > 0;
  const productList = hasProductLinks ? farmer.product_recommendations : [];

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
        colors={['#0f172a', '#1f2937', '#312e81']}
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

      {activeTab === 'home' && (
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
                  colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
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
                  colors={['#22d3ee', '#0ea5e9', '#0284c7']}
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
                  colors={['#f97316', '#fb923c', '#f59e0b']}
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
                  colors={['#0f172a', '#0b1221', '#0f172a']}
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

            {/* Quick Summary Row */}
            <View style={styles.quickRow}>
              <LinearGradient
                colors={['#7c3aed', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.miniCard}
              >
                <View style={[styles.miniIconBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  <Text style={styles.miniIcon}>🩺</Text>
                </View>
                <Text style={styles.miniLabel}>Diagnosis</Text>
                <Text style={styles.miniValue}>{result.disease_name || 'Healthy'}</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#f97316', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.miniCard}
              >
                <View style={[styles.miniIconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.miniIcon}>📈</Text>
                </View>
                <Text style={styles.miniLabel}>Severity</Text>
                <Text style={styles.miniValue}>{(result.severity || 'Unknown').toUpperCase()}</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#22c55e', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.miniCard}
              >
                <View style={[styles.miniIconBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  <Text style={styles.miniIcon}>✅</Text>
                </View>
                <Text style={styles.miniLabel}>Confidence</Text>
                <Text style={styles.miniValue}>{Math.round(result.confidence || 0)}%</Text>
              </LinearGradient>
            </View>

            {/* Action spotlight */}
            {result.farmer_recommendations?.action_urgency && (
              <LinearGradient
                colors={['#ec4899', '#f472b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBand}
              >
                <Text style={styles.actionBandIcon}>⏰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionBandTitle}>Action Timeline</Text>
                  <Text style={styles.actionBandText}>{result.farmer_recommendations.action_urgency}</Text>
                  {result.farmer_recommendations.spread_risk && (
                    <Text style={styles.actionBandSubtext}>Spread risk: {result.farmer_recommendations.spread_risk}</Text>
                  )}
                </View>
              </LinearGradient>
            )}

            {/* Quick prevention chips */}
            {result.farmer_recommendations?.prevention_tips?.length > 0 && (
              <View style={styles.chipRow}>
                {result.farmer_recommendations.prevention_tips.slice(0, 3).map((tip, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{tip}</Text>
                  </View>
                ))}
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
            {farmer && hasActionData && (
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
                {hasTreatmentSolutions && (
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
                {hasPreventionData && (
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
                )}
              </>
            )}

            {/* Treatment Playbook */}
            {farmer && hasTreatmentPlaybook && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: '#0288d1' }]}>
                    <Text style={styles.sectionIcon}>🧴</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Treatment Playbook</Text>
                </View>

                {farmer.spray_window && (
                  <View style={styles.farmCard}>
                    <Text style={styles.farmLabel}>🕒 Best Spray Window:</Text>
                    <Text style={styles.farmValue}>{farmer.spray_window}</Text>
                  </View>
                )}

                {farmer.application_recipe && Array.isArray(farmer.application_recipe) && farmer.application_recipe.length > 0 && (
                  <View style={styles.treatmentSection}>
                    <Text style={styles.treatmentTitle}>📋 Mix & Apply Steps:</Text>
                    {farmer.application_recipe.map((step, index) => (
                      <View key={index} style={styles.listItem}>
                        <LinearGradient colors={['#0288d1', '#0277bd']} style={styles.numberBadge}>
                          <Text style={styles.numberText}>{index + 1}</Text>
                        </LinearGradient>
                        <View style={styles.treatmentTextContainer}>
                          <Text style={styles.listText}>{step}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {farmer.supply_checklist && Array.isArray(farmer.supply_checklist) && farmer.supply_checklist.length > 0 && (
                  <View style={styles.treatmentSection}>
                    <Text style={styles.treatmentTitle}>🧰 Supply Checklist:</Text>
                    <View style={styles.supplyRow}>
                      {farmer.supply_checklist.map((item, index) => (
                        <View key={index} style={styles.supplyChip}>
                          <Text style={styles.supplyText}>• {item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Safety & Hygiene */}
            {farmer && hasSafetyHygiene && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: '#c62828' }]}>
                    <Text style={styles.sectionIcon}>🧤</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Safety & Hygiene</Text>
                </View>

                {farmer.isolation_sanitation && Array.isArray(farmer.isolation_sanitation) && farmer.isolation_sanitation.length > 0 && (
                  <View style={styles.treatmentSection}>
                    <Text style={styles.treatmentTitle}>🚧 Isolation & Clean-Up:</Text>
                    {farmer.isolation_sanitation.map((tip, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={[styles.bulletPoint, { backgroundColor: '#c62828' }]} />
                        <Text style={styles.listText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {farmer.harvest_withdrawal && (
                  <View style={styles.farmCard}>
                    <Text style={styles.farmLabel}>⏳ Harvest Wait:</Text>
                    <Text style={styles.farmValue}>{farmer.harvest_withdrawal}</Text>
                  </View>
                )}

                {farmer.rescan_reminder && (
                  <View style={styles.farmCard}>
                    <Text style={styles.farmLabel}>🔄 When to Rescan:</Text>
                    <Text style={styles.farmValue}>{farmer.rescan_reminder}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Water & Nutrition */}
            {farmer && hasWaterNutrition && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: '#2e7d32' }]}>
                    <Text style={styles.sectionIcon}>💧</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Water & Nutrition</Text>
                </View>
                <View style={styles.farmCard}>
                  <Text style={styles.farmLabel}>💦 Irrigation & Feeding:</Text>
                  <Text style={styles.farmValue}>{farmer.water_nutrition}</Text>
                </View>
              </View>
            )}

            {/* Field Checklist */}
            {farmer && hasFieldChecklist && (
              <View style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: '#6a1b9a' }]}>
                    <Text style={styles.sectionIcon}>📋</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Field Checklist</Text>
                </View>

                {farmer.scouting_checklist && Array.isArray(farmer.scouting_checklist) && farmer.scouting_checklist.length > 0 && (
                  <View style={styles.treatmentSection}>
                    <Text style={styles.treatmentTitle}>👀 Watch This Week:</Text>
                    {farmer.scouting_checklist.map((tip, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={[styles.bulletPoint, { backgroundColor: '#6a1b9a' }]} />
                        <Text style={styles.listText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {farmer.photo_tip && (
                  <View style={styles.farmCard}>
                    <Text style={styles.farmLabel}>📸 Photo Tip:</Text>
                    <Text style={styles.farmValue}>{farmer.photo_tip}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Recommended Products */}
            {farmer && hasProductLinks && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setProductModalVisible(true)}>
                <View style={styles.infoCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.iconBadge, { backgroundColor: '#ffb300' }]}>
                      <Text style={styles.sectionIcon}>🛒</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Recommended Products</Text>
                  </View>
                  <Text style={styles.listText}>
                    Tap to view {productList.length} recommended items from Amazon/Flipkart.
                  </Text>
                </View>
              </TouchableOpacity>
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
      )}

      {activeTab === 'history' && (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historyContent}
        >
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Analysis History</Text>
              <Text style={styles.historySubtitle}>Previous uploads and results</Text>
            </View>
            {history.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {history.length === 0 && (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyIcon}>🕒</Text>
              <Text style={styles.historyEmptyTitle}>No history yet</Text>
              <Text style={styles.historyEmptyText}>Run an analysis to see it saved here.</Text>
            </View>
          )}

          {history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyDisease}>{item.disease_name}</Text>
                  <Text style={styles.historyMeta}>
                    {item.severity?.toUpperCase()} • {item.confidence}% • {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.historyBadge, { backgroundColor: getStatusColor(item.severity) }]}>
                  <Text style={styles.historyBadgeText}>{getStatusIcon(item.severity)}</Text>
                </View>
              </View>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.historyImage} />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabIcon, activeTab === 'history' && styles.tabIconActive]}>🕓</Text>
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Product Recommendations Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={productModalVisible}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recommended Products</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {productList.map((product, index) => (
                <View key={index} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product.product_name || 'Product'}</Text>
                    {product.store && (
                      <View style={styles.storePill}>
                        <Text style={styles.storePillText}>{product.store}</Text>
                      </View>
                    )}
                  </View>

                  {product.usage_note && <Text style={styles.productNote}>{product.usage_note}</Text>}
                  {product.price_hint && <Text style={styles.productPrice}>{product.price_hint}</Text>}

                  {product.url && (
                    <TouchableOpacity
                      style={styles.productButton}
                      onPress={() => Linking.openURL(product.url)}
                    >
                      <LinearGradient colors={['#ffb300', '#ff9800']} style={styles.productButtonGradient}>
                        <Text style={styles.productButtonText}>Open Link</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050712',
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
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
  },
  decorCircleRight: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.25,
    right: -width * 0.3,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  decorCircleBottom: {
    width: width * 1.1,
    height: width * 1.1,
    bottom: -width * 0.7,
    left: -width * 0.2,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#7c3aed',
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
    paddingBottom: 140,
  },
  historyContent: {
    padding: 24,
    paddingBottom: 120,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e5e7eb',
  },
  historySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  clearButtonText: {
    color: '#e5e7eb',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  historyDisease: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f3f4f6',
  },
  historyMeta: {
    fontSize: 13,
    color: '#d1d5db',
    marginTop: 4,
  },
  historyBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  historyBadgeText: {
    color: '#fff',
    fontSize: 22,
  },
  historyImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 8,
  },
  historyEmpty: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  historyEmptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  historyEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  historyEmptyText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  bottomTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(12, 17, 34, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
  },
  tabIcon: {
    fontSize: 18,
    color: '#9ca3af',
  },
  tabIconActive: {
    color: '#c4b5fd',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: '#e5e7eb',
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
    shadowColor: '#7c3aed',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
    shadowColor: '#7c3aed',
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
    shadowColor: '#7c3aed',
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
    shadowColor: '#f59e0b',
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
    borderColor: '#10b981',
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
    color: '#a7f3d0',
  },
  healthyMessage: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 6,
  },
  miniCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniIcon: {
    fontSize: 20,
  },
  miniLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  miniValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.6,
  },
  actionBand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 16,
  },
  actionBandIcon: {
    fontSize: 28,
    marginRight: 12,
    color: '#fff',
  },
  actionBandTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actionBandText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  actionBandSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  chipText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.4,
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
  supplyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  supplyChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 136, 209, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 136, 209, 0.25)',
    shadowColor: '#0288d1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  supplyText: {
    fontSize: 14,
    color: '#0d47a1',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  productCard: {
    backgroundColor: 'rgba(255, 248, 225, 0.8)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
    shadowColor: '#ffb300',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4e342e',
    flex: 1,
    marginRight: 10,
    letterSpacing: 0.4,
  },
  storePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  storePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ff9800',
    letterSpacing: 0.5,
  },
  productNote: {
    fontSize: 15,
    color: '#5d4037',
    marginBottom: 6,
    fontWeight: '600',
    lineHeight: 22,
  },
  productPrice: {
    fontSize: 14,
    color: '#8d6e63',
    marginBottom: 10,
    fontWeight: '700',
  },
  productButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
  },
  productButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  productButtonText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  modalClose: {
    fontSize: 18,
    fontWeight: '800',
    color: '#555',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
