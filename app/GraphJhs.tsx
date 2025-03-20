import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Dimensions 
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';// Equivalent to Nav2 component
import { useNavigation } from '@react-navigation/native';
import {useRouter} from 'expo-router';
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { captureRef } from "react-native-view-shot";

const strandDescriptions = {
  STEM: "Science, Technology, Engineering, and Mathematics (STEM) is for students interested in scientific innovations, engineering, and technological advancements. It prepares students for careers in medicine, architecture, engineering, data science, and research by focusing on subjects like physics, calculus, biology, and computer science.",
  
  ABM: "The Accountancy, Business, and Management (ABM) strand is designed for students who aspire to become entrepreneurs, corporate professionals, and financial experts. It covers subjects like business ethics, marketing strategies, economics, accounting, and corporate management, providing a solid foundation for business and commerce-related courses in college.",

  HUMSS: "The Humanities and Social Sciences (HUMSS) strand is perfect for students passionate about history, culture, communication, and public service. It leads to careers in law, journalism, political science, psychology, sociology, and education by focusing on subjects like philosophy, literature, public speaking, and social sciences.",

  GAS: "The General Academic Strand (GAS) is for students who are still exploring their career path. It offers a flexible curriculum that includes a mix of subjects from STEM, ABM, and HUMSS, preparing students for various college courses and professions in administration, liberal arts, education, and government.",

  "Home Economics": "The Home Economics (HE) strand under the Technical-Vocational-Livelihood (TVL) track focuses on skills-based training in hospitality, culinary arts, fashion design, and caregiving. It prepares students for careers in tourism, hotel and restaurant management, food services, and entrepreneurship.",

  ICT: "The Information and Communications Technology (ICT) strand under TVL is ideal for tech-savvy students. It covers programming, networking, cybersecurity, web development, and software engineering, equipping students with skills for careers in IT, animation, game development, and digital arts.",

  "Industrial Arts": "The Industrial Arts strand prepares students for careers in technical trades and engineering. It includes training in welding, carpentry, electrical installation, plumbing, and automotive mechanics, providing job-ready skills for the construction and manufacturing industries.",

  "Agri-Fishery Arts": "The Agri-Fishery Arts strand focuses on agricultural technology, animal husbandry, fisheries, and organic farming. It equips students with knowledge in sustainable agriculture, farm mechanics, aquaculture, and agro-forestry, preparing them for careers in agribusiness and environmental management.",

  Cookery: "The Cookery strand under Home Economics provides in-depth training in culinary arts, baking, food safety, and international cuisine. It is designed for students who want to pursue careers as chefs, bakers, or restaurant owners.",

  "Performing Arts": "The Performing Arts strand under the Arts and Design track is for students passionate about dance, theater, music, and acting. It covers stage performance, choreography, vocal training, and drama, preparing students for careers in entertainment and live productions.",

  "Visual Arts": "The Visual Arts strand focuses on painting, sculpture, digital art, and illustration. It provides students with creative and technical skills needed for careers in graphic design, animation, fine arts, and advertising.",

  "Media Arts": "The Media Arts strand teaches students film production, cinematography, photography, video editing, and digital storytelling. It is ideal for those interested in filmmaking, multimedia arts, and broadcast media.",

  "Literary Arts": "The Literary Arts strand is designed for students who have a passion for writing, poetry, fiction, and journalism. It focuses on creative writing, literature, and publishing, preparing students for careers as writers, editors, and communication professionals.",

  Sports: "The Sports strand is for students interested in athletics, physical education, and sports science. It covers coaching, sports management, health and fitness, and competitive sports training, leading to careers in professional sports, coaching, and physical therapy."
};

