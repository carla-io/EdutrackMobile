import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Dimensions, ToastAndroid, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import shsQuiz from './shsquiz.json';
import collegeQuiz from './collegequiz.json';
import careerQuiz from './careerquiz.json';
import ResultsGraph from './ResultsGraph';
import { useRouter } from "expo-router";
import { RadioButton } from "react-native-paper";
import { BarChart } from "react-native-chart-kit";

const Exam = ({ navigation }) => {
  const [examQuestions, setExamQuestions] = useState([]);
  const [gradeLevel, setGradeLevel] = useState('');
  const [quizData, setQuizData] = useState({});
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [examCompleted, setExamCompleted] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [reloadGraph, setReloadGraph] = useState(false);
  const router = useRouter();

  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Notification', message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedGradeLevel = await AsyncStorage.getItem('gradeLevel');
        if (storedGradeLevel) {
          setGradeLevel(storedGradeLevel);

          let selectedQuiz = {};
          if (storedGradeLevel === 'jhs') {
            selectedQuiz = shsQuiz;
          } else if (storedGradeLevel === 'shs') {
            selectedQuiz = collegeQuiz;
          } else if (storedGradeLevel === 'college') {
            selectedQuiz = careerQuiz;
          }

          setQuizData(selectedQuiz);
        }
      } catch (error) {
        console.error('Error retrieving user data:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!examCompleted && currentQuestion) {
      const firstOption = currentQuestion.options?.[0] || currentQuestion.choices?.[0];

      if (firstOption) {
        setAnswers((prev) => ({
          ...prev,
          [currentSection]: {
            ...prev[currentSection],
            [currentQuestion.question]: firstOption,
          },
        }));

        setTimeout(() => {
          handleNext();
        }, 500);
      }
    }
  }, [currentQuestionIndex, currentSectionIndex, examCompleted]);

  const handleAnswerChange = (selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [currentQuestion.question]: selectedOption,
      },
    }));
  };

  const handleNext = () => {
    if (!answers[currentSection]?.[currentQuestion.question]) {
      showToast('⚠️ Please select an answer before proceeding!');
      return;
    }

    if (currentQuestionIndex < quizData[currentSection]?.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < Object.keys(quizData).length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      calculateScores();
      setExamCompleted(true);
    }
  };

  const calculateScores = () => {
    let newScores = {};
    const sections = Object.keys(quizData);
    sections.forEach((section) => {
      const totalQuestions = quizData[section]?.quiz.length;
      const correctAnswers = quizData[section]?.quiz.filter(
        (q) => answers[section]?.[q.question] === q.answer
      ).length;
      const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(2);
      newScores[section] = `${correctAnswers} / ${totalQuestions} (${percentage}%)`;
    });

    setScores(newScores);
    AsyncStorage.setItem('examScores', JSON.stringify(newScores));
  };

  const handleSubmit = async () => {
    try {
      const storedScores = await AsyncStorage.getItem('examScores');
      const gradeLevel = await AsyncStorage.getItem('gradeLevel');

      if (!storedScores) {
        showToast('⚠️ No exam scores found!');
        return;
      }

      let endpoint = '';

      if (gradeLevel === 'jhs') {
        endpoint = 'http://192.168.100.171:5001/predict_exam_jhs';
      } else if (gradeLevel === 'shs') {
        endpoint = 'http://192.168.100.171:5001/prediction_exam_shs';
      } else {
        showToast('⚠️ Invalid grade level!');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: JSON.parse(storedScores) }),
      });

      const result = await response.json();

      if (response.ok) {
        if (gradeLevel === 'jhs') {
          await AsyncStorage.setItem('prediction_exam_jhs', JSON.stringify(result.strand_percentages));
          setPrediction(result.strand_percentages);
        } else if (gradeLevel === 'shs') {
          await AsyncStorage.setItem('prediction_exam_shs', JSON.stringify(result.course_percentages));
          setPrediction(result.course_percentages);
        }
      } else {
        showToast('⚠️ Error in prediction!');
      }
    } catch (error) {
      showToast('⚠️ Network error!');
    }
  };

  const reloadGraphHandler = async () => {
    setReloadGraph((prev) => !prev); // Toggle the reloadGraph state to force re-render
  
    // Re-calculate the scores before submitting again
    calculateScores();
  
    try {
      // Fetch the stored scores from AsyncStorage
      const storedScores = await AsyncStorage.getItem("examScores");
      const gradeLevel = await AsyncStorage.getItem("gradeLevel");
  
      if (!storedScores || !gradeLevel) {
        showToast("⚠️ No exam scores found!");
        return;
      }
  
      let endpoint = "";
  
      // Determine the endpoint based on gradeLevel
      if (gradeLevel === "jhs") {
        endpoint = "http://192.168.100.171:5001/predict_exam_jhs";
      } else if (gradeLevel === "shs") {
        endpoint = "http://192.168.100.171:5001/prediction_exam_shs";
      } else {
        showToast("⚠️ Invalid grade level!");
        return;
      }
  
      // Send the stored scores to the backend for re-prediction
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: JSON.parse(storedScores) }), // Send scores as JSON
      });
  
      const result = await response.json();
  
      if (response.ok) {
        // Store the updated prediction result in AsyncStorage
        if (gradeLevel === "jhs") {
          await AsyncStorage.setItem("prediction_exam_jhs", JSON.stringify(result.strand_percentages));
          setPrediction(result.strand_percentages); // Store the updated strand percentages
        } else if (gradeLevel === "shs") {
          await AsyncStorage.setItem("prediction_exam_shs", JSON.stringify(result.course_percentages));
          setPrediction(result.course_percentages); // Store the updated course percentages
        }
        console.log("Updated prediction:", result); // Optional: Log result to the console
      } else {
        showToast("⚠️ Error in prediction!");
      }
    } catch (error) {
      showToast("⚠️ Network error!");
      console.error("Error during prediction:", error);
    }
  };



  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(quizData[Object.keys(quizData)[currentSectionIndex - 1]].quiz.length - 1);
    }
  };

  const sections = Object.keys(quizData);
  const currentSection = sections[currentSectionIndex];
  const questions = quizData[currentSection]?.quiz || [];
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
          Welcome to Your {gradeLevel} Exam
        </Text>
      </View>

      {examCompleted ? (
        <View style={{ padding: 15, backgroundColor: "#fff", borderRadius: 10, elevation: 5 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>Exam Completed! 🎉</Text>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 10 }}>Your Scores per Category:</Text>
          {Object.entries(scores).map(([section, score], index) => (
            <Text key={index} style={{ fontSize: 16, marginTop: 5 }}>
              <Text style={{ fontWeight: "bold" }}>{section}:</Text> {score}
            </Text>
          ))}

          <TouchableOpacity
            onPress={() => {
              if (gradeLevel === "jhs") {
                router.push("GraphJhs");
              } else if (gradeLevel === "shs") {
                router.push("GraphShs");
              }
            }}
            style={{ marginTop: 20, backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ fontSize: 16, color: "#fff" }}>View Results (Graph)</Text>
          </TouchableOpacity>

          {/* Display the prediction graph */}
          {prediction && (
  <BarChart
    data={{
      labels: Object.keys(prediction), // Assuming prediction is an object with keys as labels
      datasets: [{ data: Object.values(prediction) }], // Assuming values are the scores
    }}
    width={Dimensions.get("window").width - 40}
    height={300}
    yAxisLabel=""
    chartConfig={{
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      strokeWidth: 2,
    }}
    style={{ marginVertical: 10, borderRadius: 8 }}
  />
)}


          <TouchableOpacity
            onPress={handleSubmit}
            style={{ marginTop: 20, backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ fontSize: 16, color: "#fff" }}>Submit Prediction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reloadGraphHandler}
            style={{ marginTop: 10, backgroundColor: "#FF9800", padding: 12, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ fontSize: 16, color: "#fff" }}>Reload Graph</Text>
          </TouchableOpacity>
        </View>
      ) : sections.length > 0 ? (
        <View style={{ padding: 15, backgroundColor: "#fff", borderRadius: 10, elevation: 5 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>{currentSection}</Text>
          <Text style={{ fontSize: 16 }}>{currentQuestionIndex + 1}. {currentQuestion?.question}</Text>
          <Text style={{ fontSize: 14, color: "red", marginVertical: 5 }}>⏳ Time left: {timeLeft}s</Text>

          <RadioButton.Group onValueChange={handleAnswerChange} value={answers[currentSection]?.[currentQuestion.question] || ""}>
            {currentQuestion.options?.map((option, optIndex) => (
              <TouchableOpacity key={optIndex} onPress={() => handleAnswerChange(option)} style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
                <RadioButton value={option} />
                <Text style={{ fontSize: 16, marginLeft: 10 }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
            <TouchableOpacity onPress={handleBack} disabled={currentSectionIndex === 0 && currentQuestionIndex === 0} style={{ backgroundColor: "#ccc", padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={{ backgroundColor: "#4CAF50", padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 16, color: "#fff" }}>
                {currentSectionIndex === sections.length - 1 && currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={{ textAlign: "center", fontSize: 18 }}>No quiz available for your grade level.</Text>
      )}
    </ScrollView>
  );
};

export default Exam;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultsSection: {
    alignItems: "center",
  },
  scoreItem: {
    fontSize: 16,
    marginVertical: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  quizSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  questionBox: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timer: {
    fontSize: 16,
    color: "red",
    marginVertical: 8,
  },
  optionItem: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  noQuiz: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
});
