import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  StyleSheet,
  ScrollView,
  StatusBar
} from "react-native";
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
      setNewProfilePicture(result.assets[0].uri);
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

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#7b1111" />
    </View>
  );
  
  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar backgroundColor="#7b1111" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>MY PROFILE</Text>
      </View>
      
      <View style={styles.profileImageContainer}>
        <Image 
          source={{ uri: newProfilePicture || profilePictureUrl || "https://via.placeholder.com/150" }} 
          style={styles.profileImage} 
        />
        <TouchableOpacity 
          onPress={handleImagePick} 
          style={styles.cameraIconContainer}
        >
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            value={user.name}
            onChangeText={(text) => setUser({ ...user, name: text })}
            style={styles.input}
            placeholder="Enter your full name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            value={user.email}
            onChangeText={(text) => setUser({ ...user, email: text })}
            style={styles.input}
            keyboardType="email-address"
            placeholder="Enter your email"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            value={user.password || ""}
            onChangeText={(text) => setUser({ ...user, password: text })}
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
          />
          <Text style={styles.helperText}>Leave blank to keep current password</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Grade Level</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={user.gradeLevel}
              onValueChange={(itemValue) => setUser({ ...user, gradeLevel: itemValue })}
              style={styles.picker}
            >
              <Picker.Item label="Select Grade Level" value="" />
              <Picker.Item label="Junior High School" value="Junior High School" />
              <Picker.Item label="Senior High School" value="Senior High School" />
              <Picker.Item label="College" value="College" />
            </Picker>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.updateButtonText}>UPDATE PROFILE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  errorText: {
    color: "#7b1111",
    fontSize: 16,
    textAlign: "center",
  },
  headerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,

  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "Black",
    textAlign: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#7b1111",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 16,
    color: "white",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    paddingLeft: 2,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    paddingLeft: 2,
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
  },
  updateButton: {
    backgroundColor: "#7b1111",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UserProfile;