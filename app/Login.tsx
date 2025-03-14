import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigation = useNavigation();
  const router = useRouter();

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const { email, password } = formData;

    if (!email || !password) {
      Alert.alert("🚨 Oops!", "You forgot to fill out all the fields.");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("📧 Invalid Email!", "Please enter a valid email address.");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("🔒 Weak Password!", "Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const apiUrl = `http://192.168.100.171:4000/api/auth/login`;

      const response = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "application/json" },
      });

      const { token, user } = response.data;

      // Store token & user data in AsyncStorage
      await AsyncStorage.setItem("auth-token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      Alert.alert("🎉 Success!", "Login successful!");

      // Navigate to appropriate dashboard
      if (user.role === "admin") {
        router.push("/admin/AdminDashboard");
      } else {
        router.push("/Dashboard");
      }
    } catch (error) {
      Alert.alert("😟 Login Failed!", "Please check your credentials.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LOGIN</Text>

      <Text style={styles.label}>EMAIL</Text>
      <TextInput
        style={styles.input}
        placeholder="hello@example.com"
        placeholderTextColor="#ccc"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(value) => handleChange("email", value)}
      />

      <Text style={styles.label}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        placeholder="********"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={formData.password}
        onChangeText={(value) => handleChange("password", value)}
      />

      <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.registerText}>
        New to this Site?{" "}
        <Text
          style={styles.registerLink}
          onPress={() => router.push("/Register")}
        >
          Register
        </Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "maroon",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "maroon",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "maroon",
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "black",
    fontSize: 16,
    marginBottom: 15,
  },
  forgotPassword: {
    color: "maroon",
    fontSize: 14,
    marginBottom: 20,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "maroon",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerText: {
    fontSize: 14,
    color: "maroon",
    marginTop: 20,
  },
  registerLink: {
    color: "darkred",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});

export default LoginPage;
