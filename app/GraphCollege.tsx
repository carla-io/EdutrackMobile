import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {useRouter } from "expo-router"


const CareerPredictionDashboard = () => {
  const [sourceData, setSourceData] = useState({});
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const screenWidth = Dimensions.get("window").width - 40;
  const router = useRouter();

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
  
      await AsyncStorage.setItem("overallprediction_college", JSON.stringify(sortedCombined));
  
      setSourceData(dataBySource);
      setCombinedData(sortedCombined);
      await AsyncStorage.setItem("combined_scores", JSON.stringify(sortedCombined));
      setLoading(false);
    };
  
    const fetchCombinedData = async () => {
      const storedCombinedData = await AsyncStorage.getItem("overallprediction_college");
      if (storedCombinedData) {
        const parsedCombinedData = safeParseJSON(storedCombinedData);
        if (Array.isArray(parsedCombinedData)) {
          setCombinedData(parsedCombinedData);
        }
      }
    };
  
    fetchCombinedData();
    loadData();
  }, []);
  
  useEffect(() => {
    const saveToServer = async () => {
      if (!user || !user._id) return;

      const collegeCoursePredictStr = await AsyncStorage.getItem("college_course_predict");
      const collegeCertPredictStr = await AsyncStorage.getItem("college_cert_predict");
      const collegePqPredictStr = await AsyncStorage.getItem("college_pq_predict");
      const predictionExamCollegeStr = await AsyncStorage.getItem("prediction_exam_college");
      const examScoresStr = await AsyncStorage.getItem("examScores");

      const payload = {
        userId: user._id,
        college_cert_predict: safeParseJSON(collegeCertPredictStr) || {},
        college_course_prediction: safeParseJSON(collegeCoursePredictStr) || {},
        college_pq_predict: safeParseJSON(collegePqPredictStr) || {},
        prediction_exam_college: safeParseJSON(predictionExamCollegeStr) || {},
        examScores: safeParseJSON(examScoresStr) || {},
        overallprediction_college: combinedData,
      };

      try {
        const res = await axios.post("http://192.168.100.171:4000/api/prediction_college/save", payload);
        console.log("College predictions saved successfully:", res.data);
        Toast.show({
          type: 'success',
          text1: 'Successfully saved to database!',
        });
      } catch (error) {
        console.error("Failed to save college predictions", error);
        Toast.show({
          type: 'error',
          text1: 'Failed to save data. Please try again.',
        });
      }
    };

    if (combinedData.length > 0 && user) {
      saveToServer();
    }
  }, [user, combinedData]);

  const handleGenerateReport = () => {
    router.push("Finalcollege");
  };

  // Format data for React Native charts
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
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    }
  };

  return (
    <SafeAreaView style={styles.container}>
     
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentWrapper}>
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Your Career Prediction Results</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleGenerateReport}
              >
                <Text style={styles.buttonText}>Generate Detailed Report</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading career data...</Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Overall Career Match Scores</Text>
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Top Recommended Careers</Text>
                    {combinedData.slice(0, 5).map((career, index) => (
                      <View key={career.career} style={styles.careerItem}>
                        <Text style={styles.careerName}>{index + 1}. {career.career}</Text>
                        <Text style={styles.careerScore}>{career.score.toFixed(1)}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartSection}>
                    <Text style={styles.subSectionTitle}>Combined Career Match Scores</Text>
                    <BarChart
                      data={formatChartData(combinedData)}
                      width={screenWidth}
                      height={300}
                      chartConfig={chartConfig}
                      verticalLabelRotation={30}
                      fromZero={true}
                      yAxisLabel=""
                      yAxisSuffix=""
                      style={styles.chart}
                    />
                  </View>
                </View>

                {sources.map(({ key, label }) => (
                  sourceData[key] && (
                    <View key={key} style={styles.section}>
                      <Text style={styles.sectionTitle}>{label}</Text>
                      <View style={styles.subSection}>
                        <Text style={styles.subSectionTitle}>Top Recommended Careers</Text>
                        {sourceData[key].data.slice(0, 5).map((career, index) => (
                          <View key={career.career} style={styles.careerItem}>
                            <Text style={styles.careerName}>{index + 1}. {career.career}</Text>
                            <Text style={styles.careerScore}>{career.score.toFixed(1)}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.chartSection}>
                        <Text style={styles.subSectionTitle}>Career Match Scores</Text>
                        <BarChart
                          data={formatChartData(sourceData[key].data)}
                          width={screenWidth}
                          height={300}
                          chartConfig={chartConfig}
                          verticalLabelRotation={30}
                          fromZero={true}
                          yAxisLabel=""
                          yAxisSuffix=""
                          style={styles.chart}
                        />
                      </View>
                    </View>
                  )
                ))}

                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>How to Interpret Your Results</Text>
                  <Text style={styles.infoText}>
                    The scores represent how well your skills, personality, and preferences align with each career. 
                    Higher scores indicate a stronger match. Use this information to explore careers that best suit you!
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.emphasizedText}>Need more details?</Text> Generate a comprehensive report to get deeper insights into your career matches and personalized recommendations.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      
      <Toast />
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
  contentWrapper: {
    padding: 20,
    paddingTop: 50, // Space for navbar
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  subSection: {
    marginBottom: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  careerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  careerName: {
    fontWeight: "500",
    fontSize: 15,
    flex: 1,
  },
  careerScore: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: 15,
  },
  chartSection: {
    marginTop: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  infoBox: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 8,
  },
  emphasizedText: {
    fontWeight: "500",
  },
});

export default CareerPredictionDashboard;