import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity} from "react-native";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as Print from "expo-print";
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.get("window").width;

const strandDescriptions = {
    STEM: "Science, Technology, Engineering, and Mathematics (STEM) is for students interested in scientific innovations, engineering, and technological advancements. It prepares students for careers in medicine, architecture, engineering, data science, and research by focusing on subjects like physics, calculus, biology, and computer science.",
    
    ABM: "The Accountancy, Business, and Management (ABM) strand is designed for students who aspire to become entrepreneurs, corporate professionals, and financial experts. It covers subjects like business ethics, marketing strategies, economics, accounting, and corporate management, providing a solid foundation for business and commerce-related courses in college.",
  
    HUMSS: "The Humanities and Social Sciences (HUMSS) strand is perfect for students passionate about history, culture, communication, and public service. It leads to careers in law, journalism, political science, psychology, sociology, and education by focusing on subjects like philosophy, literature, public speaking, and social sciences.",
  
    GAS: "The General Academic Strand (GAS) is for students who are still exploring their career path. It offers a flexible curriculum that includes a mix of subjects from STEM, ABM, and HUMSS, preparing students for various college courses and professions in administration, liberal arts, education, and government.",
  
    "Home Economics": "The Home Economics (HE) strand under the Technical-Vocational-Livelihood (TVL) track focuses on skills-based training in hospitality, culinary arts, fashion design, and caregiving. It prepares students for careers in tourism, hotel and restaurant management, food services, and entrepreneurship.",
  
    ICT: "The Information and Communications Technology (ICT) strand under TVL is ideal for tech-savvy students. It covers programming, networking, cybersecurity, web development, and software engineering, equipping students with skills for careers in IT, animation, game development, and digital arts.",
  
    "Industrial Arts": "The Industrial Arts strand prepares students for careers in technical trades and engineering. It includes training in welding, carpentry, electrical installation, plumbing, and automotive mechanics, providing job-ready skills for the construction and manufacturing industries.",
  
    "Agri-Fishery Arts": "The Agri-Fishery Arts strand focuses on agricultural technology, animal husbandry, fisheries, and organic farming. It equips students with knowledge in sustainable agriculture, farm mechanics, aquaculture, and agro-forestry, preparing them for careers in agribusiness and environmental management.",
  
    Cookery: "The Cookery strand under Home Economics provides in-depth training in culinary arts, baking, food safety, and international cuisine. It is designed for students who want to pursue careers as chefs, bakers, or restaurant owners.",
  
    "Performing Arts": "The Performing Arts strand under the Arts and Design track is for students passionate about dance, theater, music, and acting. It covers stage performance, choreography, vocal training, and drama, preparing students for careers in entertainment and live productions.",
  
    "Visual Arts": "The Visual Arts strand focuses on painting, sculpture, digital art, and illustration. It provides students with creative and technical skills needed for careers in graphic design, animation, fine arts, and advertising.",
  
    "Media Arts": "The Media Arts strand teaches students film production, cinematography, photography, video editing, and digital storytelling. It is ideal for those interested in filmmaking, multimedia arts, and broadcast media.",
  
    "Literary Arts": "The Literary Arts strand is designed for students who have a passion for writing, poetry, fiction, and journalism. It focuses on creative writing, literature, and publishing, preparing students for careers as writers, editors, and communication professionals.",
  
    Sports: "The Sports strand is for students interested in athletics, physical education, and sports science. It covers coaching, sports management, health and fitness, and competitive sports training, leading to careers in professional sports, coaching, and physical therapy."
  };

const OverallResult = () => {
  const [chartData, setChartData] = useState(null);
  const [individualCharts, setIndividualCharts] = useState([]);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const [saveStatus, setSaveStatus] = useState(null);
  const chartRef = useRef(null);
  const router = useRouter();

  const showToast = (type, text1, text2) => {
    Toast.show({
      type: type, // 'success', 'error', or 'info'
      text1: text1, // Main title
      text2: text2, // Subtitle
      position: "top",
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50, // Adjust as needed
    });
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

  useEffect(() => {
    const fetchPredictions = async () => {
      const sources = {
        "Overall Prediction": ["predictions", "certprediction", "pqprediction", "prediction_exam_jhs"],
        "From Grades": ["predictions"],
        "From Certificate": ["certprediction"],
        "From Personal Questionnaire": ["pqprediction"],
        "From Exam Results": ["prediction_exam_jhs"],
      };

      const allStrands = {};
      const individualData = [];

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
          } else if (key === "pqprediction" && data.predictionScores) {
            data.predictionScores.forEach(({ strand, score }) => {
              const numericScore = parseFloat(score) || 0;
              strandScores[strand] = (strandScores[strand] || 0) + numericScore;
              allStrands[strand] = (allStrands[strand] || 0) + numericScore;
            });
          } else {
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
              datasets: [{ data: Object.values(strandScores) }],
            },
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
              backgroundColor: ["#FF5733", "#33FF57", "#3357FF", "#FF33A6", "#FF8C33"],
              borderColor: "#000",
              borderWidth: 1,
            },
          ],
        });
      }

      setIndividualCharts(individualData);
    };

    fetchPredictions();
  }, []);

  useEffect(() => {
    const savePredictions = async () => {
      if (!user || !user._id || topChoices.length === 0) return;
  
      try {
        const predictions = JSON.parse(await AsyncStorage.getItem("predictions")) || {};
        const certprediction = JSON.parse(await AsyncStorage.getItem("certprediction")) || {};
        const pqprediction_jhs = JSON.parse(await AsyncStorage.getItem("pqprediction")) || {};
        const prediction_exam_jhs = JSON.parse(await AsyncStorage.getItem("prediction_exam_jhs")) || {};
        const examScores = JSON.parse(await AsyncStorage.getItem("examScores")) || {};
  
        const payload = {
          userId: user._id,
          predictions,
          certprediction,
          pqprediction_jhs,
          prediction_exam_jhs,
          examScores,
        };
  
        const res = await axios.post("http://192.168.100.171:4000/api/predictions/save", payload);
        console.log("Predictions saved successfully:", res.data);
        setSaveStatus("Successfully saved to database.");
        showToast("success", "✅ Success", "Successfully saved to database.");
      } catch (error) {
        console.error("Failed to save predictions", error);
        setSaveStatus("Failed to save data. Please try again.");
        showToast("error", "⚠️ Error", "Failed to save data");
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

      <View style={styles.chartContainer} ref={chartRef}>
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

      <View style={styles.topChoices}>
        {topChoices.slice(0, 3).map(([strand], index) => (
          <Text key={strand} style={styles.choiceText}>
            <Text style={styles.choiceLabel}>
              {index === 0 ? "Your First Choice" : index === 1 ? "Your Second Choice" : "Your Third Choice"}:
            </Text>{" "}
            {strand} - {strandDescriptions[strand]}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    shadowColor: "#ff416c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});


export default OverallResult;