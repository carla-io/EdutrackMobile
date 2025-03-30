import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const { email, password } = formData;

    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Oops!',
        text2: 'Please fill in all fields'
      });
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address'
      });
      return false;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    Toast.show({
      type: 'info',
      text1: 'Logging In',
      text2: 'Authenticating your credentials...'
    });

    try {
      const apiUrl = `https://edu-backend-mvzo.onrender.com/api/auth/login`;

      const response = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "application/json" },
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("auth-token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: 'Login successful'
      });

      setTimeout(() => {
        if (user.role === "admin") {
          router.push("/admin/AdminDashboard");
        } else {
          router.push("/Dashboard");
        }
      }, 1500);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Invalid email or password'
      });
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons 
          name="mail-outline" 
          size={24} 
          color="#666" 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => handleChange("email", value)}
          editable={!isLoading}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons 
          name="lock-closed-outline" 
          size={24} 
          color="#666" 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(value) => handleChange("password", value)}
          editable={!isLoading}
        />
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
        >
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity 
        onPress={() => router.push("/ForgotPassword")}
        style={styles.forgotPasswordContainer}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity 
        style={[
          styles.loginButton, 
          isLoading && styles.loginButtonDisabled
        ]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loginText}>Logging In</Text>
          </View>
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Register Link */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/Register")}>
          <Text style={styles.registerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      <Toast />
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
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    paddingHorizontal: 15,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "maroon",
    fontSize: 14,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "maroon",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "maroon",
    fontWeight: "bold",
  },
});

export default LoginPage;