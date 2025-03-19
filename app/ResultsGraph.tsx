import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const ResultsGraph = ({ prediction }) => {
  // Prepare the data for the chart
  const labels = Object.keys(prediction); // Strand names
  const values = Object.values(prediction); // Corresponding percentages

  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
      },
    ],
  };

  // Calculate appropriate width based on number of bars to prevent overlapping
  const chartWidth = Math.max(screenWidth, labels.length * 70);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View>
        <BarChart
          data={data}
          width={chartWidth}
          height={220}
          yAxisLabel="%"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            barPercentage: 0.6,
            spacing: 0.2,
          }}
          fromZero
          showValuesOnTopOfBars
          verticalLabelRotation={45}
          horizontalLabelRotation={-45}
        />
      </View>
    </ScrollView>
  );
};

export default ResultsGraph;