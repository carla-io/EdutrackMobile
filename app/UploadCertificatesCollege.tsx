import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, FlatList } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

const UploadCertificates = ({ onUpload = () => {} }) => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [predictedCareers, setPredictedCareers] = useState([]);
    const navigation = useNavigation();
    const router = useRouter();

    const pickImage = async (fromCamera) => {
        let result;
        if (fromCamera) {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });
        }

        if (!result.canceled) {
            setSelectedImages([...selectedImages, result.assets[0].uri]);
        }
    };

    const handleImageSelection = () => {
        Alert.alert("Upload Certificate", "Choose an option", [
            { text: "Take a Picture", onPress: () => pickImage(true) },
            { text: "Choose from Gallery", onPress: () => pickImage(false) },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleRemoveImage = (index) => {
        const updatedImages = selectedImages.filter((_, i) => i !== index);
        setSelectedImages(updatedImages);
    };

    const handleUpload = async () => {
        if (selectedImages.length === 0) {
            Toast.show({ type: "error", text1: "Please select at least one certificate image." });
            return;
        }
        setUploading(true);
        const formData = new FormData();
        selectedImages.forEach((uri, index) => {
            formData.append("certificates", {
                uri,
                name: `certificate_${index}.jpg`,
                type: "image/jpeg",
            });
        });

        try {
            const response = await axios.post("http://192.168.100.171:5001/predict-career-cert", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            // Get careers and sort them by score in descending order
            const allCareers = response.data.careers || [];
            
            // Sort careers by score (descending) and take only top 5
            const topFiveCareers = allCareers
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
                
            setPredictedCareers(topFiveCareers);
            onUpload(response.data);
            Toast.show({ type: "success", text1: "Career prediction successful!" });
        } catch (error) {
            console.error("Error uploading certificates:", error);
            Toast.show({ type: "error", text1: "Failed to predict careers." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 }}>Upload Certificate</Text>
            <TouchableOpacity onPress={handleImageSelection} style={{ backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center" }}>
                <Text style={{ color: "#fff" }}>📂 Click to Select Files</Text>
            </TouchableOpacity>
            <FlatList
                data={selectedImages}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={{ margin: 10 }}>
                        <Image source={{ uri: item }} style={{ width: 100, height: 100, borderRadius: 5 }} />
                        <TouchableOpacity onPress={() => handleRemoveImage(index)} style={{ position: "absolute", top: 5, right: 5, backgroundColor: "red", padding: 5, borderRadius: 50 }}>
                            <Text style={{ color: "#fff" }}>❌</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            {uploading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
            <TouchableOpacity onPress={handleUpload} disabled={uploading} style={{ backgroundColor: uploading ? "gray" : "#28a745", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 20 }}>
                <Text style={{ color: "#fff" }}>{uploading ? "Processing AI Prediction..." : "Predict Career"}</Text>
            </TouchableOpacity>
            {predictedCareers.length > 0 && (
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: "bold" }}>Top 5 Predicted Careers:</Text>
                    {predictedCareers.map((career, index) => (
                        <Text key={index} style={{ fontSize: 16, marginTop: 5, padding: 5, backgroundColor: index === 0 ? "#e6f7ff" : "transparent" }}>
                            {`${index + 1}. ${career.career}: ${career.score}%`}
                        </Text>
                    ))}
                </View>
            )}
            {/* <TouchableOpacity onPress={() => router.push("PQcollege")} style={{ backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 20 }}>
                <Text style={{ color: "#fff" }}>Proceed</Text>
            </TouchableOpacity> */}
            <Toast />
        </View>
    );
};

export default UploadCertificates;