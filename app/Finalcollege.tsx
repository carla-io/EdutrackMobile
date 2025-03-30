import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  Platform
} from "react-native";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLine, VictoryPie } from "victory-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import ViewShot from "react-native-view-shot";
import * as MailComposer from "expo-mail-composer";

// Mock components - create these in separate files
const Navbar = () => (
  <View style={styles.navbar}>
    <Text style={styles.navbarTitle}>Career Guidance</Text>
  </View>
);

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>Career Guidance App © 2025</Text>
  </View>
);

const CareerPrediction = () => {
  const [sourceData, setSourceData] = useState({});
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [reportDate] = useState(new Date().toLocaleDateString());
  const [showCareerList, setShowCareerList] = useState(false);
  
  const reportRef = useRef(null);
  const careerListRef = useRef(null);

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
        const res = await axios.post("http://localhost:4000/api/auth/user", { token });
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
        const payload = {
          userId: user._id,
          college_course_predict: safeParseJSON(await AsyncStorage.getItem("college_course_predict")) || {},
          college_pq_predict: safeParseJSON(await AsyncStorage.getItem("college_pq_predict")) || {},
          college_cert_predict: safeParseJSON(await AsyncStorage.getItem("college_cert_predict")) || {},
          prediction_exam_college: safeParseJSON(await AsyncStorage.getItem("prediction_exam_college")) || {}
        };

        try {
          const res = await axios.post("http://localhost:4000/api/prediction_college/save", payload);
          console.log("Career predictions saved successfully:", res.data);
          showStatusMessage("Successfully saved to database.");
        } catch (error) {
          console.error("Failed to save career predictions", error);
          showStatusMessage("Failed to save data. Please try again.");
        }
      }
    };
    savePredictions();
  }, [user, combinedData]);

  const showStatusMessage = (message) => {
    setSaveStatus(message);
    setTimeout(() => {
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

  const captureAndShare = async (ref, type = "report") => {
    try {
      if (!ref.current) {
        Alert.alert("Error", "Content not found!");
        return;
      }

      showStatusMessage("Generating image...");
      
      const uri = await ref.current.capture();
      return uri;
    } catch (error) {
      console.error("Capture failed:", error);
      showStatusMessage("Failed to generate image.");
      return null;
    }
  };

  const downloadPDF = async (ref, contentType = "report") => {
    try {
      const uri = await captureAndShare(ref);
      if (!uri) return;
      
      showStatusMessage("Creating PDF...");
      
      const fileName = contentType === "list" 
        ? `Career_List_Report_${reportDate.replace(/\//g, "-")}.pdf` 
        : `Career_Prediction_Report_${reportDate.replace(/\//g, "-")}.pdf`;
      
      // Generate PDF from image
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          </head>
          <body style="text-align: center;">
            <img src="${uri}" style="width: 100%;" />
          </body>
        </html>
      `;
      
      const pdfUri = await Print.printToFileAsync({ html });
      
      // Share the generated PDF
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(pdfUri.uri);
      } else {
        const pdfFilePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: pdfUri.uri,
          to: pdfFilePath
        });
        await Sharing.shareAsync(pdfFilePath);
      }
      
      showStatusMessage("PDF shared successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      showStatusMessage("Failed to generate PDF.");
    }
  };

  const sendEmail = async (ref, contentType = "report") => {
    if (!user || !user.email) {
      Alert.alert("Error", "User email not found! Please make sure you are logged in.");
      return;
    }
    
    try {
      const uri = await captureAndShare(ref);
      if (!uri) return;
      
      showStatusMessage("Preparing email...");
      
      const subject = contentType === "list" 
        ? "Your Career List Report" 
        : "Your Career Prediction Analysis Report";
      
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Email is not available on this device.");
        return;
      }
      
      await MailComposer.composeAsync({
        recipients: [user.email],
        subject,
        body: `Dear ${user.name || "User"},\n\nAttached is your ${contentType === "list" ? "career list" : "career prediction analysis"} report generated on ${reportDate}.\n\nBest regards,\nCareer Guidance Team`,
        attachments: [uri]
      });
      
      showStatusMessage("Email prepared!");
    } catch (error) {
      console.error("Email preparation failed:", error);
      showStatusMessage("Failed to prepare email.");
    }
  };

  const printReport = async (ref, contentType = "report") => {
    try {
      const uri = await captureAndShare(ref);
      if (!uri) return;
      
      showStatusMessage("Preparing to print...");
      
      // Generate HTML for printing
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          </head>
          <body style="text-align: center;">
            <img src="${uri}" style="width: 100%;" />
          </body>
        </html>
      `;
      
      await Print.printAsync({ html });
      showStatusMessage("Print job sent!");
    } catch (error) {
      console.error("Print failed:", error);
      showStatusMessage("Failed to print.");
    }
  };

  const toggleCareerList = () => {
    setShowCareerList(!showCareerList);
  };

  const careerPathData = getCareerPathData();
  const educationData = getEducationRequirements();

  const renderCareerItem = ({ item, index }) => (
    <View style={styles.careerItem}>
      <Text style={styles.careerName}>{index + 1}. {item.career}</Text>
      <Text style={styles.careerScore}>{item.score.toFixed(1)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Navbar />
      
      {/* Status message */}
      {saveStatus ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{saveStatus}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.scrollContainer}>
        <ViewShot ref={reportRef} options={{ format: "jpg", quality: 0.9 }}>
          <View style={styles.reportContainer}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Career Prediction Analysis Report</Text>
              <Text style={styles.reportSubtitle}>Personalized career insights based on your assessments</Text>
              <View style={styles.divider} />
              <Text style={styles.reportInfo}>Student: {user?.name || userName}</Text>
              <Text style={styles.reportInfo}>Date: {reportDate}</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading your career analysis...</Text>
              </View>
            ) : (
              <View>
                {/* Executive Summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Executive Summary</Text>
                  <Text style={styles.paragraphText}>
                    Hello {userName}, welcome to your comprehensive career prediction analysis report. Based on multiple assessments including your college course performance, personality traits, skills assessment, and career aptitude test, we've analyzed your strengths and preferences to identify optimal career paths for you.
                  </Text>
                  <View style={styles.summaryCardsContainer}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardTitle}>Your Top Career Match</Text>
                      <Text style={styles.summaryCardValue}>{combinedData[0]?.career || "Not Available"}</Text>
                      <Text style={styles.summaryCardSubtext}>Overall Match Score: {combinedData[0]?.score.toFixed(1) || "N/A"}/100</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardTitle}>Your Key Strengths</Text>
                      {Object.values(sourceData).map((source, index) => (
                        source.data && source.data.length > 0 && (
                          <View key={index} style={styles.strengthItem}>
                            <Text style={styles.strengthLabel}>{source.label}:</Text>
                            <Text style={[styles.strengthScore, { color: source.color }]}>{source.data[0].score.toFixed(1)}/25</Text>
                          </View>
                        )
                      ))}
                    </View>
                  </View>
                </View>

                {/* Top Career Recommendations */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top Career Recommendations</Text>
                  <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Overall Career Match Scores</Text>
                    <FlatList
                      data={combinedData.slice(0, 5)}
                      renderItem={renderCareerItem}
                      keyExtractor={(item) => item.career}
                      scrollEnabled={false}
                    />
                    <Text style={styles.cardTitle}>Career Match Visualization</Text>
                    <View style={styles.chartContainer}>
                      <VictoryChart
                        theme={VictoryTheme.material}
                        domainPadding={{ x: 20 }}
                        height={300}
                        width={350}
                      >
                        <VictoryAxis
                          tickFormat={(t) => t.toFixed(1)}
                          style={{
                            axis: { stroke: "#ccc" },
                            ticks: { stroke: "#ccc", size: 5 },
                          }}
                        />
                        <VictoryAxis
                          dependentAxis
                          tickFormat={(t) => t.substring(0, 10)}
                          style={{
                            axis: { stroke: "#ccc" },
                            ticks: { stroke: "#ccc", size: 5 },
                            tickLabels: { fontSize: 10 }
                          }}
                        />
                        <VictoryBar
                          horizontal
                          data={combinedData.slice(0, 5).map(item => ({ 
                            x: item.score, 
                            y: item.career, 
                            label: item.career 
                          }))}
                          style={{ data: { fill: "#4F46E5" } }}
                        />
                      </VictoryChart>
                    </View>
                  </View>
                </View>

                {/* Career Path Projection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Career Path Projection</Text>
                  <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Salary Growth Over Time</Text>
                    <View style={styles.chartContainer}>
                      <VictoryChart
                        theme={VictoryTheme.material}
                        domainPadding={{ x: 10 }}
                        height={300}
                        width={350}
                      >
                        <VictoryAxis
                          tickFormat={(t) => t}
                          style={{
                            axis: { stroke: "#ccc" },
                            ticks: { stroke: "#ccc", size: 5 },
                          }}
                        />
                        <VictoryAxis
                          dependentAxis
                          tickFormat={(t) => `$${(t/1000)}k`}
                          style={{
                            axis: { stroke: "#ccc" },
                            ticks: { stroke: "#ccc", size: 5 },
                          }}
                        />
                        <VictoryLine
                          data={careerPathData.map(item => ({ 
                            x: item.name, 
                            y: item.salary 
                          }))}
                          style={{ data: { stroke: "#10B981", strokeWidth: 3 } }}
                        />
                      </VictoryChart>
                    </View>
                  </View>
                </View>

                {/* Education Requirements */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Education Requirements</Text>
                  <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Typical Education Levels</Text>
                    <View style={styles.chartContainer}>
                      <VictoryPie
                        data={educationData}
                        x="name"
                        y="value"
                        colorScale={COLORS}
                        width={350}
                        height={300}
                        labels={({ datum }) => `${datum.name}: ${datum.value}%`}
                        labelRadius={({ innerRadius }) => innerRadius + 35}
                        style={{ labels: { fontSize: 10, fill: "white" } }}
                      />
                    </View>
                  </View>
                </View>

                {/* Assessment Breakdown */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Assessment Breakdown</Text>
                  {sources.map((source) => (
                    <View key={source.key} style={styles.cardContainer}>
                      <Text style={[styles.cardTitle, { color: source.color }]}>{source.label}</Text>
                      <View style={styles.chartContainer}>
                        {sourceData[source.key]?.data && sourceData[source.key].data.length > 0 ? (
                          <VictoryChart
                            theme={VictoryTheme.material}
                            domainPadding={{ x: 20 }}
                            height={200}
                            width={350}
                          >
                            <VictoryAxis
                              style={{
                                axis: { stroke: "#ccc" },
                                tickLabels: { fontSize: 0 }
                              }}
                            />
                            <VictoryAxis
                              dependentAxis
                              style={{
                                axis: { stroke: "#ccc" },
                                ticks: { stroke: "#ccc", size: 5 },
                              }}
                            />
                            <VictoryBar
                              data={sourceData[source.key].data.slice(0, 5).map(item => ({ 
                                x: item.career.substring(0, 10), 
                                y: item.score 
                              }))}
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
                    onPress={() => printReport(reportRef)}
                    style={[styles.actionButton, { backgroundColor: "#4F46E5" }]}
                  >
                    <Ionicons name="print-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Print Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => sendEmail(reportRef)}
                    style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                  >
                    <Ionicons name="mail-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Email Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => downloadPDF(reportRef)}
                    style={[styles.actionButton, { backgroundColor: "#2563EB" }]}
                  >
                    <Ionicons name="download-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Share PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ViewShot>
      </ScrollView>

      {/* Career List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCareerList}
        onRequestClose={() => setShowCareerList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ViewShot ref={careerListRef} options={{ format: "jpg", quality: 0.9 }}>
              <View style={styles.careerListContainer}>
                <Text style={styles.modalTitle}>Career List</Text>
                <FlatList
                  data={combinedData}
                  renderItem={renderCareerItem}
                  keyExtractor={(item) => item.career}
                  style={styles.careerList}
                />
              </View>
            </ViewShot>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => downloadPDF(careerListRef, "list")}
                style={[styles.modalButton, { backgroundColor: "#2563EB" }]}
              >
                <Ionicons name="download-outline" size={16} color="white" />
                <Text style={styles.modalButtonText}>Share PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendEmail(careerListRef, "list")}
                style={[styles.modalButton, { backgroundColor: "#10B981" }]}
              >
                <Ionicons name="mail-outline" size={16} color="white" />
                <Text style={styles.modalButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => printReport(careerListRef, "list")}
                style={[styles.modalButton, { backgroundColor: "#4F46E5" }]}
              >
                <Ionicons name="print-outline" size={16} color="white" />
                <Text style={styles.modalButtonText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleCareerList}
                style={[styles.modalButton, { backgroundColor: "#6B7280" }]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={toggleCareerList}>
        <Ionicons name="list" size={24} color="white" />
      </TouchableOpacity>

      <Footer />
    </SafeAreaView>
  );
};

export default CareerPrediction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContainer: {
    flex: 1,
  },
  navbar: {
    height: 60,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  navbarTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    height: 50,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "white",
    fontSize: 12,
  },
  statusContainer: {
    position: "absolute",
    top: 70,
    right: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    color: "#1F2937",
  },
  reportContainer: {
    padding: 16,
    backgroundColor: "white",
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  reportSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
    textAlign: "center",
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: "#4F46E5",
    marginVertical: 10,
  },
  reportInfo: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  paragraphText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 15,
  },
  summaryCardsContainer: {
    flexDirection: "column",
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  summaryCardSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },
  strengthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  strengthLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  strengthScore: {
    fontSize: 14,
    fontWeight: "bold",
  },
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 12,
  },
  careerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  careerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
  },
  careerScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
    height: 300,
  },
  noDataText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    bottom: 60,
    right: 20,
    backgroundColor: "#4F46E5",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  careerListContainer: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  careerList: {
    maxHeight: 400,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 6,
    minWidth: 70,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  }
});

