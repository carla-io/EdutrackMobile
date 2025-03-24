import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  ActivityIndicator
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
 // Assuming you have a React Native version of Nav2

const screenWidth = Dimensions.get("window").width;

const CollegePredictionReport = () => {
  const [chartData, setChartData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString());
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const reportRef = useRef(null);

  // Course descriptions for personalized recommendations
  const courseDescriptions = {
    "Business Administration": "Business Administration focuses on developing management, leadership, and analytical skills. This course prepares you for roles in corporate management, entrepreneurship, and business operations.",
    "Computer Science": "Computer Science explores programming, algorithms, and software development. Your strong analytical abilities make you well-suited for careers in software engineering, AI development, or data science.",
    "Engineering": "Engineering programs develop technical problem-solving skills for designing and building systems and structures. Your aptitude suggests success in mechanical, civil, or electrical engineering fields.",
    "Psychology": "Psychology examines human behavior and mental processes. Your interpersonal strengths indicate potential success as a clinical psychologist, counselor, or human resources professional.",
    "Fine Arts": "Fine Arts cultivates creative expression through various mediums. Your creative talents suggest you would thrive in fields like graphic design, animation, or creative direction."
  };

  // Personality traits based on the assessment
  const personalityTraits = {
    "Business Administration": ["Leadership", "Strategic thinking", "Organization"],
    "Computer Science": ["Analytical thinking", "Problem-solving", "Logic"],
    "Engineering": ["Technical aptitude", "Spatial reasoning", "Mathematical proficiency"],
    "Psychology": ["Empathy", "Communication", "Observation"],
    "Fine Arts": ["Creativity", "Visual thinking", "Innovation"]
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) return;
      try {
        const res = await axios.post("https://edu-backend-mvzo.onrender.com/api/auth/user", { token });
        setUser(res.data.user);
      } catch (error) {
        console.error("User fetch failed", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const sources = {
          "Overall Prediction": ["predictions", "certprediction", "shspqprediction", "prediction_exam_shs"],
          "Academic Performance": ["predictions"],
          "Certifications & Awards": ["certprediction"],
          "Personality Assessment": ["shspqprediction"],
          "Aptitude Exam": ["prediction_exam_shs"]
        };
        
        const allCourses = {};
        const assessmentTotals = {
          "Academic Performance": 0,
          "Certifications & Awards": 0,
          "Personality Assessment": 0,
          "Aptitude Exam": 0
        };
        const colors = ["rgba(106, 17, 203, 0.7)", "rgba(37, 117, 252, 0.7)", "rgba(255, 65, 108, 0.7)", "rgba(255, 75, 43, 0.7)", "rgba(51, 255, 87, 0.7)"];
        
        for (const [label, keys] of Object.entries(sources)) {
          if (label === "Overall Prediction") continue;
          
          let categoryTotal = 0;
          
          for (const key of keys) {
            const storedData = await AsyncStorage.getItem(key);
            if (!storedData) continue;
            
            try {
              const data = JSON.parse(storedData);
              
              if (key === "predictions" && data) {
                Object.entries(data).forEach(([course, values]) => {
                  const displayCourse = course.replace(/^(BS|BA)\s+/, "");
                  const numericPercentage = parseFloat(values.percentage) || 0;
                  categoryTotal += numericPercentage;
                  allCourses[displayCourse] = (allCourses[displayCourse] || 0) + numericPercentage;
                });
              } else if (key === "shspqprediction" && data.predictionScores) {
                data.predictionScores.forEach(({ strand, score }) => {
                  const displayStrand = strand.replace(/^(BS|BA)\s+/, "");
                  const numericScore = parseFloat(score) || 0;
                  categoryTotal += numericScore;
                  allCourses[displayStrand] = (allCourses[displayStrand] || 0) + numericScore;
                });
              } else if (key === "certprediction" || key === "prediction_exam_shs") {
                Object.entries(data).forEach(([course, value]) => {
                  const displayCourse = course.replace(/^(BS|BA)\s+/, "");
                  const numericValue = parseFloat(value) || 0;
                  categoryTotal += numericValue;
                  allCourses[displayCourse] = (allCourses[displayCourse] || 0) + numericValue;
                });
              }
            } catch (error) {
              console.error(`Error parsing AsyncStorage data for ${key}:`, error);
            }
          }
          
          assessmentTotals[label] = categoryTotal;
        }
        
        const sortedCourses = Object.entries(allCourses).sort((a, b) => b[1] - a[1]);
        
        if (sortedCourses.length > 0) {
          setTopChoices(sortedCourses);
          
          // Bar chart data - limit to top 5 for mobile view
          const top5Courses = sortedCourses.slice(0, 5);
          setChartData({
            labels: top5Courses.map(([course]) => course.length > 10 ? course.substring(0, 10) + "..." : course),
            datasets: [{
              data: top5Courses.map(([_, score]) => score)
            }]
          });
          
          // Pie chart data for assessment breakdown
          const pieLabels = [];
          const pieValues = [];
          
          Object.entries(assessmentTotals).forEach(([label, total]) => {
            if (total > 0) {
              pieLabels.push(label);
              pieValues.push(total);
            }
          });
          
          setPieData({
            labels: pieLabels,
            data: pieValues,
            colors: colors.slice(0, pieLabels.length)
          });
        }
        
        // Save to database when user and predictions are available
        if (user && user._id && sortedCourses.length > 0) {
          const payload = {
            userId: user._id,
            predictions: JSON.parse(await AsyncStorage.getItem("predictions")) || {},
            certprediction: JSON.parse(await AsyncStorage.getItem("certprediction")) || {},
            shspqprediction: JSON.parse(await AsyncStorage.getItem("shspqprediction")) || {},
            prediction_exam_shs: JSON.parse(await AsyncStorage.getItem("prediction_exam_shs")) || {},
            examScores: JSON.parse(await AsyncStorage.getItem("examScores")) || {}
          };
          
          try {
            const res = await axios.post("https://edu-backend-mvzo.onrender.com/api/prediction_shs/save", payload);
            console.log("Predictions saved successfully:", res.data);
            setSaveStatus("Successfully saved to database.");
          } catch (error) {
            console.error("Failed to save predictions", error);
            setSaveStatus("Failed to save data. Please try again.");
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const downloadPDF = async () => {
    if (!reportRef.current) {
      Alert.alert("Error", "Report not found!");
      return;
    }
    
    try {
      const uri = await reportRef.current.capture();
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>College Course Prediction Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #4a4a4a; text-align: center; }
            .report-date { text-align: right; margin-bottom: 20px; }
            img { width: 100%; max-width: 800px; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <h1>College Course Prediction Report</h1>
          <div class="report-date">Date: ${reportDate}</div>
          <img src="${uri}" alt="Report Image" />
        </body>
        </html>
      `;
      
      const { uri: pdfUri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(pdfUri);
      } else {
        const fileUri = FileSystem.documentDirectory + `College_Course_Prediction_Report_${reportDate.replace(/\//g, "-")}.pdf`;
        await FileSystem.copyAsync({
          from: pdfUri,
          to: fileUri
        });
        
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    }
  };

  const sendEmail = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "User email not found!");
      return;
    }
    
    if (!reportRef.current) {
      Alert.alert("Error", "Report not found!");
      return;
    }
    
    try {
      const uri = await reportRef.current.capture();
      const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      
      await axios.post("https://edu-backend-mvzo.onrender.com/api/auth/send-graph-email", {
        image: `data:image/jpeg;base64,${base64Image}`,
        email: user.email,
      });
      
      Alert.alert("Success", "Your report has been sent to your email successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert("Error", "Failed to send email. Please try again.");
    }
  };

  const shareReport = async () => {
    if (!reportRef.current) {
      Alert.alert("Error", "Report not found!");
      return;
    }
    
    try {
      const uri = await reportRef.current.capture();
      await Share.share({
        title: "College Course Prediction Report",
        url: uri,
        message: "Check out my College Course Prediction Report!"
      });
    } catch (error) {
      console.error("Error sharing report:", error);
      Alert.alert("Error", "Failed to share report. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A11CB" />
        <Text style={styles.loadingText}>Loading your prediction report...</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(106, 17, 203, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  return (
    <View style={styles.container}>
     
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>College Course Prediction Report</Text>
          <View style={styles.userInfo}>
            {user && <Text style={styles.userText}>Student: {user.name || "Student"}</Text>}
            <Text style={styles.dateText}>Date: {reportDate}</Text>
          </View>
        </View>

        <ViewShot ref={reportRef} style={styles.reportContent} options={{ format: "jpg", quality: 0.9 }}>
          {topChoices.length > 0 ? (
            <>
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Your Course Compatibility Summary</Text>
                <View style={styles.topRecommendations}>
                  {topChoices.slice(0, 3).map(([course, score], index) => (
                    <View key={course} style={[styles.recommendation, styles[`recommendation${index + 1}`]]}>
                      <Text style={styles.recommendationTitle}>
                        {index === 0 ? "Primary Recommendation" : index === 1 ? "Secondary Recommendation" : "Tertiary Recommendation"}
                      </Text>
                      <Text style={styles.courseName}>{course}</Text>
                      <Text style={styles.compatibilityScore}>Compatibility: {Math.round(score)}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.chartsSection}>
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Overall Compatibility Scores</Text>
                  {chartData && (
                    <BarChart
                      data={chartData}
                      width={screenWidth - 40}
                      height={220}
                      chartConfig={chartConfig}
                      verticalLabelRotation={30}
                      fromZero
                      showValuesOnTopOfBars
                      style={styles.chart}
                    />
                  )}
                </View>
                
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Assessment Breakdown</Text>
                  {pieData && (
                    <PieChart
                      data={pieData.labels.map((label, index) => ({
                        name: label,
                        population: pieData.data[index],
                        color: pieData.colors[index],
                        legendFontColor: "#7F7F7F",
                        legendFontSize: 12
                      }))}
                      width={screenWidth - 40}
                      height={220}
                      chartConfig={chartConfig}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="10"
                      absolute
                      style={styles.chart}
                    />
                  )}
                </View>
              </View>

              <View style={styles.personalizedAnalysis}>
                <Text style={styles.sectionTitle}>Your Personalized Course Analysis</Text>
                <View style={styles.analysisContent}>
                  <Text style={styles.paragraph}>
                    Based on a comprehensive analysis of your academic performance, aptitude test results, personality assessment, 
                    and achievements, we've identified <Text style={styles.bold}>{topChoices[0][0]}</Text> as your most compatible course. 
                    This recommendation reflects your unique strengths, learning style, and career potential.
                  </Text>
                  
                  <Text style={styles.subSectionTitle}>About {topChoices[0][0]}</Text>
                  <Text style={styles.paragraph}>
                    {courseDescriptions[topChoices[0][0]] || `${topChoices[0][0]} is a field that aligns with your demonstrated strengths and interests. This program would provide you with specialized knowledge and skills for career success.`}
                  </Text>
                  
                  <Text style={styles.subSectionTitle}>Your Key Strengths</Text>
                  <View style={styles.strengthsList}>
                    {(personalityTraits[topChoices[0][0]] || ["Critical thinking", "Problem-solving", "Attention to detail"]).map(trait => (
                      <Text key={trait} style={styles.strengthItem}>• {trait}</Text>
                    ))}
                  </View>
                  
                  <Text style={styles.subSectionTitle}>Why This Matters</Text>
                  <Text style={styles.paragraph}>
                    Choosing a college course that aligns with your natural abilities and interests significantly increases your chances
                    of academic success and career satisfaction. Our prediction model analyzes multiple factors to identify courses where
                    you are most likely to thrive and find fulfillment. While this report provides data-driven guidance, we encourage you
                    to explore each recommendation through further research, campus visits, and conversations with professionals in these fields.
                  </Text>
                  
                  <Text style={styles.subSectionTitle}>Next Steps</Text>
                  <Text style={styles.paragraph}>
                    To make the most of this report, consider the following steps:
                  </Text>
                  <View style={styles.nextStepsList}>
                    <Text style={styles.nextStepItem}>
                      <Text style={styles.bold}>Research Further:</Text> Dive deeper into the recommended courses by exploring university websites, course syllabi, and career prospects.
                    </Text>
                    <Text style={styles.nextStepItem}>
                      <Text style={styles.bold}>Talk to Professionals:</Text> Reach out to professionals working in fields related to your top recommendations. Their insights can provide valuable real-world perspectives.
                    </Text>
                    <Text style={styles.nextStepItem}>
                      <Text style={styles.bold}>Visit Campuses:</Text> If possible, visit colleges or universities offering these courses to get a feel for the environment and facilities.
                    </Text>
                    <Text style={styles.nextStepItem}>
                      <Text style={styles.bold}>Reflect on Your Goals:</Text> Consider how each course aligns with your long-term career aspirations and personal interests.
                    </Text>
                    <Text style={styles.nextStepItem}>
                      <Text style={styles.bold}>Seek Guidance:</Text> Discuss your options with a career counselor, teacher, or mentor who can provide additional advice and support.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.loadingMessage}>
              <Text style={styles.paragraph}>No data available. Please complete the assessments to generate your report.</Text>
            </View>
          )}
        </ViewShot>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button} onPress={downloadPDF}>
            <Text style={styles.buttonText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={sendEmail}>
            <Text style={styles.buttonText}>Email Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={shareReport}>
            <Text style={styles.buttonText}>Share Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>

        {saveStatus && (
          <View style={styles.saveStatusMessage}>
            <Text style={styles.saveStatusText}>{saveStatus}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5"
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#6A11CB"
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginTop: 10 // Space for the navigation header
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 10
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  userText: {
    fontSize: 14,
    color: "#666666"
  },
  dateText: {
    fontSize: 14,
    color: "#666666"
  },
  reportContent: {
    padding: 15
  },
  summarySection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15
  },
  topRecommendations: {
    marginBottom: 10
  },
  recommendation: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10
  },
  recommendation1: {
    borderLeftWidth: 5,
    borderLeftColor: "#6A11CB"
  },
  recommendation2: {
    borderLeftWidth: 5,
    borderLeftColor: "#2575FC"
  },
  recommendation3: {
    borderLeftWidth: 5,
    borderLeftColor: "#FF416C"
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555555",
    marginBottom: 5
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5
  },
  compatibilityScore: {
    fontSize: 14,
    color: "#777777"
  },
  chartsSection: {
    marginBottom: 15
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    alignItems: "center"
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
    alignSelf: "flex-start"
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8
  },
  personalizedAnalysis: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  analysisContent: {
    marginTop: 10
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444444",
    marginBottom: 15
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 10,
    marginBottom: 8
  },
  bold: {
    fontWeight: "bold"
  },
  strengthsList: {
    marginBottom: 15
  },
  strengthItem: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444444",
    paddingLeft: 5,
    marginBottom: 5
  },
  nextStepsList: {
    marginBottom: 15
  },
  nextStepItem: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444444",
    marginBottom: 10
  },
  actionButtons: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    flexDirection: "column"
  },
  button: {
    backgroundColor: "#6A11CB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  saveStatusMessage: {
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#E8F5E9",
    borderRadius: 8
  },
  saveStatusText: {
    fontSize: 14,
    color: "#388E3C",
    textAlign: "center"
  },
  loadingMessage: {
    padding: 20,
    alignItems: "center"
  }
});

export default CollegePredictionReport;