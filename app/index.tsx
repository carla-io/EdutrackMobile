import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const Index = () => {
  const router = useRouter();

  const handleStartClick = () => {
    router.push("/Login");
  };

  return (
    <View style={styles.fullScreen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Icon name="book" style={styles.icon} />
          <Text style={styles.mainTitle}>
            Welcome to <Text style={styles.highlight}>EDUTRACKER</Text>
          </Text>
          <Text style={styles.tagline}>
            Your Smart Pathway to Success, Plan and Excel!
          </Text>
          <Text style={styles.yearText}>EDUTRACKER @ 2025</Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureBox}>
            <MaterialIcon name="quiz" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Take the Quiz</Text>
            <Text style={styles.featureText}>
              Be yourself and answer honestly to get the best recommendation for your academic or career path.
            </Text>
          </View>

          <View style={styles.featureBox}>
            <Icon name="graduation-cap" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Get Your Results</Text>
            <Text style={styles.featureText}>
              Discover the SHS strand, college course, or career options that match your interests and skills.
            </Text>
          </View>

          <View style={styles.featureBox}>
            <Icon name="laptop" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Plan Your Future</Text>
            <Text style={styles.featureText}>
              Use your results to explore schools, scholarships, and career opportunities that fit your potential.
            </Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartClick}>
          <Text style={styles.buttonText}>Start Your Journey!</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#FFD1DC", // Full-screen background
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 80,
    color: "maroon",
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  highlight: {
    color: "maroon",
  },
  tagline: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    color: "maroon",
  },
  yearText: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 5,
  },
  featuresContainer: {
    width: "90%",
  },
  featureBox: {
    backgroundColor: "#ffb3d9",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 50,
    color: "black",
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  featureText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  startButton: {
    backgroundColor: "#800000",
    paddingVertical: 15,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40, // Ensures space at the bottom for scrolling
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Index;
