import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { VictoryBar, VictoryChart, VictoryRadar, VictoryTheme, VictoryAxis, VictoryPolarAxis } from "victory-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";

const OverallResult = () => {
// Strand descriptions and career pathways (truncated for brevity)
const strandDescriptions = {
  STEM: "Science, Technology, Engineering, and Mathematics (STEM) is for students interested in scientific innovations, engineering, and technological advancements.",
  ABM: "The Accountancy, Business, and Management (ABM) strand is designed for students who aspire to become entrepreneurs, corporate professionals, and financial experts.",
  HUMSS: "The Humanities and Social Sciences (HUMSS) strand is perfect for students passionate about history, culture, communication, and public service.",
  // Add other strand descriptions as needed
};

const careerPathways = {
  STEM: ["Medicine", "Engineering", "Architecture", "Data Science", "Research Scientist"],
  ABM: ["Entrepreneur", "Accountant", "Business Manager", "Financial Analyst", "Marketing Executive"],
  HUMSS: ["Lawyer", "Journalist", "Psychologist", "Teacher", "Social Worker"],
  // Add other career pathways as needed
};

const getPersonalizedMessage = (topStrand, secondStrand, thirdStrand) => {
  return `Your assessment results indicate that your primary strength lies in the ${topStrand} strand, with significant aptitude also showing in ${secondStrand} and ${thirdStrand}. This unique combination reflects your diverse talents and interests, creating a promising foundation for your academic journey.`;
};

const getTraitsForStrand = (strand) => {
  const traits = {
    STEM: "analytical thinking, problem-solving aptitude, and systematic approach to challenges",
    ABM: "business acumen, financial literacy, and leadership potential",
    HUMSS: "strong communication skills, empathy, and social awareness",
    // Add other traits as needed
  };
  return traits[strand] || "diverse skills and interests";
};

const getSkillsForStrand = (strand) => {
  const skills = {
    STEM: "quantitative reasoning, scientific methodology, and analytical capabilities",
    ABM: "financial analysis, organizational management, and strategic planning",
    HUMSS: "critical thinking, cultural competence, and effective communication",
    // Add other skills as needed
  };
  return skills[strand] || "various academic and practical abilities";
};


  const [chartData, setChartData] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const [personalizedMessage, setPersonalizedMessage] = useState("");
  const navigation = useNavigation();
  const viewShotRef = React.useRef();

  useFocusEffect(
    React.useCallback(() => {
      fetchUser();
      processStrandData();
    }, [])
  );

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) return;

      const res = await axios.post("http://localhost:4000/api/auth/user", { token });
      setUser(res.data.user);
    } catch (error) {
      console.error("User fetch failed", error);
    }
  };

  const processStrandData = async () => {
    const sources = {
      "Overall Prediction": ["predictions", "certprediction", "pqprediction", "prediction_exam_jhs"],
      "From Grades": ["predictions"],
      "From Certificate": ["certprediction"],
      "From Personal Questionnaire": ["pqprediction"],
      "From Exam Results": ["prediction_exam_jhs"]
    };

    const allStrands = {};
    const colorPalette = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
    ];

    try {
      for (const [label, keys] of Object.entries(sources)) {
        for (const key of keys) {
          const storedData = await AsyncStorage.getItem(key);
          if (!storedData) continue;

          const data = JSON.parse(storedData);

          if (key === "predictions") {
            Object.entries(data).forEach(([strand, values]) => {
              if (values.percentage !== undefined) {
                const numericPercentage = parseFloat(values.percentage) || 0;
                allStrands[strand] = (allStrands[strand] || 0) + numericPercentage;
              }
            });
          } else if (key === "pqprediction" && data.predictionScores) {
            data.predictionScores.forEach(({ strand, score }) => {
              const numericScore = parseFloat(score) || 0;
              allStrands[strand] = (allStrands[strand] || 0) + numericScore;
            });
          } else {
            Object.entries(data).forEach(([strand, value]) => {
              const numericValue = parseFloat(value) || 0;
              allStrands[strand] = (allStrands[strand] || 0) + numericValue;
            });
          }
        }
      }

      // Sort strands by score and take top 5
      const sortedStrands = Object.entries(allStrands)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (sortedStrands.length > 0) {
        setTopChoices(sortedStrands);
        
        // Format data for Victory charts
        setChartData(
          sortedStrands.map(([strand, percentage], index) => ({
            strand,
            percentage,
            fill: colorPalette[index % colorPalette.length]
          }))
        );
        
        setRadarData(
          sortedStrands.map(([strand, percentage]) => ({
            strand,
            percentage
          }))
        );
        
        // Create personalized message if we have at least 3 strands
        if (sortedStrands.length >= 3) {
          const topStrand = sortedStrands[0][0];
          const secondStrand = sortedStrands[1][0];
          const thirdStrand = sortedStrands[2][0];
          setPersonalizedMessage(getPersonalizedMessage(topStrand, secondStrand, thirdStrand));
        }
      }
    } catch (error) {
      console.error("Error processing strand data:", error);
    }
  };

  const downloadReport = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      
      const filename = `SHS_Strand_Prediction_${Date.now()}.png`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: filePath
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert("Sharing not available");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      Alert.alert("Error", "Could not download report.");
    }
  };

  const sendEmail = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const userData = await AsyncStorage.getItem("user");
      
      if (!userData) {
        Alert.alert("Error", "User information not found.");
        return;
      }
      
      const user = JSON.parse(userData);
      if (!user.email) {
        Alert.alert("Error", "User email not found.");
        return;
      }
      
      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      await axios.post("http://localhost:4000/api/auth/send-graph-email", {
        image: `data:image/png;base64,${base64Image}`,
        email: user.email
      });
      
      Alert.alert("Success", "Report sent to your email successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert("Error", "Failed to send email.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }} style={styles.reportContainer}>
        <View style={styles.reportHeader}>
          <Text style={styles.titleText}>Senior High School Strand Prediction Report</Text>
          {user && <Text style={styles.subtitleText}>Student: {user.name || "Anonymous Student"}</Text>}
          <Text style={styles.dateText}>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Top Recommendations */}
        {topChoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Strands</Text>
            
            {topChoices.slice(0, 3).map(([strand, score], index) => (
              <View key={strand} style={[styles.recommendationCard, 
                index === 0 ? styles.primaryCard : 
                index === 1 ? styles.secondaryCard : styles.tertiaryCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{strand}</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreValue}>{score.toFixed(1)}%</Text>
                    <Text style={styles.scoreLabel}>Compatibility</Text>
                  </View>
                </View>
                
                <View style={styles.cardBody}>
                  <Text style={styles.description}>{strandDescriptions[strand]}</Text>
                  <Text style={styles.careerTitle}>Potential Career Paths:</Text>
                  {careerPathways[strand]?.slice(0, 3).map(career => (
                    <Text key={career} style={styles.careerItem}>• {career}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Results</Text>
          
          {chartData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top 5 Strand Compatibility</Text>
              <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={20}
                height={300}
              >
                <VictoryAxis
                  tickFormat={(x) => x}
                  style={{
                    tickLabels: { fontSize: 10, padding: 5, angle: -45 }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `${t}%`}
                />
                <VictoryBar
                  data={chartData}
                  x="strand"
                  y="percentage"
                  style={{
                    data: { fill: ({ datum }) => datum.fill }
                  }}
                />
              </VictoryChart>
            </View>
          )}
          
          {radarData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Strand Comparison</Text>
              <VictoryChart
                polar
                theme={VictoryTheme.material}
                domain={{ y: [0, 100] }}
                height={300}
              >
                <VictoryPolarAxis
                  tickFormat={t => ""}
                  style={{
                    grid: { stroke: "lightgray", strokeWidth: 0.5 }
                  }}
                />
                {radarData.map((d, i) => (
                  <VictoryPolarAxis
                    key={i}
                    dependentAxis
                    style={{
                      tickLabels: { fill: "none" },
                      grid: { stroke: "lightgray", strokeWidth: 0.5 }
                    }}
                    axisValue={d.strand}
                    label={d.strand}
                    labelPlacement="vertical"
                  />
                ))}
                <VictoryRadar
                  style={{
                    data: { fill: "rgba(54, 162, 235, 0.2)", stroke: "rgb(54, 162, 235)", strokeWidth: 2 }
                  }}
                  data={radarData}
                  x="strand"
                  y="percentage"
                />
              </VictoryChart>
            </View>
          )}
        </View>

        {/* Personalized Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Personalized Analysis</Text>
          <Text style={styles.analysisText}>{personalizedMessage}</Text>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Next Steps</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review Your Results</Text>
              <Text style={styles.stepDescription}>Take time to carefully review and reflect on your strand compatibility results.</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Research Each Strand</Text>
              <Text style={styles.stepDescription}>Learn more about the curriculum and requirements for your top recommended strands.</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Speak with Counselors</Text>
              <Text style={styles.stepDescription}>Schedule a meeting with your school's guidance counselor to discuss your results.</Text>
            </View>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Important Note</Text>
          <Text style={styles.disclaimerText}>
            This assessment is based on your responses to our questionnaires, academic records, and exam results. 
            While our prediction system is designed to provide accurate guidance, it should be considered as one 
            of many factors in your decision-making process.
          </Text>
        </View>
      </ViewShot>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={downloadReport}>
          <Text style={styles.buttonText}>Download Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={sendEmail}>
          <Text style={styles.buttonText}>Send to My Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tertiaryButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  reportContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    margin: 8,
    borderRadius: 8,
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
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  recommendationCard: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: "#e3f2fd",
  },
  secondaryCard: {
    backgroundColor: "#e8f5e9",
  },
  tertiaryCard: {
    backgroundColor: "#fff3e0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  rankBadge: {
    backgroundColor: "#3f51b5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666",
  },
  cardBody: {
    padding: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  careerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  careerItem: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
  },
  chartContainer: {
    marginBottom: 20,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  chartTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3f51b5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: "#444",
  },
  disclaimer: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 10,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#555",
  },
  actionButtons: {
    flexDirection: "column",
    padding: 16,
  },
  primaryButton: {
    backgroundColor: "#3f51b5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: "#009688",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  tertiaryButton: {
    backgroundColor: "#ff9800",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});


export default OverallResult;
