import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, ToastAndroid, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadioButton } from "react-native-paper";
import { BarChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import shsQuiz from './shsquiz.json';
import collegeQuiz from './collegequiz.json';
import careerQuiz from './careerquiz.json';

const Exam = ({ navigation }) => {
  const [examQuestions, setExamQuestions] = useState([]);
  const [gradeLevel, setGradeLevel] = useState('');
  const [quizData, setQuizData] = useState({});
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [examCompleted, setExamCompleted] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [reloadGraph, setReloadGraph] = useState(false);
  const router = useRouter();
  
  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

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
          } else if (storedGradeLevel === "college") {
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
    let countdown;
    
    if (!examCompleted && Object.keys(quizData).length > 0) {
      const sections = Object.keys(quizData);
      const currentSection = sections[currentSectionIndex];
      const questions = quizData[currentSection]?.quiz || [];
      const currentQuestion = questions[currentQuestionIndex];
      
      if (currentQuestion) {
        setTimeLeft(15); // Reset timer for each question
    
        const firstOption = currentQuestion.options?.[0] || currentQuestion.choices?.[0];
    
        if (firstOption) {
          setAnswers((prev) => ({
            ...prev,
            [currentSection]: {
              ...prev[currentSection],
              [currentQuestion.question]: firstOption,
            },
          }));
        }
    
        // Countdown timer
        countdown = setInterval(() => {
          setTimeLeft((prev) => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(countdown);
              // Using setTimeout to ensure state updates complete before navigation
              setTimeout(() => {
                handleNext();
              }, 100);
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }
    }
  
    return () => {
      if (countdown) {
        clearInterval(countdown);
      }
    }; // Clear timer when component unmounts or question changes
  }, [currentQuestionIndex, currentSectionIndex, examCompleted, quizData]);
  
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
    const sections = Object.keys(quizData);
    const currentSection = sections[currentSectionIndex];
    const questions = quizData[currentSection]?.quiz || [];
    
    if (!answers[currentSection]?.[questions[currentQuestionIndex]?.question]) {
      // If no answer is selected, use the first option as default
      const currentQuestion = questions[currentQuestionIndex];
      const firstOption = currentQuestion?.options?.[0] || currentQuestion?.choices?.[0];
      
      if (firstOption) {
        setAnswers((prev) => ({
          ...prev,
          [currentSection]: {
            ...prev[currentSection],
            [currentQuestion.question]: firstOption,
          },
        }));
      } else {
        showToast('⚠️ Please select an answer before proceeding!');
        return;
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
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
    const storedScores = await AsyncStorage.getItem("examScores");
    const gradeLevel = await AsyncStorage.getItem("gradeLevel");

    if (!storedScores) {
      ToastAndroid.show("⚠️ No exam scores found!", ToastAndroid.SHORT);
      return;
    }

    let endpoint = "";

    // Determine API endpoint based on grade level
    if (gradeLevel === "jhs") {
      endpoint = "http://192.168.100.171:5001/predict_exam_jhs";
    } else if (gradeLevel === "shs") {
      endpoint = "http://192.168.100.171:5001/prediction_exam_shs";
    } else if (gradeLevel === "college") {
      endpoint = "http://192.168.100.171:5001/prediction_exam_college";
    } else {
      ToastAndroid.show("⚠️ Invalid grade level!", ToastAndroid.SHORT);
      return;
    }

    // Send data to backend
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scores: JSON.parse(storedScores) }), // Parse storedScores before sending
    });

    const result = await response.json();

    if (response.ok) {
      // Save prediction results in AsyncStorage
      if (gradeLevel === "jhs") {
        await AsyncStorage.setItem("prediction_exam_jhs", JSON.stringify(result.strand_percentages));
        setPrediction(result.strand_percentages);
      } else if (gradeLevel === "shs") {
        await AsyncStorage.setItem("prediction_exam_shs", JSON.stringify(result.course_percentages));
        setPrediction(result.course_percentages);
      } else if (gradeLevel === "college") {
        await AsyncStorage.setItem("prediction_exam_college", JSON.stringify(result.career_percentages));
        setPrediction(result.career_percentages);
      }
    } else {
      ToastAndroid.show("⚠️ Error in prediction!", ToastAndroid.SHORT);
    }
  } catch (error) {
    ToastAndroid.show("⚠️ Network error!", ToastAndroid.SHORT);
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
      }
      else if (gradeLevel === "college") {
        endpoint = "http://192.168.100.171:5001/prediction_exam_college";
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
        }  else if (gradeLevel === "college") {
          await AsyncStorage.setItem("prediction_exam_college", JSON.stringify(result.career_percentages));
          setPrediction(result.career_percentages); }
        console.log("Updated prediction:", result); // Optional: Log result to the console
      } else {
        showToast("⚠️ Error in prediction!");
      }
    } catch (error) {
      showToast("⚠️ Network error!");
      console.error("Error during prediction:", error);
    }
  };

  // const handleBack = () => {
  //   if (currentQuestionIndex > 0) {
  //     setCurrentQuestionIndex(currentQuestionIndex - 1);
  //   } else if (currentSectionIndex > 0) {
  //     setCurrentSectionIndex(currentSectionIndex - 1);
  //     setCurrentQuestionIndex(quizData[Object.keys(quizData)[currentSectionIndex - 1]].quiz.length - 1);
  //   }
  // };

  // Get color for chart legend
  const getColorForIndex = (index) => {
    const colors = [
      'rgba(71, 130, 218, 1)',
      'rgba(245, 130, 49, 1)',
      'rgba(59, 174, 159, 1)',
      'rgba(204, 87, 120, 1)',
      'rgba(156, 115, 220, 1)'
    ];
    return colors[index % colors.length];
  };

  // Prepare data for the improved chart
  const prepareChartData = () => {
    if (!prediction) return null;
    
    // Get the top 5 predictions for better visualization
    const entries = Object.entries(prediction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Take top 5 for readability
    
    // Create shortened labels for better display
    const labels = entries.map(([key]) => {
      // Shorten long labels to fit better on the chart
      return key.length > 10 ? key.substring(0, 10) + '...' : key;
    });
    
    // Extract the values
    const data = entries.map(([_, value]) => value);
    
    return {
      labels,
      datasets: [
        {
          data,
          // Use colors that stand out
          colors: [
            (opacity = 1) => `rgba(71, 130, 218, ${opacity})`,
            (opacity = 1) => `rgba(245, 130, 49, ${opacity})`,
            (opacity = 1) => `rgba(59, 174, 159, ${opacity})`,
            (opacity = 1) => `rgba(204, 87, 120, ${opacity})`,
            (opacity = 1) => `rgba(156, 115, 220, ${opacity})`,
          ]
        }
      ]
    };
  };

  // Enhanced chart config
  const chartConfig = {
    backgroundGradientFrom: "white",
    backgroundGradientTo: "white",
    color: (opacity = 1) => `rgba(0, 104, 116, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 1,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: "bold",
    },
    propsForVerticalLabels: {
      rotation: 45,
      fontSize: 12,
      fontWeight: "bold",
    },
    formatYLabel: (value) => `${parseFloat(value).toFixed(1)}%`,
  };

  const sections = Object.keys(quizData);
  const currentSection = sections[currentSectionIndex];
  const questions = quizData[currentSection]?.quiz || [];
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Welcome to Your {gradeLevel?.toUpperCase()} Exam
        </Text>
      </View>

      {examCompleted ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Exam Completed! 🎉</Text>
          <Text style={styles.sectionTitle}>Your Scores per Category:</Text>
          
          {Object.entries(scores).map(([section, score], index) => (
            <View key={index} style={styles.scoreRow}>
              <Text style={styles.sectionLabel}>{section}:</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => {
              if (gradeLevel === "jhs") {
                router.push("GraphJhs");
              } else if (gradeLevel === "shs") {
                router.push("GraphShs");
              } else {
                router.push("GraphCollege");
              }
            }}
            style={styles.viewResultsButton}
          >
            <Text style={styles.buttonText}>View Results (Graph)</Text>
          </TouchableOpacity>

          {/* Improved chart display */}
          {prediction && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Prediction Results</Text>
              
              {/* Legend for top 5 items */}
              <View style={styles.legendContainer}>
                {Object.entries(prediction)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([key, value], index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: getColorForIndex(index) }]} />
                      <Text style={styles.legendText}>
                        {key}: {value.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
              </View>
              
              <BarChart
                data={prepareChartData()}
                width={screenWidth - 40}
                height={300}
                yAxisLabel=""
                yAxisSuffix="%"
                showValuesOnTopOfBars={true}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={30}
                fromZero={true}
              />
              
              <Text style={styles.chartNotes}>Top 5 predictions shown</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.buttonText}>Generate Prediction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reloadGraphHandler}
            style={styles.reloadButton}
          >
            <Text style={styles.buttonText}>Reload Graph</Text>
          </TouchableOpacity>
        </View>
      ) : sections.length > 0 ? (
        <View style={styles.quizContainer}>
          <Text style={styles.sectionTitle}>{currentSection}</Text>
          <Text style={styles.questionText}>{currentQuestionIndex + 1}. {currentQuestion?.question}</Text>
          <Text style={styles.timerText}>⏳ Time left: {timeLeft}s</Text>

          <RadioButton.Group onValueChange={handleAnswerChange} value={answers[currentSection]?.[currentQuestion.question] || ""}>
            {currentQuestion.options?.map((option, optIndex) => (
              <TouchableOpacity 
                key={optIndex} 
                onPress={() => handleAnswerChange(option)} 
                style={styles.optionRow}
              >
                <RadioButton 
                  value={option} 
                  color="#4CAF50"
                />
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>

          <View style={styles.navigationButtons}>
            {/* <TouchableOpacity 
              onPress={handleBack} 
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0} 
              style={[
                styles.backButton, 
                (currentSectionIndex === 0 && currentQuestionIndex === 0) && styles.disabledButton
              ]}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity> */}
            
            <TouchableOpacity 
              onPress={handleNext} 
              style={styles.nextButton}
            >
              <Text style={styles.buttonText}>
                {currentSectionIndex === sections.length - 1 && currentQuestionIndex === questions.length - 1 
                  ? "Finish" 
                  : "Next"
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.noQuizText}>No quiz available for your grade level.</Text>
      )}
    </ScrollView>
  );
};

// Helper function for chart colors
const getColorForIndex = (index) => {
  const colors = [
    '#4782DA', // Blue
    '#F58231', // Orange
    '#3BAE9F', // Teal
    '#CC5778', // Pink
    '#9C73DC'  // Purple
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "white"
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 15
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333"
  },
  resultContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#4CAF50"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: "#333"
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  sectionLabel: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#444"
  },
  scoreValue: {
    fontSize: 16,
    color: "#4CAF50"
  },
  chartContainer: {
    marginTop: 25,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333"
  },
  chart: {
    marginVertical: 10,
    borderRadius: 12,
    padding: 10
  },
  legendContainer: {
    marginBottom: 15
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8
  },
  legendText: {
    fontSize: 14,
    color: "#333"
  },
  chartNotes: {
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 12,
    color: "#666",
    marginTop: 5
  },
  viewResultsButton: {
    marginTop: 20,
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  reloadButton: {
    marginTop: 12,
    backgroundColor: "#FF9800",
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff"
  },
  quizContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  questionText: {
    fontSize: 18,
    marginBottom: 10,
    lineHeight: 24,
    color: "#333"
  },
  timerText: {
    fontSize: 16,
    color: "#f44336",
    marginVertical: 10,
    fontWeight: "bold"
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9"
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    color: "#333"
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25
  },
  backButton: {
    backgroundColor: "#e0e0e0",
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center"
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555"
  },
  nextButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center"
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7
  },
  noQuizText: {
    textAlign: "center",
    fontSize: 18,
    color: "#999",
    marginTop: 50
  }
});

export default Exam;