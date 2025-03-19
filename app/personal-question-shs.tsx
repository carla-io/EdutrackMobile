import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, ScrollView, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import personalQuestions from "./personalQuestions.json";
import { BarChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const getGradeLevel = async () => {
  try {
    const gradeLevel = await AsyncStorage.getItem("gradeLevel");
    return gradeLevel || ""; // Return an empty string if nothing is stored
  } catch (error) {
    console.error("Error retrieving grade level:", error);
    return ""; // Return a fallback value in case of an error
  }
};

const PQ = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [predictionData, setPredictionData] = useState([]);
  const [predictedStrand, setPredictedStrand] = useState(null);
  const [strandScoresList, setStrandScoresList] = useState([]);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const currentQuestion = questions.length > 0 && currentQuestionIndex < questions.length ? questions[currentQuestionIndex] : null;
  const [gradeLevel, setGradeLevel] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const storedAnswers = await AsyncStorage.getItem("pq-answers");
        if (storedAnswers) {
          setAnswers(JSON.parse(storedAnswers));
        }
      } catch (error) {
        console.error("Failed to load answers:", error);
      }
    };

    loadAnswers();
  }, []);

  useEffect(() => {
    const fetchGradeLevel = async () => {
      const storedGradeLevel = await getGradeLevel();
      setGradeLevel(storedGradeLevel);
    };

    fetchGradeLevel();
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      const gradeLevel = await AsyncStorage.getItem("gradeLevel");
      const gradeLevelKey = {
        jhs: "Junior High School",
        shs: "Senior High School",
        college: "College",
      }[gradeLevel] || null;
  
      if (gradeLevelKey && personalQuestions[gradeLevelKey]) {
        setQuestions(personalQuestions[gradeLevelKey]);
        console.log("Loaded Questions:", personalQuestions[gradeLevelKey]);
      } else {
        console.error("No questions found for grade level:", gradeLevel, gradeLevelKey);
      }
    };
  
    loadQuestions();
  }, []); // Runs only once when the component mounts
  
  // Fetch strand scores from backend
  useEffect(() => {
    const fetchStrandScores = async () => {
      try {
        const response = await fetch("YOUR_BACKEND_ENDPOINT");
        const textData = await response.text();
  
        try {
          const jsonData = JSON.parse(textData);
          console.log("Backend Response:", jsonData);
          setStrandScoresList(jsonData?.strand_scores_list || []);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          console.log("Response was:", textData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchStrandScores();
  }, []); // Runs only once when the component mounts
  
  // Save answers in AsyncStorage
  useEffect(() => {
    const saveAnswers = async () => {
      await AsyncStorage.setItem("pq-answers", JSON.stringify(answers));
    };
  
    saveAnswers();
  }, [answers]); // Runs whenever answers state changes
  
  // Handle answer selection
  const handleAnswerChange = (value) => {
    setSelectedAnswer(value);
    console.log("Selected Answer:", value);
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      Alert.alert("⚠️ Warning", "Please select an answer before proceeding!");
      return;
    }
  
    if (currentQuestion) {
      const updatedAnswers = { ...answers, [currentQuestion.name]: selectedAnswer };
      setAnswers(updatedAnswers);
  
      // Save to AsyncStorage
      await AsyncStorage.setItem("pq-answers", JSON.stringify(updatedAnswers));
    }
  
    setSelectedAnswer(null);
  
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!Object.keys(answers).length) {
      Alert.alert("⚠️ Warning", "No answers found! Please complete the questionnaire.");
      return;
    }
  
    Alert.alert("📤 Info", "Sending answers for prediction...");
  
    // Determine the endpoint based on grade level
    let endpoint;
    if (gradeLevel === "shs") {
      endpoint = "http://192.168.100.171:5001/predict_college";  // For SHS
    } else if (gradeLevel === "jhs") {
      endpoint = "http://192.168.100.171:5001/predict";  // For JHS
    } else {
      Alert.alert("⚠️ Error", "Invalid grade level!");
      return;
    }
  
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel, answers }), // Send grade level with answers
      });
  
      const data = await response.json();
      if (response.ok) {
        // Sort prediction scores in descending order and take only top 5
        const sortedScores = [...(data?.prediction_scores || [])]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
          
        setPredictionData(sortedScores);
        setPredictedStrand(data?.predicted_strand);
        setStrandScoresList(data?.strand_scores_list || []);
  
        // Store prediction data in AsyncStorage
        const predictionKey = gradeLevel === "shs" ? "shspqprediction" : "pqprediction";
        await AsyncStorage.setItem(predictionKey, JSON.stringify({
          predictedStrand: data?.predicted_strand,
          predictionScores: sortedScores,
          strandScoresList: data?.strand_scores_list || [],
        }));
  
        Alert.alert("🎉 Success", `Predicted strand: ${data.predicted_strand}`);
        setShowProceedButton(true);
      } else {
        Alert.alert("⚠️ Error", data.error || "Prediction failed.");
      }
    } catch (error) {
      Alert.alert("⚠️ Error", "Server error! Check connection.");
      console.error("Submission error:", error);
    }
  };

  // We don't need this function anymore as we're directly setting the top 5 in handleSubmit
  // const getTopFiveStrands = () => {
  //   if (!predictionData || predictionData.length === 0) return [];
  //   return predictionData.slice(0, 5);
  // };

  // No need to call getTopFiveStrands() since predictionData already contains just the top 5
  // const topFiveStrands = getTopFiveStrands();

  return (
    <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
          {gradeLevel === "shs" ? "Senior High Strand Assessment" : "Junior High Strand Assessment"}
        </Text>
      </View>

      {questions.length > 0 && currentQuestion ? (
        <View style={{ padding: 15, backgroundColor: "#fff", borderRadius: 10, elevation: 5 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            {currentQuestionIndex + 1}. {currentQuestion.text}
          </Text>

          <RadioButton.Group onValueChange={handleAnswerChange} value={selectedAnswer}>
            {currentQuestion.options?.length > 0 ? (
              currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswerChange(option)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#ddd",
                  }}
                >
                  <RadioButton value={option} />
                  <Text style={{ fontSize: 16, marginLeft: 10 }}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No options available.</Text>
            )}
          </RadioButton.Group>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity
                onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                style={{ backgroundColor: "#ccc", padding: 12, borderRadius: 8 }}
              >
                <Text style={{ fontSize: 16 }}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              style={{ backgroundColor: "#4CAF50", padding: 12, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 16, color: "#fff" }}>
                {currentQuestionIndex < questions.length - 1 ? "Next" : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Prediction Graph - Only showing top 5 strands */}
          {predictionData.length > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>Prediction Results</Text>
              <Text style={{ textAlign: "center", marginVertical: 10 }}>
                Predicted Strand: <Text style={{ fontWeight: "bold" }}>{predictedStrand}</Text>
              </Text>
              
              <Text style={{ textAlign: "center", marginBottom: 10, fontSize: 16 }}>
                Top 5 Recommended Strands
              </Text>

              {/* BarChart showing only top 5 strands */}
              <BarChart
                data={{
                  labels: predictionData.map((item) => item.strand),
                  datasets: [{ data: predictionData.map((item) => item.score) }],
                }}
                width={Dimensions.get("window").width - 40} // Adjust width dynamically
                height={300}
                chartConfig={{
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                fromZero
                showValuesOnTopOfBars
                verticalLabelRotation={30}
              />

              {showProceedButton && (
                <TouchableOpacity
                  onPress={() => router.push("Exam")}
                  style={{
                    marginTop: 20,
                    backgroundColor: "#007BFF",
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#fff" }}>Proceed to Exam</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <Text style={{ textAlign: "center", fontSize: 18 }}>No questions available for your grade level.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  question: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  option: {
    padding: 10,
    marginVertical: 8,
    backgroundColor: "maroon",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedOption: {
    backgroundColor: "green",
    borderWidth: 1,
    borderColor: "#003366",
  },
  selectedOptionText: {
    color: "#ffffff",
  },
  optionText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  backButton: {
    padding: 12,
    backgroundColor: "#d9d9d9",
    borderRadius: 8,
  },
  nextButton: {
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 8,
  },
  proceedButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#28a745",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default PQ;