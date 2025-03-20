import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const Contact = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Get in Touch</Text>
        <Text style={styles.heroSubtitle}>
          We're here to help with any questions about educational tracking and career guidance
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.sectionSubtitle}>
          Reach out to us through any of these channels and we'll respond as soon as possible.
        </Text>

        <View style={styles.card}>
          <FontAwesome name="phone" size={24} color="maroon" />
          <Text style={styles.cardTitle}>Phone</Text>
          <Text>(04) 298 3985 2092</Text>
          <Text>+76 209 1092 4095</Text>
        </View>

        <View style={styles.card}>
          <FontAwesome name="envelope" size={24} color="maroon" />
          <Text style={styles.cardTitle}>Email</Text>
          <Text>Edutracker@gmail.com</Text>
          <Text>support@edutracker.com</Text>
        </View>

        <View style={styles.card}>
          <FontAwesome name="map-marker" size={24} color="maroon" />
          <Text style={styles.cardTitle}>Location</Text>
          <Text>TUP Taguig Campus</Text>
          <Text>Gen. Santos Ave, Taguig, Metro Manila</Text>
        </View>

        <View style={styles.officeHours}>
          <Text style={styles.cardTitle}>Office Hours</Text>
          <Text>Monday - Friday: 8:00 AM - 5:00 PM</Text>
          <Text>Saturday: 9:00 AM - 1:00 PM</Text>
          <Text>Sunday: Closed</Text>
        </View>
      </View>

      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Need Immediate Assistance?</Text>
        <Text style={styles.ctasubtitle}>Our support team is available to help you with any urgent inquiries.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => Linking.openURL("tel:+042983985092") }>
          <FontAwesome name="phone" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Call Us Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 20 },
  heroSection: { alignItems: "center", marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  heroSubtitle: { textAlign: "center", color: "#555", marginTop: 5 },
  infoSection: { padding: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "maroon", marginBottom: 10 },
  sectionSubtitle: { color: "#555", marginBottom: 20 },
  card: { backgroundColor: "#fff", padding: 15, marginBottom: 15, borderRadius: 10, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 5 },
  officeHours: { alignItems: "center", marginTop: 20 },
  ctaSection: { alignItems: "center", marginTop: 20, padding: 15, backgroundColor: "maroon", borderRadius: 10, marginBottom: 50},
  ctaTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5, color: "white" },
  ctaButton: { flexDirection: "row", alignItems: "center", backgroundColor: "green", padding: 10, borderRadius: 5, marginTop: 10 },
  ctaButtonText: { color: "white", marginLeft: 5, fontSize: 16, fontWeight: "bold" },
  ctasubtitle: { color: "white", textAlign: "center" },
});

export default Contact;
