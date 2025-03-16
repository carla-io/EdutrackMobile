import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastAndroid } from "react-native";
import { Picker } from "@react-native-picker/picker";

const UserProfile = () => {
  const [user, setUser] = useState({ name: "", email: "", password: "", gradeLevel: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const apiUrl = "http://192.168.100.171:4000";


  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        const response = await axios.post(`${apiUrl}/api/auth/user`, { token });
        setUser(response.data.user);
        setProfilePictureUrl(response.data.user.profilePicture?.url || null);
      } catch (err) {
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: false,
    });
  
    if (!result.canceled && result.assets.length > 0) {
      setNewProfilePicture(result.assets[0].uri); // Corrected
    }
  };
  
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) throw new Error("No token found");
  
      if (!user._id) {
        Alert.alert("Error", "User ID is missing");
        return;
      }
  
      let formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("gradeLevel", user.gradeLevel);
      if (user.password) formData.append("password", user.password);
      if (newProfilePicture) {
        formData.append("profilePicture", {
          uri: newProfilePicture,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }
  
      const response = await axios.put(
        `${apiUrl}/api/auth/update-profile/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      setUser(response.data.user);
      setProfilePictureUrl(response.data.user.profilePicture?.url || newProfilePicture);
      setNewProfilePicture(null);
      ToastAndroid.show("Profile updated successfully!", ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };
  

  if (loading) return <ActivityIndicator size="large" color="#7b1111" />;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10, marginBottom: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>USER PROFILE</Text>

      <Image source={{ uri: newProfilePicture || profilePictureUrl || "https://via.placeholder.com/150" }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }} />
      <TouchableOpacity onPress={handleImagePick} style={{ marginBottom: 20, backgroundColor: "#7b1111", padding: 10, borderRadius: 5 }}>
        <Text style={{ color: "white" }}>Change Profile Picture</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Name"
        value={user.name}
        onChangeText={(text) => setUser({ ...user, name: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={user.email}
        onChangeText={(text) => setUser({ ...user, email: text })}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={user.password}
        onChangeText={(text) => setUser({ ...user, password: text })}
        style={styles.input}
        secureTextEntry
      />

      {/* <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>Grade Level</Text> */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={user.gradeLevel}
          onValueChange={(itemValue) => setUser({ ...user, gradeLevel: itemValue })}
        >
          <Picker.Item label="Select Grade Level" value="" />
          <Picker.Item label="Junior High School" value="Junior High School" />
          <Picker.Item label="Senior High School" value="Senior High School" />
          <Picker.Item label="College" value="College" />
        </Picker>
      </View>

      <Button title="Update" onPress={handleSubmit} color="#7b1111" />
    </View>
  );
};
const styles = {
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: "white",
  },
  picker: {
    width: "100%",
    height: 50,
  },
};

export default UserProfile;
