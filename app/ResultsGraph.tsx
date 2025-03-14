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

  return (
    <ScrollView horizontal>
      <View>
        <BarChart
          data={data}
          width={Math.max(screenWidth, labels.length * 60)} // Ensure proper spacing
          height={300}
          yAxisSuffix="%"
          fromZero
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            barPercentage: 0.5,
          }}
          verticalLabelRotation={30}
        />
      </View>
    </ScrollView>
  );
};

export default ResultsGraph;