const OverallResult = () => {
  const [chartData, setChartData] = useState(null);
  const [individualCharts, setIndividualCharts] = useState([]);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const navigation = useNavigation();
  const chartRef = useRef(null);
  const { width } = Dimensions.get('window');
  const router = useRouter();
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('auth-token');
      if (!token) return;
      try {
        const res = await axios.post('http://192.168.100.171:4000/api/auth/user', { token });
        setUser(res.data.user);
      } catch (error) {
        console.error('User fetch failed', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sources = {
          'Overall Prediction': ['predictions', 'certprediction', 'pqprediction', 'prediction_exam_jhs'],
          'From Grades': ['predictions'],
          'From Certificate': ['certprediction'],
          'From Personal Questionnaire': ['pqprediction'],
          'From Exam Results': ['prediction_exam_jhs']
        };

        const allStrands = {};
        const individualData = [];

        // Process each data source
        for (const [label, keys] of Object.entries(sources)) {
          const strandScores = {};

          for (const key of keys) {
            const storedData = await AsyncStorage.getItem(key);
            if (!storedData) continue;

            let data;
            try {
              data = JSON.parse(storedData);
            } catch (error) {
              console.error(`Error parsing AsyncStorage data for ${key}:`, error);
              continue;
            }

            if (key === 'predictions') {
              Object.entries(data).forEach(([strand, values]) => {
                if (values.percentage !== undefined) {
                  const numericPercentage = parseFloat(values.percentage) || 0;
                  strandScores[strand] = (strandScores[strand] || 0) + numericPercentage;
                  allStrands[strand] = (allStrands[strand] || 0) + numericPercentage;
                }
              });
            } else if (key === 'pqprediction' && data.predictionScores) {
              data.predictionScores.forEach(({ strand, score }) => {
                const numericScore = parseFloat(score) || 0;
                strandScores[strand] = (strandScores[strand] || 0) + numericScore;
                allStrands[strand] = (allStrands[strand] || 0) + numericScore;
              });
            } else {
              Object.entries(data).forEach(([strand, value]) => {
                const numericValue = parseFloat(value) || 0;
                strandScores[strand] = (strandScores[strand] || 0) + numericValue;
                allStrands[strand] = (allStrands[strand] || 0) + numericValue;
              });
            }
          }

          if (label !== 'Overall Prediction' && Object.keys(strandScores).length > 0) {
            // Create color array for chart
            const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#FF8C33', '#33FFF5', '#D133FF', '#F9FF33'];
            
            individualData.push({
              label,
              chart: {
                labels: Object.keys(strandScores),
                datasets: [{
                  data: Object.values(strandScores),
                  colors: colors.map(color => () => color).slice(0, Object.keys(strandScores).length)
                }]
              }
            });
          }
        }

        const sortedStrands = Object.entries(allStrands).sort((a, b) => b[1] - a[1]);

        if (sortedStrands.length > 0) {
          setTopChoices(sortedStrands);
          setChartData({
            labels: sortedStrands.map(([strand]) => strand),
            datasets: [{
              data: sortedStrands.map(([_, percentage]) => percentage),
            }]
          });
        }

        setIndividualCharts(individualData);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load prediction data');
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveToServer = async () => {
      if (!user || !user._id || topChoices.length === 0) return;

      try {
        const predictions = await AsyncStorage.getItem('predictions');
        const certprediction = await AsyncStorage.getItem('certprediction');
        const pqprediction = await AsyncStorage.getItem('pqprediction');
        const prediction_exam_jhs = await AsyncStorage.getItem('prediction_exam_jhs');
        const examScores = await AsyncStorage.getItem('examScores');

        const payload = {
          userId: user._id,
          predictions: predictions ? JSON.parse(predictions) : {},
          certprediction: certprediction ? JSON.parse(certprediction) : {},
          pqprediction_jhs: pqprediction ? JSON.parse(pqprediction) : {},
          prediction_exam_jhs: prediction_exam_jhs ? JSON.parse(prediction_exam_jhs) : {},
          examScores: examScores ? JSON.parse(examScores) : {}
        };

        const response = await axios.post('http://192.168.100.171:4000/api/predictions/save', payload);
        console.log('Predictions saved successfully:', response.data);
        setSaveStatus('Successfully saved to database.');
        Alert.alert('Success', '✅ Successfully saved to database!');
      } catch (error) {
        console.error('Failed to save predictions', error);
        setSaveStatus('Failed to save data. Please try again.');
        Alert.alert('Error', '❌ Failed to save data. Please try again.');
      }
    };

    saveToServer();
  }, [user, topChoices]);

  const downloadPDF = async () => {
    if (!chartRef.current) {
      Alert.alert('Error', 'Chart not found!');
      return;
    }

    try {
      const uri = await chartRef.current.capture();
      
      // Generate PDF HTML content
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; text-align: center; }
              img { width: 100%; max-width: 600px; display: block; margin: 20px auto; }
              p { margin: 10px 0; line-height: 1.5; }
            </style>
          </head>
          <body>
            <h1>Overall SHS Strand Predictions</h1>
            <img src="${uri}" />
            <h2>Your Top Choices:</h2>
            ${topChoices.slice(0, 3).map(([strand], index) => `
              <p><strong>${index === 0 ? 'Your First Choice' : index === 1 ? 'Your Second Choice' : 'Your Third Choice'}:</strong> 
              ${strand} - ${strandDescriptions[strand]}</p>
            `).join('')}
          </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      } else {
        Alert.alert('Error', 'Sharing is not available on your device');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const sendEmail = async () => {
    try {
      // Get user data
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert("Error", "User information not found. Please log in again.");
        return;
      }
  
      const user = JSON.parse(storedUser);
      if (!user?.email) {
        Alert.alert("Error", "User email not found!");
        return;
      }
  
      if (!reportRef.current) {
        Alert.alert("Error", "Report not ready yet!");
        return;
      }
  
      // Capture the view as an image
      const uri = await captureRef(reportRef, {
        format: "jpg",
        quality: 0.3, // Reduce quality
      });
  
      // Convert image URI to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
  
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1]; // Extract base64 part
  
        // Send email with report
        await axios.post(
          "http://192.168.100.171:4000/api/auth/send-graph-email",
          {
            image: `data:image/jpeg;base64,${base64Image}`,
            email: user.email,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
  
        Alert.alert(
          "Success",
          "Your college course prediction report has been sent to your email successfully!"
        );
      };
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert("Error", "Failed to send email. Please try again later.");
    }
  };

  const printChart = async () => {
    try {
      const uri = await chartRef.current.capture();
  
      const htmlContent = `
        <html>
          <body style="text-align: center;">
            <h1>Overall SHS Strand Predictions</h1>
            <img src="${uri}" width="100%" />
          </body>
        </html>
      `;
  
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert("Error", "Failed to print");
    }
  };

  const navigateToFinalResultJHS = () => {
    router.push('Finaljhs');
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e3e3e3',
      strokeDasharray: '0'
    }
  };



  // Custom colors for the chart
  const customColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#FF8C33', '#33FFF5', '#D133FF'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Overall SHS Strand Predictions</Text>
      </View>

      <View style={styles.topChoicesContainer}>
        {topChoices.slice(0, 3).map(([strand], index) => (
          <Text key={strand} style={styles.topChoiceText}>
            <Text style={styles.boldText}>
              {index === 0 ? 'Your First Choice' : index === 1 ? 'Your Second Choice' : 'Your Third Choice'}:
            </Text>{' '}
            {strand} - {strandDescriptions[strand]}
          </Text>
        ))}
      </View>

      <ViewShot 
  ref={(ref) => {
    chartRef.current = ref;
    reportRef.current = ref;
  }} 
  style={styles.chartContainer}
