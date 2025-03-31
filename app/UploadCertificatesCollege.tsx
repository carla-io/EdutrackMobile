import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, FlatList, StyleSheet, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

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
            await AsyncStorage.setItem("college_cert_predict", JSON.stringify(response.data));
            onUpload(response.data);
            Toast.show({ type: "success", text1: "Career prediction successful!" });
        } catch (error) {
            console.error("Error uploading certificates:", error);
            Toast.show({ type: "error", text1: "Failed to predict careers." });
        } finally {
            setUploading(false);
        }
    };

    // Function to create a bar chart with vertical labels
    const renderCareerChart = () => {
        // Calculate the maximum score for scaling
        const maxScore = Math.max(...predictedCareers.map(career => career.score));
        
        return (
            <View style={styles.chartWrapper}>
                {predictedCareers.map((career, index) => {
                    // Calculate bar width based on score percentage
                    const barWidth = (career.score / 100) * (width - 100);
                    
                    return (
                        <View key={index} style={styles.chartRow}>
                            {/* Career name displayed vertically */}
                            <View style={styles.verticalLabelContainer}>
                                <Text style={styles.verticalLabel} numberOfLines={2}>
                                    {`${index + 1}. ${career.career}`}
                                </Text>
                            </View>
                            
                            {/* Bar for the score */}
                            <View style={styles.barContainer}>
                                <View 
                                    style={[
                                        styles.bar, 
                                        {width: barWidth},
                                        index === 0 ? styles.topBar : null
                                    ]}
                                />
                                <Text style={styles.scoreText}>{`${career.score}%`}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Upload Certificate</Text>
            <TouchableOpacity onPress={handleImageSelection} style={styles.selectButton}>
                <Text style={styles.buttonText}>📂 Click to Select Files</Text>
            </TouchableOpacity>
            
            <FlatList
                data={selectedImages}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item }} style={styles.image} />
                        <TouchableOpacity onPress={() => handleRemoveImage(index)} style={styles.removeButton}>
                            <Text style={styles.removeButtonText}>❌</Text>
                        </TouchableOpacity>
                    </View>
                )}
                style={styles.imageList}
            />
            
            {uploading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}
            
            <TouchableOpacity 
                onPress={handleUpload} 
                disabled={uploading} 
                style={[styles.predictButton, uploading && styles.disabledButton]}
            >
                <Text style={styles.buttonText}>
                    {uploading ? "Processing AI Prediction..." : "Predict Career"}
                </Text>
            </TouchableOpacity>
            
            {predictedCareers.length > 0 && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Top 5 Predicted Careers:</Text>
                    {renderCareerChart()}
                </View>
            )}
            
            <View style={styles.sectionDivider} />
            
            <TouchableOpacity 
                onPress={() => router.push("PQcollege")} 
                style={styles.proceedButton}
            >
                <Text style={styles.buttonText}>Proceed</Text>
            </TouchableOpacity>
            
            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        padding: 20, 
        backgroundColor: "#fff"
    },
    title: {
        fontSize: 20, 
        fontWeight: "bold", 
        textAlign: "center", 
        marginBottom: 20
    },
    selectButton: {
        backgroundColor: "#007bff", 
        padding: 10, 
        borderRadius: 5, 
        alignItems: "center"
    },
    buttonText: {
        color: "#fff"
    },
    imageContainer: {
        margin: 10
    },
    image: {
        width: 100, 
        height: 100, 
        borderRadius: 5
    },
    removeButton: {
        position: "absolute", 
        top: 5, 
        right: 5, 
        backgroundColor: "red", 
        padding: 5, 
        borderRadius: 50
    },
    removeButtonText: {
        color: "#fff"
    },
    imageList: {
        marginVertical: 10
    },
    loader: {
        marginTop: 20
    },
    predictButton: {
        backgroundColor: "#28a745", 
        padding: 10, 
        borderRadius: 5, 
        alignItems: "center", 
        marginTop: 20
    },
    disabledButton: {
        backgroundColor: "gray"
    },
    resultsContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    resultsTitle: {
        fontSize: 18, 
        fontWeight: "bold",
        marginBottom: 15
    },
    proceedButton: {
        backgroundColor: "#007bff", 
        padding: 10, 
        borderRadius: 5, 
        alignItems: "center", 
        marginTop: 10
    },
    // Chart-specific styles
    chartWrapper: {
        marginTop: 10,
        marginBottom: 15,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25, // Good spacing between each career item
        height: 50, // Fixed height for consistent spacing
    },
    verticalLabelContainer: {
        width: 80, // Fixed width for labels
        marginRight: 10,
    },
    verticalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    barContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 25,
    },
    bar: {
        height: 25,
        backgroundColor: '#4a90e2',
        borderRadius: 4,
    },
    topBar: {
        backgroundColor: '#2c5ea9', // Darker color for top career
    },
    scoreText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Add a divider between sections
    sectionDivider: {
        height: 1,
        backgroundColor: "#E0E0E0",
        marginVertical: 15,
        width: "100%"
    }
});

export default UploadCertificates;