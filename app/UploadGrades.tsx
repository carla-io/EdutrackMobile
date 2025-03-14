import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ScrollView, Modal, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PredictionGraph from "./PredictionGraph";
import { useRouter } from "expo-router";

const UploadGrades = ({ navigation }) => {
  const [grades, setGrades] = useState({ files: [], previews: [], processed: false, warnings: [] });
  const [extractedGrades, setExtractedGrades] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadGradeLevel = async () => {
      const storedGradeLevel = await AsyncStorage.getItem("gradeLevel");
      if (storedGradeLevel) setGradeLevel(storedGradeLevel);
    };
    loadGradeLevel();
  }, []);

  useEffect(() => {
    const loadExtractedGrades = async () => {
      const storedExtractedGrades = await AsyncStorage.getItem("extractedGrades");
      if (storedExtractedGrades) setExtractedGrades(JSON.parse(storedExtractedGrades));
    };
    loadExtractedGrades();
  }, []);

  const pickImage = async () => {
    Alert.alert(
      "Upload Grades",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraPermission.status !== "granted") {
              Alert.alert("Permission Denied", "Camera access is required to take photos.");
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
            if (!result.canceled) {
              setGrades((prev) => ({
                ...prev,
                files: [...prev.files, result.assets[0]],
                previews: [...prev.previews, result.assets[0].uri],
              }));
            }
          },
        },
        {
          text: "Pick from Gallery",
          onPress: async () => {
            const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (galleryPermission.status !== "granted") {
              Alert.alert("Permission Denied", "Gallery access is required to pick images.");
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
            });
            if (!result.canceled) {
              setGrades({
                files: result.assets,
                previews: result.assets.map((asset) => asset.uri),
                processed: false,
                warnings: [],
              });
              await AsyncStorage.removeItem("extractedGrades");
              setExtractedGrades([]);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };
  

  const handleUpload = async () => {
    if (grades.files.length === 0) {
      Alert.alert("Error", "Please upload at least one grade sheet.");
      return;
    }
    setProcessing(true);
    const formData = new FormData();
    grades.files.forEach((file) => {
      formData.append("grades", { uri: file.uri, name: "grades.jpg", type: "image/jpeg" });
    });
    formData.append("gradeLevel", gradeLevel);
    try {
      const response = await axios.post("http://192.168.100.171:5001/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data) {
        const extractedData = response.data;
        if (extractedData.warning) {
          setGrades((prev) => ({ ...prev, processed: false, warnings: [extractedData.warning] }));
          Alert.alert("Warning", extractedData.warning);
          return;
        }
        setGrades((prev) => ({ ...prev, processed: true, warnings: [] }));
        await AsyncStorage.setItem("extractedGrades", JSON.stringify(extractedData));
        if (extractedData.grades && extractedData.grades.length > 0) {
          const dataForFirstFile = extractedData.grades[0].data;
          if (dataForFirstFile && dataForFirstFile.extracted_data) {
            setExtractedGrades(dataForFirstFile.extracted_data);
          }
        }
        Alert.alert("Success", "Grades processed successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process grades.");
    }
    setProcessing(false);
  };

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...extractedGrades];
    updatedGrades[index] = { ...updatedGrades[index], [field]: value };
    setExtractedGrades(updatedGrades);
    AsyncStorage.setItem("extractedGrades", JSON.stringify({ grades: [{ data: { extracted_data: updatedGrades } }] }));
  };

  const saveEditedGrades = async () => {
    try {
      const fullData = JSON.parse(await AsyncStorage.getItem("extractedGrades"));
      if (!fullData || !fullData.grades || fullData.grades.length === 0) {
        Alert.alert("Error", "No grade data available.");
        return;
      }
      await axios.post("http://192.168.100.171:5001/update-grades", { extracted_data: fullData.grades[0].data.extracted_data });
      Alert.alert("Success", "View Prediction now?");
      if (gradeLevel === "jhs" || gradeLevel === "shs") sendGradesForPrediction();
    } catch (error) {
      Alert.alert("Error", "Failed to save grades.");
    }
  };

  const sendGradesForPrediction = async () => {
    
    try {
      
      const apiEndpoint =
  gradeLevel === "jhs"
    ? "http://192.168.100.171:5001/predict-strands-jhs"
    : gradeLevel === "shs"
      ? "http://192.168.100.171:5001/predict-college-courses"
      : "http://192.168.100.171:5001/predict-strands";
  
      const response = await axios.post(apiEndpoint, { extracted_data: extractedGrades });
      console.log("Sending request to:", apiEndpoint);
      console.log("Payload:", JSON.stringify({ extracted_data: extractedGrades }));
      console.log("Prediction Response:", response.data); // Debugging
      if (response.data) {
        setPredictions(response.data);
      } else {
        setError("No predictions received. Please try again.");
      }
    } catch (err) {
      console.error("Prediction Error:", err);
      setError("Failed to fetch predictions. Please try again.");
    }
  };
  

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}>Upload Your Grade Sheet</Text>
      
      <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "maroon", padding: 10, marginVertical: 10 }}>
        <Text style={{ color: "white", textAlign: "center" }}>Choose Image</Text>
      </TouchableOpacity>
      
      {grades.previews.map((preview, index) => (
        <TouchableOpacity key={index} onPress={() => setSelectedImage(preview)}>
          <Image source={{ uri: preview }} style={{ width: 100, height: 100, margin: 5 }} />
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity onPress={handleUpload} style={{ backgroundColor: "green", padding: 10, marginVertical: 10 }}>
        <Text style={{ color: "white", textAlign: "center" }}>{processing ? "Processing..." : "Process Now"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
      onPress={() => router.push("UploadCertificate")}
      style={{ backgroundColor: "blue", padding: 10, marginVertical: 10, marginBottom: 30 }}
    >
      <Text style={{ color: "white", textAlign: "center" }}>Next Process</Text>
    </TouchableOpacity>
      
      {extractedGrades.length > 0 && extractedGrades.map((entry, index) => (
        <View key={index}>
          <TextInput value={entry.subject} onChangeText={(text) => handleGradeChange(index, "subject", text)} placeholder="Subject" />
          <TextInput value={entry.final_grade} onChangeText={(text) => handleGradeChange(index, "final_grade", text)} placeholder="Final Grade" keyboardType="numeric" />
        </View>
      ))}

      {extractedGrades.length > 0 && (
        <TouchableOpacity onPress={saveEditedGrades} style={{ backgroundColor: "orange", padding: 10, marginVertical: 10 }}>
          <Text style={{ color: "white", textAlign: "center" }}>Save Edited Grades</Text>
        </TouchableOpacity>
      )}

      {predictions && <PredictionGraph predictions={predictions} />}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {predictions ? (
  <View>
    <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginTop: 10 }}>
      Prediction Results
    </Text>
    <PredictionGraph predictions={predictions} />

    {/* Next Process Button */}
    {/* <TouchableOpacity
      onPress={() => router.push("UploadCertificate")}
      style={{ backgroundColor: "blue", padding: 10, marginVertical: 10, marginBottom: 30 }}
    >
      <Text style={{ color: "white", textAlign: "center" }}>Next Process</Text>
    </TouchableOpacity> */}
  </View>
) : (
  <Text style={{ textAlign: "center", color: "gray", marginTop: 10 }}>
    No predictions available yet.
  </Text>
)}



    </ScrollView>
  );

};

export default UploadGrades;
