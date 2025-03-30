import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gradeLevel: "",
  });

  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const gradeLevels = ["Junior High School", "Senior High School", "College"];

  // Handle input changes
  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Image Picker
  const handleImageChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Gallery access is required to upload profile picture'
      });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Validate input fields
  const validateForm = () => {
    if (!formData.name.trim()) {
      Toast.show({ 
        type: "error", 
        text1: "Name Required", 
        text2: "Please enter your full name" 
      });
      return false;
    }
    if (!formData.email.trim()) {
      Toast.show({ 
        type: "error", 
        text1: "Email Required", 
        text2: "Please enter your email address" 
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Toast.show({ 
        type: "error", 
        text1: "Invalid Email", 
        text2: "Please enter a valid email address" 
      });
      return false;
    }
    if (!formData.password) {
      Toast.show({ 
        type: "error", 
        text1: "Password Required", 
        text2: "Please create a password" 
      });
      return false;
    }
    if (formData.password.length < 6) {
      Toast.show({ 
        type: "error", 
        text1: "Weak Password", 
        text2: "Password must be at least 6 characters" 
      });
      return false;
    }
    if (!formData.gradeLevel) {
      Toast.show({ 
        type: "error", 
        text1: "Grade Level Required", 
        text2: "Please select your grade level" 
      });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    Toast.show({
      type: 'info',
      text1: 'Creating Account',
      text2: 'Please wait while we process your registration'
    });

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("gradeLevel", formData.gradeLevel);

    if (image) {
      data.append("profilePicture", {
        uri: image,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);
    }

    try {
      const response = await axios.post(
        `https://edu-backend-mvzo.onrender.com/api/auth/register`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Toast.show({
        type: "success",
        text1: "Registration Successful",
        text2: "Check your email to verify your account"
      });

      // Small delay to show success toast
      setTimeout(() => {
        router.push("/Login");
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: error.response?.data?.message || "Please try again"
      });
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Create New Account</Text>
      <Text style={styles.subHeading}>
        Already Registered?{" "}
        <Text style={styles.link} onPress={() => router.push("/Login")}>
          Login
        </Text>
      </Text>

      <TouchableOpacity 
        onPress={handleImageChange} 
        style={styles.imageUpload}
        disabled={isLoading}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imageUploadContent}>
            <Ionicons 
              name="camera-outline" 
              size={36} 
              color="#7b1111" 
            />
            <Text style={styles.imageText}>Upload Profile Picture</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Ionicons 
          name="person-outline" 
          size={24} 
          color="#7b1111" 
          style={styles.inputIcon} 
        />
        <TextInput
          placeholder="Full Name"
          style={styles.input}
          onChangeText={(text) => handleChange("name", text)}
          value={formData.name}
          editable={!isLoading}
        />
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons 
          name="mail-outline" 
          size={24} 
          color="#7b1111" 
          style={styles.inputIcon} 
        />
        <TextInput
          placeholder="Email Address"
          style={styles.input}
          keyboardType="email-address"
          onChangeText={(text) => handleChange("email", text)}
          value={formData.email}
          editable={!isLoading}
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons 
          name="lock-closed-outline" 
          size={24} 
          color="#7b1111" 
          style={styles.inputIcon} 
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry={!showPassword}
          onChangeText={(text) => handleChange("password", text)}
          value={formData.password}
          editable={!isLoading}
        />
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
        >
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={24} 
            color="#7b1111" 
          />
        </TouchableOpacity>
      </View>

      {/* Grade Level Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.gradeLevel}
          onValueChange={(itemValue) => handleChange("gradeLevel", itemValue)}
          style={styles.picker}
          enabled={!isLoading}
        >
          <Picker.Item label="Select Grade Level" value="" color="#999" />
          {gradeLevels.map((level, index) => (
            <Picker.Item 
              key={index} 
              label={level} 
              value={level} 
              color="#7b1111" 
            />
          ))}
        </Picker>
      </View>

      {/* Image Upload */}
      

      {/* Submit Button */}
      <TouchableOpacity 
        onPress={handleSubmit} 
        style={[
          styles.button, 
          isLoading && styles.buttonDisabled
        ]}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Signing Up..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      {/* Toast Notification */}
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7b1111",
    marginBottom: 10,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 14,
    color: "#7b1111",
    marginBottom: 20,
    textAlign: "center",
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
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
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
  },
  imageUpload: {
    width: 150,
    height: 150,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageUploadContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imageText: {
    color: "#7b1111",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#7b1111",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Register;