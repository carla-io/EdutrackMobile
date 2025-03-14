import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { router } from "expo-router";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gradeLevel: "",
  });

  const [image, setImage] = useState<string | null>(null);
  const gradeLevels = ["Junior High School", "Senior High School", "College"];

  // Handle input changes
  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Image Picker
  const handleImageChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
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
      Toast.show({ type: "error", text1: "⚠️ Name is required!" });
      return false;
    }
    if (!formData.email.trim()) {
      Toast.show({ type: "error", text1: "📧 Email is required!" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Toast.show({ type: "error", text1: "❌ Invalid email format!" });
      return false;
    }
    if (!formData.password) {
      Toast.show({ type: "error", text1: "🔒 Password is required!" });
      return false;
    }
    if (formData.password.length < 6) {
      Toast.show({ type: "error", text1: "🔑 Password must be at least 6 characters!" });
      return false;
    }
    if (!formData.gradeLevel) {
      Toast.show({ type: "error", text1: "📚 Please select your grade level!" });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

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
        `http://192.168.100.171:4000/api/auth/register`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Registration successful:", response.data);

      Toast.show({
        type: "success",
        text1: "📩 Registration Successful! Check your email to verify.",
      });

      router.push("/Login");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "🚨 Registration Failed",
        text2: error.response?.data?.message || "Please try again.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create New Account</Text>
      <Text style={styles.linkText}>
        Already Registered?{" "}
        <Text style={styles.link} onPress={() => router.push("/Login")}>
          Login
        </Text>
      </Text>

      <TextInput
        placeholder="John Doe"
        style={styles.input}
        onChangeText={(text) => handleChange("name", text)}
        value={formData.name}
      />
      <TextInput
        placeholder="hello@example.com"
        style={styles.input}
        keyboardType="email-address"
        onChangeText={(text) => handleChange("email", text)}
        value={formData.email}
      />
      <TextInput
        placeholder="********"
        style={styles.input}
        secureTextEntry
        onChangeText={(text) => handleChange("password", text)}
        value={formData.password}
      />

      {/* Grade Level Picker */}
      <Picker
        selectedValue={formData.gradeLevel}
        onValueChange={(itemValue) => handleChange("gradeLevel", itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Grade Level" value="" />
        {gradeLevels.map((level, index) => (
          <Picker.Item key={index} label={level} value={level} />
        ))}
      </Picker>

      {/* Image Upload */}
      <TouchableOpacity onPress={handleImageChange} style={styles.imageUpload}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imageText}>Upload Profile Picture</Text>
        )}
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Toast Notification */}
      <Toast />
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7b1111",
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    color: "#7b1111",
    marginBottom: 20,
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#7b1111",
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#7b1111",
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#7b1111",
    padding: 12,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageUpload: {
    width: 150,
    height: 150,
    borderWidth: 1,
    borderColor: "#7b1111",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
  },
  imageText: {
    color: "#7b1111",
    textAlign: "center",
  },
});
