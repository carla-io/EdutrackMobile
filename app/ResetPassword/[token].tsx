import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking"; // ✅ For handling deep links

const ResetPassword = () => {
  const params = useLocalSearchParams(); // ✅ Get token from route (web)
  const router = useRouter();
  const [token, setToken] = useState(params.token || ""); // Store token
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      const tokenFromUrl = url.split("/").pop(); // Extract token
      setToken(tokenFromUrl);
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

  return () => {
    subscription.remove(); // ✅ Correct way to clean up
  };
}, []);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "Please fill out all fields." });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match." });
      return;
    }

    try {
      await axios.post(`http://192.168.85.237:4000/api/auth/reset-password/${token}`, { newPassword });
      Toast.show({ type: "success", text1: "Password reset successful!" });

      setTimeout(() => router.push("/Login"), 3000);
    } catch (error) {
      Toast.show({ type: "error", text1: "Error resetting password. Please try again." });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset Password</Text>

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Reset Password</Text>
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
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "maroon",
    marginBottom: 20,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    color: "maroon",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "white",
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "maroon",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ResetPassword;
