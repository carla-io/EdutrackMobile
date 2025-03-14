import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PredictionGraph = ({ predictions, type }) => {
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => {
        const loadPredictions = async () => {
            try {
                const savedPredictions = await AsyncStorage.getItem('predictions');
                if (savedPredictions) {
                    console.log('Loaded saved predictions:', JSON.parse(savedPredictions));
                }
            } catch (error) {
                console.error('Error loading predictions from AsyncStorage:', error);
            }
        };
        loadPredictions();
    }, []);

    if (!predictions || Object.keys(predictions).length === 0) {
        return <Text style={styles.message}>No predictions available to display.</Text>;
    }

    const labels = Object.keys(predictions);
    const dataValues = labels.map(label => predictions[label].percentage);

    const chartData = {
        labels,
        datasets: [{ data: dataValues }],
    };

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        barPercentage: 0.5,
    };

    const handleSavePredictions = async () => {
        try {
            await AsyncStorage.setItem('predictions', JSON.stringify(predictions));
            setSaveStatus('Predictions saved successfully!');
        } catch (error) {
            console.error('Error saving predictions:', error);
            setSaveStatus('Failed to save predictions.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>
                {type === 'jhs' ? 'Junior High School Track Predictions' :
                type === 'shs' ? 'Senior High School Strand Predictions' :
                type === 'college' ? 'College Course Predictions' : 'Predictions'}
            </Text>

            <BarChart
                data={chartData}
                width={350}
                height={250}
                yAxisSuffix="%"
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showBarTops
            />

            <View style={styles.missingSubjectsContainer}>
                {labels.map(label => (
                    predictions[label].missing_subjects?.length > 0 && (
                        <Text key={label} style={styles.missingSubjects}>
                            <Text style={styles.bold}>{label} - Missing Subjects: </Text>
                            {predictions[label].missing_subjects.join(', ')}
                        </Text>
                    )
                ))}
            </View>

            <Button title="Save Predictions" onPress={handleSavePredictions} color="#007bff" />
            {saveStatus && <Text style={styles.saveStatus}>{saveStatus}</Text>}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    chart: {
        marginVertical: 10,
    },
    missingSubjectsContainer: {
        marginTop: 15,
        width: '90%',
    },
    missingSubjects: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    bold: {
        fontWeight: 'bold',
    },
    saveStatus: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28a745',
    },
    message: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
    },
});

export default PredictionGraph;
