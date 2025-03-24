import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Share,
  Platform
} from "react-native";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from "victory-native";
import { Printer, Send, Download, List } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

const CareerPredictionDashboard = ({ navigation }) => {
  const [sourceData, setSourceData] = useState({});
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [reportDate] = useState(new Date().toLocaleDateString());
  const reportRef = useRef(null);
  const [showCareerList, setShowCareerList] = useState(false);
  const careerListRef = useRef(null);
  const [statusVisible, setStatusVisible] = useState(false);

  const sources = [
    { key: "college_course_predict", label: "College Course Assessment", color: "#4F46E5" },
    { key: "college_pq_predict", label: "Personality Assessment", color: "#10B981" },
    { key: "college_cert_predict", label: "Skills & Certifications", color: "#F59E0B" },
    { key: "prediction_exam_college", label: "Career Aptitude Test", color: "#EF4444" }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
      const dataBySource = {};
      let combined = {};
      let name = await AsyncStorage.getItem("userName") || "there";
      
      setUserName(name);

      for (const { key, label, color } of sources) {
        const storedData = await AsyncStorage.getItem(key);
        if (storedData) {
          const parsedData = safeParseJSON(storedData);
          const careers = extractCareers(parsedData);
          dataBySource[key] = {
            label,
            color,
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

      setSourceData(dataBySource);
      setCombinedData(sortedCombined);
      setLoading(false);
    };
    loadData();
  }, []);

  // Optional: Save predictions to database when user and predictions are available
  useEffect(() => {
    const savePredictions = async () => {
      if (user && user._id && combinedData.length > 0) {
        try {
          const payload = {
            userId: user._id,
            college_course_predict: safeParseJSON(await AsyncStorage.getItem("college_course_predict")) || {},
            college_pq_predict: safeParseJSON(await AsyncStorage.getItem("college_pq_predict")) || {},
            college_cert_predict: safeParseJSON(await AsyncStorage.getItem("college_cert_predict")) || {},
            prediction_exam_college: safeParseJSON(await AsyncStorage.getItem("prediction_exam_college")) || {}
          };

          const res = await axios.post("https://edu-backend-mvzo.onrender.com/api/prediction_college/save", payload);
          console.log("Career predictions saved successfully:", res.data);
          showStatus("Successfully saved to database.");
        } catch (error) {
          console.error("Failed to save career predictions", error);
          showStatus("Failed to save data. Please try again.");
        }
      }
    };
    savePredictions();
  }, [user, combinedData]);

  const showStatus = (message) => {
    setSaveStatus(message);
    setStatusVisible(true);
    setTimeout(() => {
      setStatusVisible(false);
      setSaveStatus("");
    }, 3000);
  };

  const getCareerPathData = () => {
    if (combinedData.length === 0) return [];
    
    return [
      { name: "Entry Level", salary: 60000 },
      { name: "Junior", salary: 75000 },
      { name: "Mid-Level", salary: 95000 },
      { name: "Senior", salary: 120000 },
      { name: "Lead/Manager", salary: 150000 }
    ];
  };

  const getEducationRequirements = () => {
    return [
      { name: "High School", value: 10 },
      { name: "Associate's", value: 20 },
      { name: "Bachelor's", value: 40 },
      { name: "Master's", value: 20 },
      { name: "Doctorate", value: 10 }
    ];
  };

  const captureAndSharePDF = async (elementRef, contentType = "report") => {
    if (!elementRef.current) {
      Alert.alert("Error", "Content not found!");
      return;
    }
    
    showStatus("Generating PDF...");
    
    try {
      const uri = await captureRef(elementRef, {
        format: "png",
        quality: 0.8,
      });
      
      const pdfUri = `${FileSystem.documentDirectory}${contentType === "list" ? "career_list.pdf" : "career_report.pdf"}`;
      
      // Generate HTML that includes the image
      const htmlContent = `
        <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              h1 { text-align: center; color: #4F46E5; }
              img { width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <h1>${contentType === "list" ? "Career List Report" : "Career Prediction Report"}</h1>
            <img src="${uri}" alt="Report" />
          </body>
        </html>
      `;
      
      await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        filePath: pdfUri
      }).then(async (res) => {
        if (Platform.OS === "ios") {
          await Sharing.shareAsync(res.uri);
        } else {
          const pdfName = contentType === "list" 
            ? `Career_List_Report_${reportDate.replace(/\//g, "-")}.pdf` 
            : `Career_Prediction_Report_${reportDate.replace(/\//g, "-")}.pdf`;
          
          await FileSystem.getContentUriAsync(res.uri).then((contentUri) => {
            Sharing.shareAsync(contentUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ${pdfName}`,
              UTI: 'com.adobe.pdf'
            });
          });
        }
        showStatus("PDF shared successfully!");
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      showStatus("Failed to generate PDF. Please try again.");
    }
  };

  const sendEmail = async (elementRef, contentType = "report") => {
    if (!user || !user.email) {
      Alert.alert("Error", "User email not found! Please make sure you are logged in.");
      return;
    }
    
    if (!elementRef.current) {
      Alert.alert("Error", "Content not found!");
      return;
    }
    
    showStatus("Sending email...");
    
    try {
      const uri = await captureRef(elementRef, {
        format: "jpg",
        quality: 0.7,
      });
      
      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const subject = contentType === "list" 
        ? "Your Career List Report" 
        : "Your Career Prediction Analysis Report";
      
      const messageText = contentType === "list"
        ? "career list"
        : "career prediction analysis";
        
      await axios.post("https://edu-backend-mvzo.onrender.com/api/auth/send-graph-email", {
        image: `data:image/jpeg;base64,${base64Image}`,
        email: user.email,
        subject: subject,
        message: `Dear ${user.name || "User"},\n\nAttached is your ${messageText} report generated on ${reportDate}.\n\nBest regards,\nCareer Guidance Team`
      });
      
      showStatus(`${contentType === "list" ? "Career list" : "Report"} sent to your email successfully!`);
    } catch (error) {
      console.error("Email sending failed:", error);
      showStatus("Failed to send email. Please try again.");
    }
  };

  const printReport = async (elementRef, contentType = "report") => {
    if (!elementRef.current) {
      Alert.alert("Error", "Content not found!");
      return;
    }
    
    showStatus("Preparing to print...");
    
    try {
      const uri = await captureRef(elementRef, {
        format: "jpg",
        quality: 0.8,
      });
      
      const html = `
        <html>
          <head>
            <title>${contentType === "list" ? "Career List Report" : "Career Prediction Report"}</title>
            <style>
              body { margin: 0; padding: 0; }
              img { width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${uri}" alt="Report" />
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html: html,
      });
      
      showStatus("Print job completed!");
    } catch (error) {
      console.error("Print preparation failed:", error);
      showStatus("Failed to prepare print. Please try again.");
    }
  };

  const shareReport = async (elementRef, contentType = "report") => {
    if (!elementRef.current) {
      Alert.alert("Error", "Content not found!");
      return;
    }
    
    showStatus("Preparing to share...");
    
    try {
      const uri = await captureRef(elementRef, {
        format: "jpg",
        quality: 0.8,
      });
      
      await Share.share({
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
        title: contentType === "list" ? "Career List Report" : "Career Prediction Analysis Report",
        message: `Here's my ${contentType === "list" ? "career list" : "career prediction analysis"} report generated on ${reportDate}.`,
      });
      
      showStatus("Share completed!");
    } catch (error) {
      console.error("Share preparation failed:", error);
      showStatus("Failed to share. Please try again.");
    }
  };

  const toggleCareerList = () => {
    setShowCareerList(!showCareerList);
  };

  const careerPathData = getCareerPathData();
  const educationData = getEducationRequirements();

  return (
    <SafeAreaView style={styles.container}>
      {/* Status message */}
      {statusVisible && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{saveStatus}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollContainer}>
        {/* Main Report Section */}
        <View style={styles.reportContainer} ref={reportRef}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Career Prediction Analysis Report</Text>
            <Text style={styles.subtitle}>Personalized career insights based on your assessments</Text>
            <View style={styles.divider} />
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>Student: {user?.name || userName}</Text>
              <Text style={styles.userInfoText}>Date: {reportDate}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading your career analysis...</Text>
            </View>
          ) : (
            <>
              {/* Executive Summary */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Executive Summary</Text>
                <Text style={styles.paragraph}>
                  Hello {userName}, welcome to your comprehensive career prediction analysis report. Based on multiple assessments including your college course performance, personality traits, skills assessment, and career aptitude test, we've analyzed your strengths and preferences to identify optimal career paths for you.
                </Text>
                <View style={styles.summaryCards}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Your Top Career Match</Text>
                    <Text style={styles.topCareerText}>{combinedData[0]?.career || "Not Available"}</Text>
                    <Text style={styles.scoreText}>Overall Match Score: {combinedData[0]?.score.toFixed(1) || "N/A"}/100</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Your Key Strengths</Text>
                    {Object.values(sourceData).map((source, index) => (
                      source.data && source.data.length > 0 && (
                        <View key={index} style={styles.strengthItem}>
                          <Text style={styles.strengthLabel}>{source.label}:</Text>
                          <Text style={[styles.strengthScore, { color: source.color }]}>
                            {source.data[0].score.toFixed(1)}/25
                          </Text>
                        </View>
                      )
                    ))}
                  </View>
                </View>
              </View>

              {/* Top Career Recommendations */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Top Career Recommendations</Text>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Overall Career Match Scores</Text>
                  {combinedData.slice(0, 5).map((career, index) => (
                    <View key={career.career} style={styles.careerItem}>
                      <Text style={styles.careerName}>{index + 1}. {career.career}</Text>
                      <Text style={styles.careerScore}>{career.score.toFixed(1)}</Text>
                    </View>
                  ))}
                  
                  <Text style={[styles.cardTitle, { marginTop: 20 }]}>Career Match Visualization</Text>
                  <View style={styles.chartContainer}>
                    <VictoryChart
                      theme={VictoryTheme.material}
                      domainPadding={{ x: 20 }}
                      height={300}
                    >
                      <VictoryAxis
                        tickFormat={(t) => t.toFixed(1)}
                      />
                      <VictoryAxis
                        dependentAxis
                        tickFormat={(t) => t.substring(0, 15)}
                        style={{
                          tickLabels: { fontSize: 8, padding: 5 }
                        }}
                      />
                      <VictoryBar
                        horizontal
                        data={combinedData.slice(0, 5).map(d => ({ x: d.career, y: d.score }))}
                        style={{ data: { fill: "#4F46E5" } }}
                        labelComponent={<VictoryTooltip />}
                      />
                    </VictoryChart>
                  </View>
                </View>
              </View>

              {/* Career Path Projection */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Career Path Projection</Text>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Salary Growth Over Time</Text>
                  <View style={styles.chartContainer}>
                    <VictoryChart
                      theme={VictoryTheme.material}
                      domainPadding={{ x: 20 }}
                      height={300}
                    >
                      <VictoryAxis />
                      <VictoryAxis
                        dependentAxis
                        tickFormat={(t) => `$${(t/1000)}k`}
                      />
                      <VictoryLine
                        data={careerPathData.map(d => ({ x: d.name, y: d.salary }))}
                        style={{ data: { stroke: "#10B981", strokeWidth: 3 } }}
                      />
                    </VictoryChart>
                  </View>
                </View>
              </View>

              {/* Education Requirements */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Education Requirements</Text>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Typical Education Levels</Text>
                  <View style={styles.chartContainer}>
                    <VictoryPie
                      data={educationData}
                      colorScale={COLORS}
                      labelRadius={({ innerRadius }) => innerRadius + 30}
                      radius={100}
                      style={{ labels: { fill: "white", fontSize: 10, fontWeight: "bold" } }}
                      height={300}
                    />
                  </View>
                </View>
              </View>

              {/* Assessment Breakdown */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Assessment Breakdown</Text>
                {sources.map((source) => (
                  <View key={source.key} style={styles.card}>
                    <Text style={[styles.cardTitle, { color: source.color }]}>{source.label}</Text>
                    <View style={styles.chartContainer}>
                      {sourceData[source.key]?.data && sourceData[source.key].data.length > 0 ? (
                        <VictoryChart
                          theme={VictoryTheme.material}
                          domainPadding={{ x: 20 }}
                          height={200}
                        >
                          <VictoryAxis />
                          <VictoryAxis dependentAxis />
                          <VictoryBar
                            data={sourceData[source.key].data.slice(0, 3).map(d => ({ x: d.career.substring(0, 10), y: d.score }))}
                            style={{ data: { fill: source.color } }}
                          />
                        </VictoryChart>
                      ) : (
                        <Text style={styles.noDataText}>No data available</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => printReport(reportRef)}
                >
                  <Printer size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Print Report</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: "#10B981" }]} 
                  onPress={() => sendEmail(reportRef)}
                >
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Email Report</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: "#3B82F6" }]} 
                  onPress={() => captureAndSharePDF(reportRef)}
                >
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Save PDF</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Career List Modal */}
      <Modal
        visible={showCareerList}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleCareerList}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} ref={careerListRef}>
            <Text style={styles.modalTitle}>Career List</Text>
            <ScrollView style={styles.modalScrollView}>
              {combinedData.map((career, index) => (
                <View key={career.career} style={styles.careerItem}>
                  <Text style={styles.careerName}>{index + 1}. {career.career}</Text>
                  <Text style={styles.careerScore}>{career.score.toFixed(1)}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#3B82F6" }]}
                onPress={() => captureAndSharePDF(careerListRef, "list")}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Save PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#10B981" }]}
                onPress={() => sendEmail(careerListRef, "list")}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#4F46E5" }]}
                onPress={() => printReport(careerListRef, "list")}
              >
                <Printer size={16} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Print</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#6B7280" }]}
                onPress={toggleCareerList}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fixed Action Button for Career List */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={toggleCareerList}
      >
        <List size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContainer: {
    flex: 1,
  },
  reportContainer: {
    padding: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 5,
  },
  divider: {
    width: 50,
    height: 4,
    backgroundColor: "#4F46E5",
    marginTop: 15,
    marginBottom: 15,
  },
  userInfo: {
    marginTop: 10,
  },
  userInfoText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    marginBottom: 15,
  },
  summaryCards: {
    marginTop: 15,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 10,
  },
  topCareerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  scoreText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },
  strengthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  strengthLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  strengthScore: {
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  careerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  careerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    flex: 3,
  },
  careerScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  chartContainer: {
    marginTop: 5,
    alignItems: "center",
  },
  noDataText: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 30,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    marginTop: 20,
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4F46E5",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    color: "#1F2937",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 15,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",                                                       
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    flex: 1,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});
export default CareerPredictionDashboard;