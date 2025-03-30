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
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

const OverallResult = () => {
  const [chartData, setChartData] = useState(null);
  const [individualCharts, setIndividualCharts] = useState([]);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const navigation = useNavigation();
  const chartRef = useRef(null);
  const reportRef = useRef(null);
  // Get screen dimensions
  const { width } = Dimensions.get("window");
  const router = useRouter();

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
    const sources = {
      "Overall Prediction": [
        "predictions",
        "certprediction",
        "shspqprediction",
        "prediction_exam_shs"
      ],
      "From Grades": ["predictions"],
      "From Certificate": ["certprediction"],
      "From Personal Questionnaire": ["shspqprediction"],
      "From Exam Results": ["prediction_exam_shs"]
    };
  
    const fetchData = async () => {
      try {
        const allStrands = {};
        const individualData = [];
  
        for (const [label, keys] of Object.entries(sources)) {
          const strandScores = {};
  
          for (const key of keys) {
            try {
              const storedData = await AsyncStorage.getItem(key);
              if (!storedData) continue;
  
              const data = JSON.parse(storedData);
  
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
            } catch (error) {
              console.error(`Error parsing AsyncStorage data for ${key}:`, error);
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
  
        // Convert to object before saving
        const sortedStrands = Object.entries(allStrands).sort((a, b) => b[1] - a[1]);
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
  
        await AsyncStorage.setItem("overallprediction_shs", JSON.stringify(overallPredictionObj));
        setIndividualCharts(individualData);
      } catch (error) {
        console.error("Error in data processing:", error);
      }
    };
  
    fetchData();
  }, []);
  
  useEffect(() => {
    const saveToServer = async () => {
      if (!user || !user._id || topChoices.length === 0) return;
  
      try {
        const predictions = await AsyncStorage.getItem("predictions");
        const certprediction = await AsyncStorage.getItem("certprediction");
        const shspqprediction = await AsyncStorage.getItem("shspqprediction");
        const prediction_exam_shs = await AsyncStorage.getItem("prediction_exam_shs");
        const overallprediction_shs = await AsyncStorage.getItem("overallprediction_shs");
        const examScores = await AsyncStorage.getItem("examScores");
  
        const payload = {
          userId: user._id,
          predictions: predictions ? JSON.parse(predictions) : {},
          certprediction: certprediction ? JSON.parse(certprediction) : {},
          shspqprediction: shspqprediction ? JSON.parse(shspqprediction) : {},
          prediction_exam_shs: prediction_exam_shs ? JSON.parse(prediction_exam_shs) : {},
          overallprediction_shs: overallprediction_shs ? JSON.parse(overallprediction_shs) : {},
          examScores: examScores ? JSON.parse(examScores) : {}
        };
  
        const response = await axios.post("https://edu-backend-mvzo.onrender.com/api/prediction_shs/save", payload);
        console.log("Predictions saved successfully:", response.data);
        setSaveStatus("Successfully saved to database.");
        Toast.show({
          type: 'success',
          text1: '✅ Successfully saved to database!'
        });
      } catch (error) {
        console.error("Failed to save predictions", error);
        setSaveStatus("Failed to save data. Please try again.");
        Toast.show({
          type: 'error',
          text1: '❌ Failed to save data. Please try again.'
        });
      }
    };
  
    saveToServer();
  }, [user, topChoices]);

  const shareChart = async () => {
    if (!chartRef.current) {
      Alert.alert("Error", "Chart not found!");
      return;
    }

    try {
      // Use capture method directly from the ref
      const uri = await chartRef.current.capture();

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
    try {
      // Check if user data is available
      if (!user || !user.email) {
        Alert.alert("Error", "User email not found!");
        return;
      }
      
      if (!reportRef.current) {
        Alert.alert("Error", "Report not ready yet!");
        return;
      }
      
      // Capture the chart as an image
      const uri = await reportRef.current.capture();
      
      // Convert image URI to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1]; // Extract base64 part
        
        // Send email with the chart image
        await axios.post(
          "https://edu-backend-mvzo.onrender.com/api/auth/send-graph-email",
          {
            image: `data:image/jpeg;base64,${base64Image}`,
            email: user.email,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        
        Alert.alert(
          "Success",
          "Your SHS strand prediction report has been sent to your email successfully!"
        );
      };
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert("Error", "Failed to send email: " + error.message);
    }
  };

  const printChart = async () => {
    if (!chartRef.current) {
      Alert.alert("Error", "Chart not found!");
      return;
    }

    try {
      const uri = await chartRef.current.capture();
      
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

  // Custom chart configuration
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: "#e3e3e3",
      strokeDasharray: "0"
    }
  };

  // Custom colors for the chart
  const customColors = ["#6a11cb", "#2575fc", "#ff416c", "#ff4b2b", "#33FF57", "#33FFF5", "#D133FF"];

  const getColor = (index) => {
    return customColors[index % customColors.length];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Overall SHS Strand Predictions</Text>
      </View>

      <View style={styles.topChoicesContainer}>
        {topChoices.slice(0, 3).map(([strand], index) => (
          <Text key={strand} style={styles.topChoiceText}>
            <Text style={styles.boldText}>
              {index === 0 ? "Your First Choice" : index === 1 ? "Your Second Choice" : "Your Third Choice"}:
            </Text>{" "}
            {strand}
          </Text>
        ))}
      </View>

      <ViewShot 
        ref={(ref) => {
          chartRef.current = ref;
          reportRef.current = ref;
        }} 
        style={styles.chartContainer}
      >
        {chartData && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Overall Prediction</Text>
            <BarChart
              data={{
                labels: chartData.labels.length > 5 
                  ? chartData.labels.slice(0, 5) 
                  : chartData.labels,
                datasets: [{
                  data: chartData.labels.length > 5 
                    ? chartData.datasets[0].data.slice(0, 5) 
                    : chartData.datasets[0].data
                }]
              }}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1, index) => {
                  return customColors[index % customColors.length] || `rgba(0, 0, 0, ${opacity})`;
                }
              }}
              verticalLabelRotation={30}
              showValuesOnTopOfBars
              fromZero
              style={styles.chart}
            />
          </View>
        )}
      </ViewShot>

      {individualCharts.map(({ label, chart }, index) => (
        <View key={label} style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>{label}</Text>
          <BarChart
            data={{
              labels: chart.labels.length > 5 ? chart.labels.slice(0, 5) : chart.labels,
              datasets: [{
                data: chart.labels.length > 5 
                  ? chart.datasets[0].data.slice(0, 5) 
                  : chart.datasets[0].data
              }]
            }}
            width={width - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index) => {
                return customColors[index % customColors.length] || `rgba(0, 0, 0, ${opacity})`;
              }
            }}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            fromZero
            style={styles.chart}
          />
        </View>
      ))}

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

      <TouchableOpacity style={styles.backButton} onPress={() => router.push("/Portal")}>
        <Text style={styles.backButtonText}>⬅ Back to Personal Questionnaire</Text>
      </TouchableOpacity>
      
      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 15,
    marginTop: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  topChoicesContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    margin: 15,
    marginTop: 5,
  },
  topChoiceText: {
    fontSize: 16,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
  },
  chartContainer: {
    padding: 10,
  },
  chartWrapper: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    padding: 15,
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
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#6a11cb",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#6a11cb",
    fontWeight: "600",
    textAlign: "center",
  },
  spacer: {
    height: 30,
  }
});

export default OverallResult;