>

        {chartData && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Overall Prediction</Text>
            <BarChart
              data={{
                labels: chartData.labels.length > 5 
                  ? chartData.labels.slice(0, 5) 
                  : chartData.labels,
                datasets: [{
                  data: chartData.labels.length > 5 
                    ? chartData.datasets[0].data.slice(0, 5) 
                    : chartData.datasets[0].data
                }]
              }}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1, index) => {
                  return customColors[index % customColors.length] || `rgba(0, 0, 0, ${opacity})`;
                }
              }}
              verticalLabelRotation={30}
              showValuesOnTopOfBars
              fromZero
              style={styles.chart}
            />
          </View>
        )}
      </ViewShot>

      {individualCharts.map(({ label, chart }) => (
        <View key={label} style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>{label}</Text>
          <BarChart
            data={{
              labels: chart.labels.length > 5 ? chart.labels.slice(0, 5) : chart.labels,
              datasets: [{
                data: chart.labels.length > 5 
                  ? chart.datasets[0].data.slice(0, 5) 
                  : chart.datasets[0].data
              }]
            }}
            width={width - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index) => {
                return customColors[index % customColors.length] || `rgba(0, 0, 0, ${opacity})`;
              }
            }}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            fromZero
            style={styles.chart}
          />
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={downloadPDF}>
          <Text style={styles.buttonText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={sendEmail}>
          <Text style={styles.buttonText}>Send via Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={printChart}>
          <Text style={styles.buttonText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={navigateToFinalResultJHS}>
          <Text style={styles.buttonText}>Generate Final Report</Text>
        </TouchableOpacity>
      </View>

      {/* <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.push('Portal')}
      >
        <Text style={styles.backButtonText}>⬅ Back to Personal Questionnaire</Text>
      </TouchableOpacity> */}
      
      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  topChoicesContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  topChoiceText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  chartWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
  spacer: {
    height: 30,
  },
});

export default OverallResult;