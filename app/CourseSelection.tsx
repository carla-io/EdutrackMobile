import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";

const courses = [
  "BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering",
  "BS Electronics Engineering", "BS Industrial Engineering", "BS Aerospace Engineering",
  "BS Nursing", "BS Medical Technology", "BS Pharmacy", "BS Radiologic Technology",
  "BS Physical Therapy", "Doctor of Medicine", "BS Midwifery", "BS Nutrition and Dietetics",
  "BS Computer Science", "BS Information Technology", "BS Software Engineering",
  "BS Data Science", "BS Game Development", "BS Cybersecurity", "BS Artificial Intelligence",
  "BS Business Administration", "BS Accountancy", "BS Marketing Management",
  "BS Financial Management", "BS Economics", "BS Entrepreneurship", "BS Human Resource Management",
  "BA Political Science", "BA Psychology", "BA Sociology", "BA Literature",
  "BA Philosophy", "BA Communication", "BA Creative Writing",
  "Bachelor of Laws (LLB)", "BS Criminology", "BS Legal Management", "BS Public Administration",
  "BA International Relations", "BA Political Science (Pre-Law)",
  "BS Elementary Education", "BS Secondary Education Major in Mathematics",
  "BS Secondary Education Major in Science", "BS Special Education",
  "BS Physical Education", "BS Early Childhood Education",
  "BS Biology", "BS Chemistry", "BS Physics", "BS Environmental Science",
  "BS Applied Mathematics", "BS Statistics", "BS Biochemistry",
  "BS Hotel & Restaurant Management", "BS Tourism Management", "BS Culinary Arts",
  "BS Travel Management", "BS Hospitality Management", "BS Cruise Line Operations",
  "BS Agriculture", "BS Forestry", "BS Environmental Management",
  "BS Fisheries", "BS Agricultural Engineering", "BS Agribusiness"
];

const courseOptions = courses.map(course => ({ label: course, value: course }));

const CourseSelection = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [predictedCareers, setPredictedCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    console.log("Course Selection Page Loaded");
  }, []);

  const handleSubmit = async () => {
    if (!selectedCourse) {
      Toast.show({ type: "error", text1: "Please select a course!" });
      return;
    }

    setLoading(true);
    setPredictedCareers([]);
    
    try {
      setTimeout(async () => {
        const response = await axios.post("http://192.168.100.171:5001/api/predict-career", {
          course: selectedCourse,
        });

        const newCareers = response.data.careers.map(career => ({ career, score: 25 }));
        await AsyncStorage.setItem("college_course_predict", JSON.stringify(newCareers));
        
        setPredictedCareers(response.data.careers);
        Toast.show({ type: "success", text1: "Career prediction successful!" });
        setLoading(false);
      }, 5000);
    } catch (error) {
      console.error("Error predicting careers:", error);
      Toast.show({ type: "error", text1: "Failed to predict careers." });
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Your Course for Career Prediction</Text>

      <RNPickerSelect
        onValueChange={setSelectedCourse}
        items={courseOptions}
        placeholder={{ label: "Search or select a course...", value: null }}
        style={pickerSelectStyles}
      />

      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Predict Careers</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text>Analyzing your course and predicting careers...</Text>
        </View>
      )}

      {predictedCareers.length > 0 && !loading && (
        <View style={styles.predictedCareers}>
          <Text style={styles.subHeader}>Possible Careers:</Text>
          {predictedCareers.map((career, index) => (
            <Text key={index} style={styles.careerItem}>{career}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.navigate("UploadCertificatesCollege")} style={styles.uploadButton}>
        <Text style={styles.buttonText}>Upload Certificates</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    backgroundColor: "white",
    marginBottom: 50,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  predictedCareers: {
    marginTop: 20,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  careerItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  uploadButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    color: "black",
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    color: "black",
    marginBottom: 10,
  },
};

export default CourseSelection;
