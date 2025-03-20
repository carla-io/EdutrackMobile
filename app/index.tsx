import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const Index = () => {
  const router = useRouter();

  const handleStartClick = () => {
    router.push("/Login");
  };

  return (
    <View style={styles.fullScreen}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Icon name="book" style={styles.icon} />
            </View>
            <Text style={styles.mainTitle}>
              Welcome to <Text style={styles.highlight}>EDUTRACKER</Text>
            </Text>
            <Text style={styles.tagline}>
              Your Smart Pathway to Success, Plan and Excel!
            </Text>
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
          <TouchableOpacity 
            style={styles.startButtonContainer} 
            onPress={handleStartClick}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8e1d2d', '#5e0f1b']}
              style={styles.startButton}
            >
              <Text style={styles.buttonText}>Start Your Journey!</Text>
              <Icon name="arrow-right" style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.yearText}>EDUTRACKER © 2025</Text>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: 'rgba(255, 209, 220, 0.85)', // Semi-transparent background
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 20,
  },
  icon: {
    fontSize: 70,
    color: "maroon",
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  highlight: {
    color: "maroon",
  },
  tagline: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    color: "maroon",
    marginBottom: 5,
  },
  featuresContainer: {
    width: "90%",
    marginBottom: 25,
  },
  featureBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 22,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: "maroon",
  },
  featureIcon: {
    fontSize: 50,
    color: "maroon",
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  featureText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    color: "#555",
  },
  startButtonContainer: {
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderRadius: 30,
    marginBottom: 30,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 10,
  },
  buttonIcon: {
    color: "white",
    fontSize: 18,
  },
  yearText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
});

export default Index;