import React, { useEffect, useState } from "react";
import { 
  View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const Portal = () => {
  const [gradeLevel, setGradeLevel] = useState("");
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    // Retrieve user object from AsyncStorage
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setGradeLevel(parsedUser.gradeLevel || "");
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
      }
    };

    fetchUser();
  }, []);

  const handlePortalClick = async (portalType) => {
    let newGradeLevel = "";

    if (portalType === "shs") {
      if (gradeLevel === "Senior High School" || gradeLevel === "College") {
        Toast.show({ type: "error", text1: "🚫 You cannot access the SHS portal." });
        return;
      }
      newGradeLevel = "jhs";
      router.push("UploadGrades", { level: "jhs" });
    } 
    
    else if (portalType === "college") {
      if (gradeLevel === "College") {
        Toast.show({ type: "error", text1: "🚫 You cannot access the College portal." });
        return;
      }
      newGradeLevel = "shs";
      router.push("UploadGrades", { level: "shs" });
    } 
    
    else if (portalType === "career") {
      newGradeLevel = "college";
      router.push("CourseSelection", { level: "college" });
    }

    // Save grade level in AsyncStorage
    await AsyncStorage.setItem("gradeLevel", newGradeLevel);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Portal</Text>
          
          {/* Senior High School Portal */}
          <View style={styles.portal}>
            <Text style={styles.portalTitle}>For Incoming Senior High School</Text>
            <Image source={require("./assets/shs.png")} style={styles.image} />
            <TouchableOpacity style={styles.button} onPress={() => handlePortalClick("shs")}>
              <Text style={styles.buttonText}>Predict Your Strand</Text>
            </TouchableOpacity>
          </View>

          {/* College Portal */}
          <View style={styles.portal}>
            <Text style={styles.portalTitle}>For Incoming College</Text>
            <Image source={require("./assets/college.png")} style={styles.image} />
            <TouchableOpacity style={styles.button} onPress={() => handlePortalClick("college")}>
              <Text style={styles.buttonText}>Predict Your Course</Text>
            </TouchableOpacity>
          </View>

          {/* Career Portal */}
          <View style={styles.portal}>
            <Text style={styles.portalTitle}>For Your Future Career</Text>
            <Image source={require("./assets/career.png")} style={styles.image} />
            <TouchableOpacity style={styles.button} onPress={() => handlePortalClick("career")}>
              <Text style={styles.buttonText}>Predict Your Career</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Toast Notifications */}
      <Toast />
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 10,
    marginBottom: 50 // Ensures space at the bottom when scrolling
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    padding: 20,
    
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 20,
  },
  portal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  portalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  image: {
    width: 250,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Portal;
