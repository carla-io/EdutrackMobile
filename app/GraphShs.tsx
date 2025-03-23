import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform 
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import Toast from "react-native-toast-message";
import {useRouter } from "expo-router";

const OverallResult = () => {
  const [chartData, setChartData] = useState(null);
  const [individualCharts, setIndividualCharts] = useState([]);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const navigation = useNavigation();
  const chartRef = useRef(null);
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

  useEffect(() => {
    const sources = {
      "Overall Prediction": ["predictions", "certprediction", "shspqprediction", "prediction_exam_shs"],
      "From Grades": ["predictions"],
      "From Certificate": ["certprediction"],
      "From Personal Questionnaire": ["shspqprediction"],
      "From Exam Results": ["prediction_exam_shs"]
    };
  
    const allStrands = {};
    const individualData = [];
  
    const loadData = async () => {
      try {
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
              data.predictionScores.forEach(({ strand, score }) => {
                const numericScore = parseFloat(score) || 0;
                strandScores[strand] = (strandScores[strand] || 0) + numericScore;
                allStrands[strand] = (allStrands[strand] || 0) + numericScore;
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
  
        const sortedStrands = Object.entries(allStrands)
          .sort((a, b) => b[1] - a[1]);
        
        // Convert to object before saving
        const overallPredictionObj = Object.fromEntries(sortedStrands);
  
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
  
        // Save the overall prediction as an object
        await AsyncStorage.setItem("overallprediction_shs", JSON.stringify(overallPredictionObj));
        setIndividualCharts(individualData);
      } catch (error) {
        console.error('Error loading data:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to load prediction data',
        });
      }
    };
  
    loadData();
  }, []);
  
  useEffect(() => {
    const saveData = async () => {
      if (!user || !user._id || topChoices.length === 0) return;
  
      try {
        const payload = {
          userId: user._id,
          predictions: JSON.parse(await AsyncStorage.getItem("predictions")) || {},
          certprediction: JSON.parse(await AsyncStorage.getItem("certprediction")) || {},
          shspqprediction: JSON.parse(await AsyncStorage.getItem("shspqprediction")) || {},
          prediction_exam_shs: JSON.parse(await AsyncStorage.getItem("prediction_exam_shs")) || {},
          overallprediction_shs: JSON.parse(await AsyncStorage.getItem("overallprediction_shs")) || {}, // Added this line
          examScores: JSON.parse(await AsyncStorage.getItem("examScores")) || {}
        };
  
        const res = await axios.post("http://192.168.100.171:4000/api/prediction_shs/save", payload);
        console.log("Predictions saved successfully:", res.data);
        setSaveStatus("Successfully saved to database.");
        Toast.show({
          type: 'success',
          text1: '✅ Successfully saved to database!',
        });
      } catch (error) {
        console.error("Failed to save predictions", error);
        setSaveStatus("Failed to save data. Please try again.");
        Toast.show({
          type: 'error',
          text1: '❌ Failed to save data. Please try again.',
        });
      }
    };
  
    saveData();
  }, [user, topChoices]);

  const shareChart = async () => {
    if (!chartRef.current) {
      Alert.alert("Error", "Chart not found!");
      return;
    }

    try {
      const uri = await captureRef(chartRef, {
        format: "png",
        quality: 0.8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Failed to share chart: " + error.message);
    }
  };

  const sendEmail = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "User email not found!");
      return;
    }
    if (!chartRef.current) {
      Alert.alert("Error", "Chart not found!");
      return;
    }
    
    try {
      const uri = await captureRef(chartRef, {
        format: "jpg",
        quality: 0.5,
      });
      
      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      
      await axios.post("http://192.168.100.171:4000/api/auth/send-graph-email", {
        image: `data:image/jpeg;base64,${base64Image}`,
        email: user.email,
      });
      
      Alert.alert("Success", "Email sent successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to send email: " + error.message);
    }
  };

  const printChart = async () => {
    if (!chartRef.current) {
      Alert.alert("Error", "Chart not found!");
      return;
    }

    try {
      const uri = await captureRef(chartRef, {
        format: "png",
        quality: 0.8,
      });
      
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              img { width: 100%; height: auto; }
              h1 { text-align: center; }
            </style>
          </head>
          <body>
            <h1>Overall SHS Strand Predictions</h1>
            <img src="${uri}" />
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to print chart: " + error.message);
    }
  };

  const redirectToFinalResultSHS = () => {
    router.push("Finalshs");
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
    style: {
      borderRadius: 16,
    },
  };

  const getBackgroundColors = (index) => {
    const colors = ["#6a11cb", "#2575fc", "#ff416c", "#ff4b2b", "#33FF57"];
    return colors[index % colors.length];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.graphContainer}>
        <Text style={styles.heading}>Overall College Course Predictions</Text>
        <View style={styles.topChoices}>
          {topChoices.slice(0, 3).map(([strand], index) => (
            <Text key={strand} style={styles.choiceText}>
              <Text style={styles.strongText}>
                {index === 0 ? "Your First Choice" : index === 1 ? "Your Second Choice" : "Your Third Choice"}:
              </Text>{" "}
              {strand}
            </Text>
          ))}
        </View>

        <View style={styles.graphContainer}>
          <Text style={styles.heading}>Overall SHS Strand Predictions (Top 5)</Text>
          <View style={styles.chartsContainer} ref={chartRef}>
            {chartData && (
              <View style={styles.chartWrapper}>
                <Text style={styles.subHeading}>Overall Prediction</Text>
                <BarChart
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      {
                        data: chartData.datasets[0].data,
                        colors: chartData.labels.map((_, i) => () => getBackgroundColors(i))
                      }
                    ]
                  }}
                  width={screenWidth}
                  height={220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={30}
                  fromZero
                  yAxisLabel=""
                  yAxisSuffix=""
                  style={styles.chart}
                />
              </View>
            )}

            {individualCharts.map(({ label, chart }, index) => (
              <View key={label} style={styles.chartWrapper}>
                <Text style={styles.subHeading}>{label}</Text>
                <BarChart
                  data={{
                    labels: chart.labels,
                    datasets: [
                      {
                        data: chart.datasets[0].data,
                        colors: chart.labels.map((_, i) => () => getBackgroundColors(i))
                      }
                    ]
                  }}
                  width={screenWidth}
                  height={220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={30}
                  fromZero
                  yAxisLabel=""
                  yAxisSuffix=""
                  style={styles.chart}
                />
              </View>
            ))}
          </View>
        </View>

        <Toast />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={shareChart}>
            <Text style={styles.buttonText}>Share Chart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={sendEmail}>
            <Text style={styles.buttonText}>Send via Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={printChart}>
            <Text style={styles.buttonText}>Print</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={redirectToFinalResultSHS}>
            <Text style={styles.buttonText}>View Final Result</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Portal")}>
          <Text style={styles.backButtonText}>⬅ Back to Personal Questionnaire</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  graphContainer: {
    padding: 20,
    marginTop: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  topChoices: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  choiceText: {
    fontSize: 16,
    marginBottom: 8,
  },
  strongText: {
    fontWeight: "bold",
  },
  chartsContainer: {
    marginTop: 20,
  },
  chartWrapper: {
    marginBottom: 30,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#6a11cb",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#6a11cb",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#6a11cb",
    fontWeight: "600",
    textAlign: "center",
  }
});

export default OverallResult;