import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { captureRef } from 'react-native-view-shot';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const CareerPredictionDashboard = ({ navigation }) => {
  const [sourceData, setSourceData] = useState({});
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [chartImage, setChartImage] = useState(null);
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();
  const chartRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) return;
      try {
        const res = await axios.post("https://edu-backend-mvzo.onrender.com/api/auth/user", { token });
        setUser(res.data.user);
        // Get email from user data
        if (res.data.user && res.data.user.email) {
          setEmail(res.data.user.email);
        }
      } catch (error) {
        console.error("User fetch failed", error);
      }
    };
    fetchUser();
  }, []);

  const sources = [
    { key: "college_course_predict", label: "College Course Assessment" },
    { key: "college_pq_predict", label: "Personality Assessment" },
    { key: "college_cert_predict", label: "Skills & Certifications" },
    { key: "prediction_exam_college", label: "Career Aptitude Test" }
  ];
  
  const safeParseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return null;
    }
  };
  
  const extractCareers = (parsedData) => {
    if (!parsedData) return [];
    let careersArray = [];
  
    if (Array.isArray(parsedData)) {
      careersArray = parsedData;
    } else if (parsedData.careers) {
      careersArray = parsedData.careers;
    } else if (typeof parsedData === "object") {
      careersArray = Object.entries(parsedData)
        .filter(([key]) => !["id", "name", "email", "userId"].includes(key))
        .map(([career, score]) => ({ career, score: parseFloat(score) || 0 }));
    }
    return careersArray.filter((item) => !isNaN(item.score));
  };
  
  useEffect(() => {
    const loadData = async () => {
      const dataBySource = {};
      let combined = {};
  
      for (const { key, label } of sources) {
        const storedData = await AsyncStorage.getItem(key);
        if (storedData) {
          const parsedData = safeParseJSON(storedData);
          const careers = extractCareers(parsedData);
          dataBySource[key] = {
            label,
            data: careers
              .map(({ career, score }) => ({ career, score: parseFloat(score.toFixed(2)) }))
              .sort((a, b) => b.score - a.score)
          };
  
          careers.forEach(({ career, score }) => {
            combined[career] = (combined[career] || 0) + score;
          });
        }
      }
  
      // Convert combined scores into an array format
      const sortedCombined = Object.entries(combined)
        .map(([career, score]) => ({ career, score: parseFloat(score.toFixed(2)) }))
        .sort((a, b) => b.score - a.score);
  
      // Store the sorted array in AsyncStorage
      await AsyncStorage.setItem("overallprediction_college", JSON.stringify(sortedCombined));
  
      setSourceData(dataBySource);
      setCombinedData(sortedCombined);
      await AsyncStorage.setItem("combined_scores", JSON.stringify(sortedCombined));
      setLoading(false);
    };
  
    const loadCombinedData = async () => {
      const storedCombinedData = await AsyncStorage.getItem("overallprediction_college");
      if (storedCombinedData) {
        const parsedCombinedData = safeParseJSON(storedCombinedData);
        if (Array.isArray(parsedCombinedData)) {
          setCombinedData(parsedCombinedData);
        }
      }
    };
  
    loadCombinedData();
    loadData();
  }, []);
  
  useEffect(() => {
    const saveToDatabase = async () => {
      if (!user || !user._id) return;

      try {
        const collegeCertPredict = await AsyncStorage.getItem("college_cert_predict");
        const collegeCoursePredict = await AsyncStorage.getItem("college_course_predict");
        const collegePqPredict = await AsyncStorage.getItem("college_pq_predict");
        const predictionExamCollege = await AsyncStorage.getItem("prediction_exam_college");
        const examScores = await AsyncStorage.getItem("examScores");

        const payload = {
          userId: user._id,
          college_cert_predict: safeParseJSON(collegeCertPredict) || {},
          college_course_prediction: safeParseJSON(collegeCoursePredict) || {},
          college_pq_predict: safeParseJSON(collegePqPredict) || {},
          prediction_exam_college: safeParseJSON(predictionExamCollege) || {},
          examScores: safeParseJSON(examScores) || {},
          overallprediction_college: combinedData,
        };

        const res = await axios.post("https://edu-backend-mvzo.onrender.com/api/prediction_college/save", payload);
        console.log("College predictions saved successfully:", res.data);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Successfully saved to database!",
        });
      } catch (error) {
        console.error("Failed to save college predictions", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to save data. Please try again.",
        });
      }
    };

    if (combinedData.length > 0 && user) {
      saveToDatabase();
    }
  }, [user, combinedData]);

  // Capture chart as image
//   const captureChart = async () => {
//     try {
//         const uri = await chartRef.current.capture();
//         console.log("Captured Chart URI:", uri);
//         return uri;
//     } catch (error) {
//         console.error("Error capturing chart:", error);
//         return null;
//     }
// };


