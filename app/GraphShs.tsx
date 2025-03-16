import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const screenWidth = Dimensions.get("window").width;

const OverallResultChart = () => {
    const [chartData, setChartData] = useState(null);
    const [individualCharts, setIndividualCharts] = useState([]);
    const [topChoices, setTopChoices] = useState([]);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const overallChartRef = useRef(null);
    const individualRefs = useRef({});
    const chartRef = useRef(null);
    const [saveStatus, setSaveStatus] = useState(null);
  
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

  useEffect(() => {
    const sources = {
      "Overall Prediction": ["predictions", "certprediction", "shspqprediction", "prediction_exam_shs"],
      "From Grades": ["predictions"],
      "From Certificate": ["certprediction"],
      "From Personal Questionnaire": ["shspqprediction"],
      "From Exam Results": ["prediction_exam_shs"],
    };

    const allStrands = {};
    const individualData = [];

    const processPredictionData = async () => {
      for (const [label, keys] of Object.entries(sources)) {
        const strandScores = {};

        for (const key of keys) {
          const storedData = await AsyncStorage.getItem(key);
          if (!storedData) continue;

          let data;
          try {
            data = JSON.parse(storedData);
          } catch (error) {
            console.error(`Error parsing AsyncStorage data for ${key}:`, error);
            continue;
          }

          if (key === "predictions") {
            Object.entries(data).forEach(([strand, values]) => {
              if (values.percentage !== undefined) {
                const numericPercentage = parseFloat(values.percentage) || 0;
                strandScores[strand] = (strandScores[strand] || 0) + numericPercentage;
                allStrands[strand] = (allStrands[strand] || 0) + numericPercentage;
              }
            });
          } else if (key === "shspqprediction" && data.predictionScores) {
            data.predictionScores.forEach(({ course, score }) => {
              const numericScore = parseFloat(score) || 0;
              strandScores[course] = (strandScores[course] || 0) + numericScore;
              allStrands[course] = (allStrands[course] || 0) + numericScore;
            });
          } else if (key === "certprediction" || key === "prediction_exam_shs") {
            Object.entries(data).forEach(([strand, value]) => {
              const numericValue = parseFloat(value) || 0;
              strandScores[strand] = (strandScores[strand] || 0) + numericValue;
              allStrands[strand] = (allStrands[strand] || 0) + numericValue;
            });
          }
        }

        if (label !== "Overall Prediction" && Object.keys(strandScores).length > 0) {
          individualData.push({
            label,
            chart: {
              labels: Object.keys(strandScores),
              datasets: [
                {
                  label: "Percentage",
                  data: Object.values(strandScores),
                  backgroundColor: ["#6a11cb", "#2575fc", "#ff416c", "#ff4b2b", "#33FF57"],
                  borderColor: "#000",
                  borderWidth: 1
                }
              ]
            }
          });
        }
      }

      const sortedStrands = Object.entries(allStrands).sort((a, b) => b[1] - a[1]);

      if (sortedStrands.length > 0) {
        setTopChoices(sortedStrands);
        setChartData({
          labels: sortedStrands.map(([strand]) => strand),
          datasets: [
            {
              label: "Strand Percentage",
              data: sortedStrands.map(([_, percentage]) => percentage),
              backgroundColor: ["#6a11cb", "#2575fc", "#ff416c", "#ff4b2b", "#33FF57"],
              borderColor: "#000",
              borderWidth: 1
            }
          ]
        });
      }

      setIndividualCharts(individualData);
    };

    processPredictionData();
  }, []);

  useEffect(() => {
    const savePredictions = async () => {
      if (!user || !user._id || topChoices.length === 0) return;
  
      try {
        const predictions = JSON.parse(await AsyncStorage.getItem("predictions")) || {};
        const certprediction = JSON.parse(await AsyncStorage.getItem("certprediction")) || {};
        const pqprediction_shs = JSON.parse(await AsyncStorage.getItem("shspqprediction")) || {}; // Updated for SHS
        const prediction_exam_shs = JSON.parse(await AsyncStorage.getItem("prediction_exam_shs")) || {}; // Updated for SHS
        const examScores = JSON.parse(await AsyncStorage.getItem("examScores")) || {};
  
        const payload = {
          userId: user._id,
          predictions,
          certprediction,
          pqprediction_shs, // Updated
          prediction_exam_shs, // Updated
          examScores,
        };
  
        const res = await axios.post("http://192.168.100.171:4000/api/prediction_shs/save", payload);
        console.log("Predictions saved successfully:", res.data);
        setSaveStatus("Successfully saved to database.");
      } catch (error) {
        console.error("Failed to save predictions", error);
        setSaveStatus("Failed to save data. Please try again.");
      }
    };
    savePredictions();
  }, [user, topChoices]);

  const downloadPDF = async () => {
    try {
      const uri = await chartRef.current.capture();
  
      const htmlContent = `
        <html>
          <body style="text-align: center;">
            <h1>Overall SHS Strand Predictions</h1>
            <img src="${uri}" width="100%" />
          </body>
        </html>
      `;
  
      const { uri: pdfUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
  
      Alert.alert("Success", `PDF saved at: ${pdfUri}`);
    } catch (error) {
      console.error("Download PDF error:", error);
      Alert.alert("Error", "Failed to download PDF");
    }
};

  
const printChart = async () => {
    try {
      const uri = await chartRef.current.capture();
  
      const htmlContent = `
        <html>
          <body style="text-align: center;">
            <h1>Overall SHS Strand Predictions</h1>
            <img src="${uri}" width="100%" />
          </body>
        </html>
      `;
  
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert("Error", "Failed to print");
    }
  };
  

  const sendEmail = async () => {
    if (!user?.email) {
      Alert.alert("Error", "User email not found!");
      return;
    }
    try {
      const uri = await chartRef.current.capture();
  
      // Reduce image size
      const resizedUri = await manipulateAsync(
        uri,
        [{ resize: { width: 500 } }], // Resize width to 500px (adjustable)
        { compress: 0.5, format: SaveFormat.JPEG } // Compress to 50% quality
      );
  
      const base64Image = await FileSystem.readAsStringAsync(resizedUri.uri, { encoding: FileSystem.EncodingType.Base64 });
  
      await axios.post("http://192.168.100.171:4000/api/auth/send-graph-email", {
        image: `data:image/jpeg;base64,${base64Image}`,
        email: user.email,
      });
  
      Alert.alert("Success", "Email sent successfully!");
    } catch (error) {
      console.error("Failed to send email:", error);
      Alert.alert("Error", "Failed to send email. Please try again.");
    }
  };
  
  
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Overall SHS Strand Predictions</Text>

      <ViewShot ref={chartRef} options={{ format: "jpg", quality: 0.9 }}>
        <View style={styles.chartContainer}>
          {chartData && (
            <View style={styles.largeChart}>
              <Text style={styles.subtitle}>Overall Prediction</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 40}
                height={300}
                chartConfig={chartConfig}
                verticalLabelRotation={30}
              />
            </View>
          )}

          {individualCharts.map(({ label, chart }) => (
            <View key={label} style={styles.chartWrapper}>
              <Text style={styles.subtitle}>{label}</Text>
              <BarChart
                data={chart}
                width={screenWidth - 40}
                height={300}
                chartConfig={chartConfig}
                verticalLabelRotation={30}
              />
            </View>
          ))}
        </View>
      </ViewShot>

      <View style={styles.topChoices}>
        {topChoices.slice(0, 3).map(([strand], index) => (
          <Text key={strand} style={styles.choiceText}>
            <Text style={styles.choiceLabel}>
              {index === 0 ? "Your First Choice" : index === 1 ? "Your Second Choice" : "Your Third Choice"}:
            </Text>{" "}
          </Text>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={downloadPDF} style={styles.button}><Text style={styles.buttonText}>Download PDF</Text></TouchableOpacity>
        <TouchableOpacity onPress={sendEmail} style={styles.button}><Text style={styles.buttonText}>Send via Email</Text></TouchableOpacity>
        <TouchableOpacity onPress={printChart} style={styles.button}><Text style={styles.buttonText}>Print</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.push("Portal")}> 
        <Text style={styles.backButtonText}>⬅ Back to Personal Questionnaire</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: "center",
    width: "100%",
  },
  largeChart: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 20,
  },
  chartWrapper: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  topChoices: {
    marginBottom: 20,
  },
  choiceText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  choiceLabel: {
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#a00",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#ff4b2b",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default OverallResultChart;
