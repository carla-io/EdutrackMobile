import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

const SERVER_URL = "http://192.168.100.171:5001/process";

const Documents = () => {
  const [documents, setDocuments] = useState({
    grades: { files: [], previews: [], processed: false, warnings: [] },
    certificates: { files: [], previews: [], processed: false, warnings: [] },
  });
  const [processing, setProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const router = useRouter();

  const pickImage = async (type) => {
    Alert.alert(
      "Choose Image Source",
      "Would you like to take a picture or select one from your gallery?",
      [
        {
          text: "Take a Picture",
          onPress: async () => handleImagePick(await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 }), type),
        },
        {
          text: "Pick from Gallery",
          onPress: async () => handleImagePick(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1 }), type),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleImagePick = async (result, type) => {
    if (!result.canceled && result.assets?.length > 0) {
      const compressedImage = await compressImage(result.assets[0].uri);
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          files: [...prev[type].files, compressedImage.uri],
          previews: [...prev[type].previews, compressedImage.uri],
        },
      }));
    }
  };

  const compressImage = async (uri) => {
    return await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
    });
  };

  const uploadImages = async (type) => {
    if (documents[type].files.length === 0) {
      Alert.alert("Upload Required", `Please upload at least one ${type} file.`);
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    documents[type].files.forEach((fileUri, index) => {
      formData.append(type, {
        uri: fileUri,
        type: "image/jpeg",
        name: `${type}_image_${index}.jpg`,
      });
    });

    try {
      const response = await axios.post(SERVER_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data) {
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            processed: true,
            warnings: response.data[type]?.filter((item) => item.warning || item.error) || [],
          },
        }));
        await AsyncStorage.setItem(`extracted${type.charAt(0).toUpperCase() + type.slice(1)}`, JSON.stringify(response.data));
        setExtractedData(response.data);
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Processing Error", `Failed to process ${type}. Try again.`);
      console.error(error);
    }
    setProcessing(false);
  };

  const handleProceedToExam = async () => {
    try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const gradeLevel = parsedUser.gradeLevel || "";

            router.push(
                gradeLevel === "Junior High School"
                    ? "/personal-question-jhs"
                    : gradeLevel === "Senior High School"
                    ? "/personal-question-shs"
                    : gradeLevel === "College"
                    ? "/personal-question-college"
                    : "/default-route"
            );
        } else {
            console.error("User data not found in AsyncStorage.");
        }
    } catch (error) {
        console.error("Error retrieving user data:", error);
    }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {["grades", "certificates"].map((type) => (
        <View key={type} style={styles.card}>
          <Text style={styles.title}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          <TouchableOpacity style={styles.button} onPress={() => pickImage(type)}>
            <Text style={styles.buttonText}>Upload {type}</Text>
          </TouchableOpacity>

          <ScrollView horizontal style={styles.imageContainer}>
            {documents[type].previews.map((preview, index) => (
              <TouchableOpacity key={index} onPress={() => setExtractedData(preview)}>
                <Image source={{ uri: preview }} style={styles.image} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={() => uploadImages(type)} disabled={processing}>
            <Text style={styles.buttonText}>Process {type}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleProceedToExam}>
        <Text style={styles.buttonText}>Proceed to Exam</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Extracted Data</Text>
            <ScrollView style={styles.modalScroll}>
              <Text>{JSON.stringify(extractedData, null, 2)}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "white",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    flexDirection: "row",
    marginVertical: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  modalScroll: {
    maxHeight: 300,
  },
});

export default Documents;