// Current problematic implementation
const captureFullScreen = async () => {
  if (contentRef.current) {
    try {
      const uri = await captureRef(contentRef.current, {
        format: 'jpg',
        quality: 0.7
      });
      console.log("Full screen captured:", uri);
      return uri;
    } catch (error) {
      console.error("Failed to capture screen:", error);
      return null;
    }
  }
  return null;
};

  // Prepare for email sending by capturing the chart image first
  const prepareForEmail = async () => {
    try {
      const uri = await captureChart();
      if (!uri) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to capture chart image",
        });
        return;
      }
      setChartImage(uri);
      setShowEmailModal(true);
    } catch (error) {
      console.error("Error preparing email:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to prepare email",
      });
    }
  };


  const fileToBase64 = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // For smaller files, read directly
      if (fileInfo.size < 1000000) { // Less than 1MB
        return await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      
      // For larger files, consider a direct approach without base64
      // You might need to implement a chunked upload on the server side
      console.warn("File is large, this might cause memory issues");
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (error) {
      console.error("Error converting file to base64:", error);
      return null;
    }
  };

  const compressImage = async (uri) => {
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Reasonable size for email
        { compress: 0.5, format: SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error compressing image:", error);
      return uri;
    }
  };

  
  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address",
      });
      return;
    }
  
    setSendingEmail(true);
    try {
      if (!chartImage) {
        throw new Error("Chart image is not available");
      }
      
      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(chartImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Send data in the format expected by backend
      const response = await axios.post(
        "https://edu-backend-mvzo.onrender.com/api/auth/send-graph-email", 
        {
          email: email,
          image: `data:image/jpeg;base64,${base64Image}`
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      console.log("Email sent response:", response.data);
      
      Toast.show({
        type: "success",
        text1: "Email Sent",
        text2: "Your career results have been sent to your email!",
      });
      
      setShowEmailModal(false);
    } catch (error) {
      console.error("Failed to send email:", error.message);
      // Error handling code remains the same
    } finally {
      setSendingEmail(false);
    }
  };
  
  
  // Improved chart capture function
  const captureChart = async () => {
    if (!chartRef.current) {
      console.error("Chart ref is not available");
      return null;
    }
    
    try {
      // Brief delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const uri = await chartRef.current.capture();
      console.log("Captured Chart URI:", uri);
      return uri;
    } catch (error) {
      console.error("Error capturing chart:", error);
      return null;
    }
  };


  // Format data for chart
  const formatChartData = (data) => {
    return {
      labels: data.slice(0, 5).map(item => item.career),
      datasets: [
        {
          data: data.slice(0, 5).map(item => item.score)
        }
      ]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 1,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
     
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentWrapper} ref={contentRef}>
          <View style={styles.cardContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.header}>Your Career Prediction Results</Text>
              <TouchableOpacity 
                style={styles.emailButton}
                onPress={prepareForEmail}
              >
                <Text style={styles.emailButtonText}>Email Results</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading career data...</Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Overall Career Match Scores</Text>
                  <View style={styles.topCareersContainer}>
                    <Text style={styles.subsectionTitle}>Top Recommended Careers</Text>
                    {combinedData.slice(0, 5).map((career, index) => (
                      <View key={career.career} style={styles.careerItem}>
                        <Text style={styles.careerName}>{index + 1}. {career.career}</Text>
                        <Text style={styles.careerScore}>{career.score.toFixed(1)}</Text>
                      </View>
                    ))}
                  </View>
                  <ViewShot 
  ref={chartRef} 
  options={{ format: 'jpg', quality: 0.9 }}
  style={styles.chartContainer}
>
  <Text style={styles.subsectionTitle}>Combined Career Match Scores</Text>
  <BarChart
    data={formatChartData(combinedData)}
    width={screenWidth - 50}
    height={300}
    chartConfig={chartConfig}
    verticalLabelRotation={30}
    fromZero
    showValuesOnTopOfBars
  />
</ViewShot>
                </View>

                {sources.map(({ key, label }) => (
                  sourceData[key] && (
                    <View key={key} style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>{label}</Text>
                      <View style={styles.topCareersContainer}>
                        <Text style={styles.subsectionTitle}>Top Recommended Careers</Text>
                        {sourceData[key].data.slice(0, 5).map((career, index) => (
                          <View key={career.career} style={styles.careerItem}>
                            <Text style={styles.careerName}>{index + 1}. {career.career}</Text>
                            <Text style={styles.careerScore}>{career.score.toFixed(1)}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.chartContainer}>
                        <Text style={styles.subsectionTitle}>Career Match Scores</Text>
                        <BarChart
                          data={formatChartData(sourceData[key].data)}
                          width={screenWidth - 50}
                          height={300}
                          chartConfig={chartConfig}
                          verticalLabelRotation={30}
                          fromZero
                          showValuesOnTopOfBars
                        />
                      </View>
                    </View>
                  )
                ))}

                <View style={styles.infoContainer}>
                  <Text style={styles.sectionTitle}>How to Interpret Your Results</Text>
                  <Text style={styles.infoText}>
                    The scores represent how well your skills, personality, and preferences align with each career. 
                    Higher scores indicate a stronger match. Use this information to explore careers that best suit you!
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.boldText}>Want to save these results?</Text> Click the "Email Results" button to receive a detailed report in your inbox.
                  </Text>
                </View>
                
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={styles.emailFullButton}
                    onPress={prepareForEmail}
                  >
                    <Text style={styles.buttonText}>Email My Results</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => router.push("Dashboard")}
                  >
                    <Text style={styles.buttonText}>Return to Dashboard</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Results to Email</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {/* Show a message about the chart image status */}
            <Text style={styles.chartStatusText}>
              {chartImage ? "Chart image captured successfully! ✅" : "Preparing chart image..."}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEmailModal(false)}
                disabled={sendingEmail}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, !chartImage && styles.disabledButton]}
                onPress={handleSendEmail}
                disabled={sendingEmail || !chartImage}
              >
                {sendingEmail ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
   
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    padding: 16,
    paddingBottom: 30,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  emailButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  emailButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
  },
  topCareersContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  careerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  careerName: {
    fontSize: 15,
    color: "#111827",
    flex: 1,
  },
  careerScore: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
  },
  chartContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  infoContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: "#111827",
  },
  buttonsContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  emailFullButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  emailInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  chartStatusText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 16,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default CareerPredictionDashboard;