import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const questions = [
  "Do you enjoy working with computers and technology?",
  "Are you interested in managing businesses or finances?",
  "Do you like helping people with medical needs?",
  "Are you passionate about teaching and education?",
  "Do you enjoy designing and building things?",
  "Are you interested in law and justice?",
  "Do you like working with numbers, investments, or economics?",
  "Are you interested in journalism, writing, or public relations?",
  "Do you enjoy working with plants, animals, or environmental sustainability?",
  "Do you prefer working in a hands-on, practical environment rather than theoretical work?",
  "Are you interested in scientific research and discovery?",
  "Do you enjoy creative activities like writing, art, or design?",
  "Are you interested in politics or public service?",
  "Do you enjoy working in hospitality or tourism?",
  "Are you interested in solving crimes or working in law enforcement?",
];

const PQcollege = ({ navigation }) => {
  const [responses, setResponses] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setPrediction(null);
    setResponses({});
    setCurrentQuestion(0);
  }, []);

  const handleChange = (answer) => {
    setResponses((prev) => ({ ...prev, [questions[currentQuestion]]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post("http://192.168.62.237:5001/predict-career-pq", {
        responses,
      });

      const sanitizedData = data.predicted_careers.map((career) => ({
        ...career,
        score: Math.min(career.score, 25),
      }));

      setPrediction(sanitizedData);
      await AsyncStorage.setItem("college_pq_predict", JSON.stringify(sanitizedData))
    } catch (error) {
      setError("Error predicting career. Please try again later.");
      console.error("Error predicting career:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, backgroundColor: "#F5F5F5" }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#800000" }}>Career Prediction Questionnaire</Text>
      </View>

      {!prediction ? (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>{questions[currentQuestion]}</Text>

          <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%" }}>
            <TouchableOpacity
              onPress={() => handleChange("Yes")}
              style={{
                backgroundColor: responses[questions[currentQuestion]] === "Yes" ? "#800000" : "#DDD",
                padding: 15,
                borderRadius: 10,
                width: "40%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: responses[questions[currentQuestion]] === "Yes" ? "#FFF" : "#000" }}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleChange("No")}
              style={{
                backgroundColor: responses[questions[currentQuestion]] === "No" ? "#800000" : "#DDD",
                padding: 15,
                borderRadius: 10,
                width: "40%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: responses[questions[currentQuestion]] === "No" ? "#FFF" : "#000" }}>No</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, width: "80%" }}>
            {currentQuestion > 0 && (
              <TouchableOpacity onPress={handleBack} style={{ backgroundColor: "gray", padding: 15, borderRadius: 10 }}>
                <Text style={{ color: "#FFF" }}>Back</Text>
              </TouchableOpacity>
            )}
            {currentQuestion < questions.length - 1 ? (
              <TouchableOpacity onPress={handleNext} style={{ backgroundColor: "#800000", padding: 15, borderRadius: 10 }}>
                <Text style={{ color: "#FFF" }}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                style={{ backgroundColor: "green", padding: 15, borderRadius: 10 }}
                disabled={loading}
              >
                <Text style={{ color: "#FFF" }}>{loading ? "Submitting..." : "Submit"}</Text>
              </TouchableOpacity>
            )}
          </View>

          {error && <Text style={{ color: "red", marginTop: 20 }}>{error}</Text>}
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#800000", textAlign: "center", marginBottom: 20 }}>
            Predicted Careers:
          </Text>
          {prediction.map((career, index) => (
            <View key={index} style={{ backgroundColor: "#DDD", padding: 10, borderRadius: 10, marginBottom: 10 }}>
              <Text>{career.career}</Text>
              <Text style={{ backgroundColor: "#800000", color: "#FFF", padding: 5, borderRadius: 5, textAlign: "center" }}>
                {career.score}/25
              </Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => router.push("Exam")}
            style={{ backgroundColor: "#800000", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 20 }}
          >
            <Text style={{ color: "#FFF" }}>Go to Exam</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default PQcollege;