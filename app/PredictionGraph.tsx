import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PredictionGraph = ({ predictions, type }) => {
    const [saveStatus, setSaveStatus] = useState(null);
    const screenWidth = Dimensions.get('window').width - 40; // Account for padding

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

    // Sort strands by percentage and get top 5
    const sortedStrands = Object.entries(predictions)
        .sort((a, b) => b[1].percentage - a[1].percentage)
        .slice(0, 5);
    
    const labels = sortedStrands.map(([label]) => label);
    const dataValues = sortedStrands.map(([_, value]) => value.percentage);

    const chartData = {
        labels,
        datasets: [{ data: dataValues }],
    };

    // Calculate appropriate width for bars
    const barWidth = Math.max(screenWidth, labels.length * 70);

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        barPercentage: 0.7,
        spacing: 0.2,
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

    const getChartTitle = () => {
        if (type === 'jhs') return 'Top 5 Junior High School Track Predictions';
        if (type === 'shs') return 'Top 5 Senior High School Strand Predictions';
        if (type === 'college') return 'Top 5 College Course Predictions';
        return 'Top 5 Predictions';
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{getChartTitle()}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <BarChart
                    data={chartData}
                    width={barWidth}
                    height={250}
                    yAxisSuffix="%"
                    chartConfig={chartConfig}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                    verticalLabelRotation={30}
                />
            </ScrollView>

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
        borderRadius: 16,
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