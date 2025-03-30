import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, StyleSheet, Alert, ScrollView,  Dimensions   } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { BarChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const UploadCertificates = () => {
  const [certificates, setCertificates] = useState({
    files: [],
    previews: [],
    processed: false,
    warnings: [],
    extractedKeywords: [],
  });
  const [processing, setProcessing] = useState(false);
  const [predictionData, setPredictionData] = useState([]);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const router = useRouter();
  const [gradeLevel, setGradeLevel] = useState("");

  const screenWidth = Dimensions.get("window").width - 40;

  useEffect(() => {
    const loadGradeLevel = async () => {
      try {
        const storedGradeLevel = await AsyncStorage.getItem("gradeLevel");
        if (storedGradeLevel !== null) {
          console.log("Loaded gradeLevel from storage:", storedGradeLevel);
          setGradeLevel(storedGradeLevel);
        } else {
          console.warn("No gradeLevel found in storage.");
        }
      } catch (error) {
        console.error("Error retrieving gradeLevel:", error);
      }
    };
    loadGradeLevel();
  }, []);

  const saveGradeLevel = async (level) => {
    try {
      await AsyncStorage.setItem("gradeLevel", level);
      console.log("GradeLevel saved:", level);
    } catch (error) {
      console.error("Error saving gradeLevel:", error);
    }
  };
  
  const handleFileChange = async () => {
    Alert.alert("Upload Option", "Choose an option", [
      {
        text: "Gallery",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
          });
          processFiles(result);
        },
      },
      {
        text: "Camera",
        onPress: async () => {
          let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          processFiles(result);
        },
      },
    ]);
  };

  const processFiles = (result) => {
    if (result.canceled || !result.assets) return;
  
    const files = result.assets.slice(0, 10);
    setCertificates({
      files,
      previews: files.map((file) => file.uri),
      processed: false,
      warnings: [],
      extractedKeywords: [],
    });
    setPredictionData([]);
  };
  
  const handleUpload = async () => {
    if (certificates.files.length === 0) {
      Alert.alert("Please upload at least one certificate.");
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    certificates.files.forEach((file) => {
      formData.append("certificates", {
        uri: file.uri,
        name: file.uri.split("/").pop() || "certificate.jpg",
        type: file.mimeType || "image/jpeg",
      });          
    });

    try {
      const response = await axios.post("http://192.168.62.237:5001/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.certificates) {
        const extractedKeywords = response.data.certificates.flatMap(
          (cert) => cert.extracted_keywords || []
        );

        setCertificates((prev) => ({
          ...prev,
          processed: true,
          warnings: response.data.certificates.filter((item) => item.warning || item.error) || [],
          extractedKeywords: extractedKeywords,
        }));

        await AsyncStorage.setItem("extractedCertificates", JSON.stringify(response.data.certificates));
        await AsyncStorage.setItem("extractedKeywords", JSON.stringify(extractedKeywords));

        predictStrand(extractedKeywords);
      } else {
        alert("Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error processing certificates:", error);
      alert("Error processing certificates.");
    }

    setProcessing(false);
  };

  const predictStrand = async (keywords) => {
    if (!gradeLevel) {
      console.error("Grade level is not available yet.");
      alert("Grade level is missing. Please check your settings.");
      return;
    }
    
    const endpoint =
      gradeLevel === "jhs"
        ? "http://192.168.62.237:5001/predict-strand-cert"
        : gradeLevel === "shs"
        ? "http://192.168.62.237:5001/predict-college-cert"
        : null;
    
    if (!endpoint) {
      console.error("Invalid grade level:", gradeLevel);
      alert("Invalid grade level. Please check your selection.");
      return;
    }
    
    console.log("Sending request to:", endpoint, { keywords, gradeLevel });
    
    try {
      const response = await axios.post(endpoint, { keywords, grade_level: gradeLevel });
      console.log("Received response from backend:", response.data);
    
      const result = response.data.strand_prediction || response.data.college_course_prediction;
      if (!result) {
        console.error("Invalid response format:", response.data);
        alert("Invalid prediction response.");
        return;
      }
    
      // Transform data and get top 5 strands based on score
      const allData = Object.keys(result).map((key) => ({
        strand: key,
        score: result[key],
      }));
      
      // Sort by score in descending order and take top 5
      const topFiveData = allData
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      setPredictionData(topFiveData);
      setError(null);
    } catch (error) {
      console.error("Error predicting SHS/College strand:", error);
      setError("Failed to fetch predictions. Please try again.");
    }
  };
    
  const handleProceedToPQ = async () => {
    try {
      const storedGradeLevel = await AsyncStorage.getItem("gradeLevel");
      if (!storedGradeLevel) {
        alert("Grade level not found. Please set it before proceeding.");
        return;
      }
      
      router.push(
        storedGradeLevel === "jhs"
          ? "/personal-question-jhs"
          : storedGradeLevel === "shs"
          ? "/personal-question-shs"
          : storedGradeLevel === "college"
          ? "/personal-question-college"
          : "/default-route"
      );
    } catch (error) {
      console.error("Error retrieving gradeLevel for navigation:", error);
    }
  };

  const formatLabel = (label) => {
    // Truncate long labels and add ellipsis
    return label.length > 10 ? label.substring(0, 8) + '...' : label;
  };
    
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Upload Your Certificates (Max 10 Files)</Text>
        
        <TouchableOpacity style={styles.uploadButton} onPress={handleFileChange}>
          <Text style={styles.uploadButtonText}>Choose File</Text>
        </TouchableOpacity>
  
        <FlatList
          data={certificates.previews}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.previewImage} />
          )}
        />
        
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={processing}>
          <Text style={styles.uploadButtonText}>{processing ? "Processing..." : "Upload & Process"}</Text>
        </TouchableOpacity>
  
        {certificates.processed && (
          <View>
            <Text style={styles.subtitle}>Extracted Keywords:</Text>
            <FlatList
              data={certificates.extractedKeywords}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => <Text style={styles.keyword}>{item}</Text>}
            />
          </View>
        )}
  
        {predictionData.length > 0 && (
          <View>
            <Text style={styles.subtitle}>Top 5 Prediction Results</Text>
            <BarChart
              data={{
                labels: predictionData.map((d) => formatLabel(d.strand)),
                datasets: [{ data: predictionData.map((d) => d.score) }],
              }}
              width={screenWidth}
              height={250}
              yAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: "#f9f9f9",
                backgroundGradientTo: "#ffffff",
                color: (opacity = 1) => `rgba(34, 128, 176, ${opacity})`,
                barPercentage: 0.5,  // Reduced from 0.7 to create more space between bars
                labelRotation: -45,  // Rotate labels to prevent overlap
                decimalPlaces: 1,    // Limit decimal places in values
                propsForLabels: {
                  fontSize: 10,      // Smaller font size for labels
                },
              }}
              showValuesOnTopOfBars={true}
              fromZero={true}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            
            {/* Legend to show full strand names */}
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Legend:</Text>
              {predictionData.map((item, index) => (
                <Text key={index} style={styles.legendItem}>
                  {formatLabel(item.strand)}: {item.strand}
                </Text>
              ))}
            </View>
          </View>
        )}
  
        {certificates.processed && (
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToPQ}>
            <Text style={styles.proceedButtonText}>Proceed to Personal Questionnaire ➡️</Text>
          </TouchableOpacity>
        )}
        {/* You had a duplicate button here - removed the duplicate */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  uploadButton: { backgroundColor: "maroon", padding: 10, borderRadius: 5, alignItems: "center", marginBottom: 20 },
  uploadButtonText: { color: "#fff", fontSize: 16 },
  previewImage: { width: 100, height: 100, margin: 5, borderRadius: 5 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginTop: 20 },
  keyword: { fontSize: 14, padding: 5 },
  proceedButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  legendContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  legendTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  legendItem: {
    fontSize: 12,
    marginBottom: 3,
  },
});

export default UploadCertificates;