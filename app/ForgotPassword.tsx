import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      Toast.show({ type: "error", text1: "Please enter your email address." });
      return;
    }

    try {
      await axios.post(`https://edu-backend-mvzo.onrender.com/api/auth/request-password-reset`, { email });
      Toast.show({ type: "success", text1: "Password reset link sent! Please check your email." });
    } catch (error) {
      Toast.show({ type: "error", text1: "Error sending reset link. Try again." });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#666"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: "600",
    color: "maroon",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "white",
    color: "#333",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "maroon",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ForgotPassword;
