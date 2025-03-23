import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastAndroid, Platform, Alert } from "react-native";


const CareerPredictionDashboard = () => {
  const [sourceData, setSourceData] = useState({});
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const screenWidth = Dimensions.get("window").width;

  // Show toast or alert based on platform
  const showNotification = (message, type) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert(type === 'success' ? 'Success' : 'Error', message);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) return;
      try {
        const res = await axios.post("http://192.168.100.171:4000/api/auth/user", { token });
        setUser(res.data.user);
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
    } else if (typeof parsedData === 'object') {
      careersArray = Object.entries(parsedData)
        .filter(([key]) => !["id", "name", "email", "userId"].includes(key))
        .map(([career, score]) => ({ career, score: parseFloat(score) || 0 }));
    }
    return careersArray.filter(item => !isNaN(item.score));
  };
  
  useEffect(() => {
    const loadData = async () => {
      try {
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
  
        const sortedCombined = Object.entries(combined)
          .map(([career, score]) => ({ career, score: parseFloat(score.toFixed(2)) }))
          .sort((a, b) => b.score - a.score);
  
        // Store the sorted array in AsyncStorage
        await AsyncStorage.setItem("overallprediction_college", JSON.stringify(sortedCombined));
        await AsyncStorage.setItem("combined_scores", JSON.stringify(sortedCombined));
  
        setSourceData(dataBySource);
        setCombinedData(sortedCombined);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        showNotification("Failed to load prediction data", "error");
      }
    };
  
    // Check if we have stored combined data
    const checkStoredData = async () => {
      try {
        const storedCombinedData = await AsyncStorage.getItem("overallprediction_college");
        if (storedCombinedData) {
          const parsedCombinedData = safeParseJSON(storedCombinedData);
          if (Array.isArray(parsedCombinedData)) {
            setCombinedData(parsedCombinedData);
          }
        }
      } catch (error) {
        console.error("Error checking stored data:", error);
      }
    };
  
    checkStoredData();
    loadData();
  }, []);
  
  useEffect(() => {
    const saveData = async () => {
      if (!user || !user._id) return;
  
      try {
        const payload = {
          userId: user._id,
          college_cert_predict: safeParseJSON(await AsyncStorage.getItem("college_cert_predict")) || {},
          college_course_prediction: safeParseJSON(await AsyncStorage.getItem("college_course_predict")) || {},
          college_pq_predict: safeParseJSON(await AsyncStorage.getItem("college_pq_predict")) || {},
          prediction_exam_college: safeParseJSON(await AsyncStorage.getItem("prediction_exam_college")) || {},
          examScores: safeParseJSON(await AsyncStorage.getItem("examScores")) || {},
          overallprediction_college: combinedData, // Added this line for overall prediction
        };
  
        await axios.post("http://192.168.100.171:4000/api/prediction_college/save", payload);
        showNotification("✅ Successfully saved to database!", "success");
      } catch (error) {
        console.error("Failed to save college predictions", error);
        showNotification("❌ Failed to save data. Please try again.", "error");
      }
    };
  
    saveData();
  }, [user, combinedData]); // Added combinedData as dependency to trigger save when it changes

  // Format data for the chart kit
  const getChartData = (data, count = 10) => {
    const slicedData = data.slice(0, count);
    return {
      labels: slicedData.map(item => item.career),
      datasets: [
        {
          data: slicedData.map(item => item.score),
        }
      ]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.8,
    decimalPlaces: 1,
  };

  const renderCareerItem = (career, index) => (
    <View key={career.career} style={styles.careerItem}>
      <Text style={styles.careerItemText}>{index + 1}. {career.career}</Text>
      <Text style={styles.careerItemScore}>{career.score.toFixed(1)}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
       
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading career data...</Text>
        </View>
       
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentWrapper}>
          <View style={styles.card}>
            <Text style={styles.title}>Your Career Prediction Results</Text>

            {/* Overall Graph Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Career Match Scores</Text>
              
              <View style={styles.topCareersContainer}>
                <Text style={styles.subSectionTitle}>Top Recommended Careers</Text>
                {combinedData.slice(0, 5).map((career, index) => renderCareerItem(career, index))}
              </View>

              <View style={styles.chartContainer}>
                <Text style={styles.subSectionTitle}>Combined Career Match Scores</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={getChartData(combinedData, 10)}
                    width={screenWidth - 40}
                    height={300}
                    chartConfig={chartConfig}
                    verticalLabelRotation={30}
                    fromZero
                    showValuesOnTopOfBars
                  />
                </ScrollView>
              </View>
            </View>

            {/* Individual Source Graphs */}
            {sources.map(({ key, label }) => (
              sourceData[key] && (
                <View key={key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{label}</Text>
                  
                  <View style={styles.topCareersContainer}>
                    <Text style={styles.subSectionTitle}>Top Recommended Careers</Text>
                    {sourceData[key].data.slice(0, 5).map((career, index) => renderCareerItem(career, index))}
                  </View>

                  <View style={styles.chartContainer}>
                    <Text style={styles.subSectionTitle}>Career Match Scores</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={getChartData(sourceData[key].data, 10)}
                        width={screenWidth - 40}
                        height={300}
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        fromZero
                        showValuesOnTopOfBars
                      />
                    </ScrollView>
                  </View>
                </View>
              )
            ))}

            {/* Interpretation Section */}
            <View style={styles.interpretationContainer}>
              <Text style={styles.sectionTitle}>How to Interpret Your Results</Text>
              <Text style={styles.interpretationText}>
                The scores represent how well your skills, personality, and preferences align with each career.
                Higher scores indicate a stronger match. Use this information to explore careers that best suit you!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4F46E5",
  },
  contentWrapper: {
    padding: 1,
    marginTop: 10, // Space for navbar
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  topCareersContainer: {
    marginBottom: 16,
  },
  careerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  careerItemText: {
    fontWeight: "500",
  },
  careerItemScore: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  chartContainer: {
    marginTop: 16,
  },
  interpretationContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  interpretationText: {
    color: "#666",
    lineHeight: 20,
  },
});

export default CareerPredictionDashboard;