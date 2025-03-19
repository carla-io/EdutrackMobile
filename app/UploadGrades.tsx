import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ScrollView, ActivityIndicator } from "react-native";
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
  const [predicting, setPredicting] = useState(false);
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
              setPredictions(null);
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
      
      Alert.alert(
        "Success", 
        "Grades saved successfully. Would you like to view the prediction now?",
        [
          {
            text: "Yes",
            onPress: () => {
              if (gradeLevel === "jhs" || gradeLevel === "shs") {
                sendGradesForPrediction();
              }
            }
          },
          {
            text: "No",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save grades.");
    }
  };

  const sendGradesForPrediction = async () => {
    setPredicting(true);
    setError(null);
    
    try {
      const apiEndpoint =
        gradeLevel === "jhs"
          ? "http://192.168.100.171:5001/predict-strands-jhs"
          : gradeLevel === "shs"
            ? "http://192.168.100.171:5001/predict-college-courses"
            : "http://192.168.100.171:5001/predict-strands";
    
      console.log("Sending request to:", apiEndpoint);
      console.log("Payload:", JSON.stringify({ extracted_data: extractedGrades }));
      
      const response = await axios.post(apiEndpoint, { extracted_data: extractedGrades });
      
      if (response.data) {
        console.log("Prediction Response:", response.data);
        setPredictions(response.data);
      } else {
        setError("No predictions received. Please try again.");
      }
    } catch (err) {
      console.error("Prediction Error:", err);
      setError("Failed to fetch predictions. Please try again.");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 15 }}>Upload Your Grade Sheet</Text>
      
      <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "maroon", padding: 12, marginVertical: 10, borderRadius: 6 }}>
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Choose Image</Text>
      </TouchableOpacity>
      
      {grades.previews.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10 }}>
          {grades.previews.map((preview, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedImage(preview)}>
              <Image source={{ uri: preview }} style={{ width: 100, height: 100, margin: 5, borderRadius: 4 }} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <TouchableOpacity 
        onPress={handleUpload} 
        style={{ 
          backgroundColor: processing ? "#a0a0a0" : "green", 
          padding: 12, 
          marginVertical: 10, 
          borderRadius: 6,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        disabled={processing}
      >
        {processing && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          {processing ? "Processing..." : "Process Now"}
        </Text>
      </TouchableOpacity>
      
      {extractedGrades.length > 0 && (
        <View style={{ marginVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Extracted Grades</Text>
          {extractedGrades.map((entry, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TextInput 
                value={entry.subject} 
                onChangeText={(text) => handleGradeChange(index, "subject", text)} 
                placeholder="Subject" 
                style={{ flex: 2, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 5, borderRadius: 4 }}
              />
              <TextInput 
                value={entry.final_grade} 
                onChangeText={(text) => handleGradeChange(index, "final_grade", text)} 
                placeholder="Final Grade" 
                keyboardType="numeric" 
                style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 }}
              />
            </View>
          ))}
          
          <TouchableOpacity 
            onPress={saveEditedGrades} 
            style={{ backgroundColor: "orange", padding: 12, marginTop: 10, borderRadius: 6 }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Save & Generate Prediction</Text>
          </TouchableOpacity>
        </View>
      )}

      {predicting && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10, textAlign: 'center' }}>Generating predictions...</Text>
        </View>
      )}

      {error && (
        <View style={{ padding: 10, backgroundColor: '#ffeeee', borderRadius: 6, marginVertical: 10 }}>
          <Text style={{ color: "red", textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {predictions ? (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 15 }}>
            Top 5 Prediction Results
          </Text>
          <PredictionGraph predictions={predictions} type={gradeLevel} />

          <TouchableOpacity
            onPress={() => router.push("UploadCertificate")}
            style={{ backgroundColor: "blue", padding: 12, marginVertical: 20, borderRadius: 6 }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Next Process</Text>
          </TouchableOpacity>
        </View>
      ) : extractedGrades.length > 0 ? (
        <Text style={{ textAlign: "center", color: "gray", marginTop: 20, marginBottom: 10 }}>
          Save grades and generate prediction to view results.
        </Text>
      ) : null}

{/* <TouchableOpacity
            onPress={() => router.push("UploadCertificate")}
            style={{ backgroundColor: "blue", padding: 12, marginVertical: 20, borderRadius: 6 }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Next Process</Text>
          </TouchableOpacity> */}
    </ScrollView>
  );
};

export default UploadGrades;