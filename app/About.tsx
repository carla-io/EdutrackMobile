import React from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Import images
const bookImage = require("./assets/books-icon.jpg");
const charlesImage = require("./assets/charles.png");
const christianImage = require("./assets/chan.jpg");
const carlaImage = require("./assets/carla.jpg");
const johnImage = require("./assets/josue.jpg");

const teamMembers = [
  { name: "CHARLES DERICK BULANTE", role: "Documentation / UI Design Developer", image: charlesImage },
  { name: "CHRISTIAN SALAGUBANG", role: "Leader, Documentation, UI Design / Frontend Developer", image: christianImage },
  { name: "CARLA DASAL", role: "Full Stack Developer", image: carlaImage },
  { name: "JOHN LAWRENCE JOSUE", role: "Full Stack Developer", image: johnImage },
];

const About = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.aboutContent}>
        <View style={styles.textContent}>
          <Text style={styles.title}>What is EDUTRACKER?</Text>
          <Text style={styles.description}>
            Welcome to EduTracker, your ultimate partner in shaping brighter futures! We are a cutting-edge predictive analysis
            platform designed to empower students in discovering their ideal strands, courses, and career paths.
          </Text>
          <Text style={styles.description}>
            At EduTracker, we believe every student deserves personalized guidance to unlock their full potential.
          </Text>
        </View>
        <Image source={bookImage} style={styles.bookImage} resizeMode="contain" />
      </View>

      <Text style={styles.sectionTitle}>WHAT OUR WEBSITE OFFERS...</Text>
      <View style={styles.offerItem}>
        <FontAwesome name="bullseye" style={styles.offerIcon} />
        <Text style={styles.offerText}>Smart Career and Course Prediction</Text>
      </View>
      <View style={styles.offerItem}>
        <FontAwesome name="camera" style={styles.offerIcon} />
        <Text style={styles.offerText}>Grades and Seminar Image Processing</Text>
      </View>
      <View style={styles.offerItem}>
        <FontAwesome name="gamepad" style={styles.offerIcon} />
        <Text style={styles.offerText}>Interactive and Easy-to-Use!</Text>
      </View>

      <Text style={styles.sectionTitle}>MEET THE TEAM</Text>
      <View style={styles.teamContainer}>
        {teamMembers.map((member, index) => (
          <View key={index} style={styles.teamMember}>
            <Image source={member.image} style={styles.teamImage} />
            <Text style={styles.teamName}>{member.name}</Text>
            <Text style={styles.teamRole}>{member.role}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 20, backgroundColor: "white" },
  aboutContent: { flexDirection: "column", alignItems: "center", marginBottom: 20 },
  textContent: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", textTransform: "uppercase", borderBottomWidth: 2, borderBottomColor: "maroon", paddingBottom: 5, marginBottom: 10 },
  description: { fontSize: 16, textAlign: "center", marginBottom: 10 },
  bookImage: { width: 200, height: 200, borderRadius: 10 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", textTransform: "uppercase", borderBottomWidth: 2, borderBottomColor: "maroon", marginTop: 20, marginBottom: 20 },
  offerItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", padding: 10, borderRadius: 10, marginBottom: 10, width: "90%" },
  offerIcon: { fontSize: 30, color: "maroon", marginRight: 10 },
  offerText: { fontSize: 16, fontWeight: "bold" },
  teamContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  teamMember: { alignItems: "center", margin: 10 },
  teamImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: "maroon" },
  teamName: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
  teamRole: { fontSize: 12, textAlign: "center", color: "gray" },
});

export default About;
