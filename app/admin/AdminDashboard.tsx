import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  AreaChart 
} from 'react-native-chart-kit';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as MediaLibrary from 'expo-media-library';

const AdminDashboard = ({ navigation }) => {
  // State variables
  const [registrationData, setRegistrationData] = useState([]);
  const [gradeLevelData, setGradeLevelData] = useState([]);
  const [topStrands, setTopStrands] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [archivedUserCount, setArchivedUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  // References for charts
  const dashboardRef = useRef(null);
  const chartRefs = {
    registrationChart: useRef(null),
    gradeLevelChart: useRef(null),
    topStrandsChart: useRef(null),
    topCoursesChart: useRef(null),
    activeUsersChart: useRef(null),
    archivedUsersChart: useRef(null)
  };

  const screenWidth = Dimensions.get('window').width - 32; // Adjust for padding

  // API base URL
  const API_BASE_URL = 'http://192.168.100.171:4000/api';

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRegistrationData(),
          fetchGradeLevelData(),
          fetchTopStrands(),
          fetchTopCourses(),
          fetchUserStats()
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Alert.alert('Error', 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchRegistrationData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/registrations-over-time`);
      setRegistrationData(
        response.data.data.map((item) => ({
          date: item._id,
          count: item.count,
        }))
      );
    } catch (error) {
      console.error('Error fetching registration data:', error);
    }
  };

  const fetchGradeLevelData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/grade-level-distribution`);
      
      const formattedData = response.data.data.map((item) => ({
        date: item.date || 'Unknown',
        juniorHigh: item['Junior High School'] || 0,
        seniorHigh: item['Senior High School'] || 0,
        college: item['College'] || 0,
      }));
      
      setGradeLevelData(formattedData);
    } catch (error) {
      console.error('Error fetching grade level data:', error);
    }
  };
  
  const fetchTopStrands = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/predictions/top-strands`);
      setTopStrands(
        response.data.data.map((item) => ({
          strand: item.strand,
          average: item.average,
        }))
      );
    } catch (error) {
      console.error('Error fetching top strands:', error);
    }
  };

  const fetchTopCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/prediction_shs/top-courses`);
      setTopCourses(
        response.data.data.map((item) => ({
          course: item.course,
          average: parseFloat(item.averagePercentage),
        }))
      );
    } catch (error) {
      console.error('Error fetching top courses:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const activeResponse = await axios.get(`${API_BASE_URL}/auth/active`);
      const archivedResponse = await axios.get(`${API_BASE_URL}/auth/archived`);
      
      setActiveUserCount(activeResponse.data.data.length);
      setArchivedUserCount(archivedResponse.data.data.length);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Data processing for charts
  const totalUsers = activeUserCount + archivedUserCount;
  
  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(78, 121, 167, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726'
    }
  };

  const barChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(242, 142, 44, ${opacity})`,
  };

  // Export chart as image
  const exportChartAsImage = async (chartRef, chartName) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Storage permission is needed to save the chart.');
        return;
      }
      
      const result = await captureRef(chartRef, {
        format: 'png',
        quality: 1,
      });
      
      const asset = await MediaLibrary.createAssetAsync(result);
      await MediaLibrary.createAlbumAsync('AdminDashboard', asset, false);
      
      Alert.alert('Success', `${chartName} saved to gallery`);
    } catch (error) {
      console.error('Error exporting chart:', error);
      Alert.alert('Error', 'Failed to export chart');
    }
  };

  // Share chart
  const shareChart = async (chartRef, chartName) => {
    try {
      const result = await captureRef(chartRef, {
        format: 'png',
        quality: 1,
      });
      
      const tempFilePath = `${FileSystem.cacheDirectory}${chartName}.png`;
      await FileSystem.moveAsync({
        from: result,
        to: tempFilePath
      });
      
      await Sharing.shareAsync(tempFilePath, {
        mimeType: 'image/png',
        dialogTitle: `Share ${chartName}`,
      });
    } catch (error) {
      console.error('Error sharing chart:', error);
      Alert.alert('Error', 'Failed to share chart');
    }
  };

  // Print chart
  const printChart = async (chartRef, chartName) => {
    try {
      const result = await captureRef(chartRef, {
        format: 'png',
        quality: 1,
      });
      
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; }
              h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
              p { text-align: center; color: #666; margin-bottom: 20px; }
              img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            </style>
          </head>
          <body>
            <h1>${chartName}</h1>
            <p>Generated on: ${currentDate}</p>
            <img src="data:image/png;base64,${result}" />
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html,
        base64: false
      });
    } catch (error) {
      console.error('Error printing chart:', error);
      Alert.alert('Error', 'Failed to print chart');
    }
  };

  // Generate PDF report
  const generatePDFReport = async () => {
    try {
      const registrationResult = await captureRef(chartRefs.registrationChart, {
        format: 'png',
        quality: 1,
      });
      
      const gradeLevelResult = await captureRef(chartRefs.gradeLevelChart, {
        format: 'png',
        quality: 1,
      });
      
      const topStrandsResult = await captureRef(chartRefs.topStrandsChart, {
        format: 'png',
        quality: 1,
      });
      
      const topCoursesResult = await captureRef(chartRefs.topCoursesChart, {
        format: 'png',
        quality: 1,
      });
      
      const activeUsersResult = await captureRef(chartRefs.activeUsersChart, {
        format: 'png',
        quality: 1,
      });
      
      const archivedUsersResult = await captureRef(chartRefs.archivedUsersChart, {
        format: 'png',
        quality: 1,
      });
      
      // Create PDF HTML
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; }
              h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
              h2 { text-align: center; font-size: 18px; margin-top: 40px; margin-bottom: 10px; }
              p { text-align: center; color: #666; margin-bottom: 20px; }
              img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
            <h1>Admin Dashboard Report</h1>
            <p>Generated on: ${currentDate}</p>
            
            <h2>User Registrations</h2>
            <img src="data:image/png;base64,${registrationResult}" />
            <div class="page-break"></div>
            
            <h2>Grade Level Distribution</h2>
            <img src="data:image/png;base64,${gradeLevelResult}" />
            <div class="page-break"></div>
            
            <h2>Top Strands</h2>
            <img src="data:image/png;base64,${topStrandsResult}" />
            <div class="page-break"></div>
            
            <h2>Top Courses</h2>
            <img src="data:image/png;base64,${topCoursesResult}" />
            <div class="page-break"></div>
            
            <h2>Active Users</h2>
            <img src="data:image/png;base64,${activeUsersResult}" />
            <div class="page-break"></div>
            
            <h2>Archived Users</h2>
            <img src="data:image/png;base64,${archivedUsersResult}" />
            
            <h2>Summary</h2>
            <p>Total Users: ${totalUsers}</p>
            <p>Active Users: ${activeUserCount} (${((activeUserCount/totalUsers)*100).toFixed(1)}%)</p>
            <p>Archived Users: ${archivedUserCount} (${((archivedUserCount/totalUsers)*100).toFixed(1)}%)</p>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Admin Dashboard Report',
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4e79a7" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={dashboardRef} style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerDate}>{currentDate}</Text>
        </View>

        {/* User Status Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>User Status</Text>
          <View style={styles.cardsContainer}>
            <View style={[styles.card, { backgroundColor: '#e8f4f8' }]}>
              <Text style={styles.cardValue}>{totalUsers}</Text>
              <Text style={styles.cardLabel}>Total Users</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#e3f2fd' }]}>
              <Text style={styles.cardValue}>{activeUserCount}</Text>
              <Text style={styles.cardLabel}>Active Users</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#ffebee' }]}>
              <Text style={styles.cardValue}>{archivedUserCount}</Text>
              <Text style={styles.cardLabel}>Archived Users</Text>
            </View>
          </View>
        </View>

        {/* Active Users Chart */}
        <View style={styles.chartContainer} ref={chartRefs.activeUsersChart}>
          <Text style={styles.sectionTitle}>Active Users</Text>
          <View style={styles.chartWrapper}>
            <PieChart 
              data={[
                {
                  name: 'Active',
                  population: activeUserCount,
                  color: '#4e79a7',
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12
                },
                {
                  name: 'Other',
                  population: totalUsers - activeUserCount,
                  color: '#e0e0e0',
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12
                }
              ]}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportChartAsImage(chartRefs.activeUsersChart, 'Active Users Chart')}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareChart(chartRefs.activeUsersChart, 'Active Users Chart')}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => printChart(chartRefs.activeUsersChart, 'Active Users Chart')}
            >
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Archived Users Chart */}
        <View style={styles.chartContainer} ref={chartRefs.archivedUsersChart}>
          <Text style={styles.sectionTitle}>Archived Users</Text>
          <View style={styles.chartWrapper}>
            <PieChart 
              data={[
                {
                  name: 'Archived',
                  population: archivedUserCount,
                  color: '#e15759',
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12
                },
                {
                  name: 'Other',
                  population: totalUsers - archivedUserCount,
                  color: '#e0e0e0',
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12
                }
              ]}
              width={screenWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(225, 87, 89, ${opacity})`
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportChartAsImage(chartRefs.archivedUsersChart, 'Archived Users Chart')}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareChart(chartRefs.archivedUsersChart, 'Archived Users Chart')}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => printChart(chartRefs.archivedUsersChart, 'Archived Users Chart')}
            >
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Registration Chart */}
        <View style={styles.chartContainer} ref={chartRefs.registrationChart}>
          <Text style={styles.sectionTitle}>User Registrations Over Time</Text>
          <View style={styles.chartWrapper}>
            {registrationData.length > 0 && (
              <LineChart
                data={{
                  labels: registrationData.slice(-6).map(item => item.date),
                  datasets: [
                    {
                      data: registrationData.slice(-6).map(item => item.count)
                    }
                  ]
                }}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            )}
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportChartAsImage(chartRefs.registrationChart, 'Registration Chart')}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareChart(chartRefs.registrationChart, 'Registration Chart')}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => printChart(chartRefs.registrationChart, 'Registration Chart')}
            >
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grade Level Chart */}
        <View style={styles.chartContainer} ref={chartRefs.gradeLevelChart}>
          <Text style={styles.sectionTitle}>Grade Level Distribution</Text>
          <View style={styles.chartWrapper}>
            {gradeLevelData.length > 0 && (
              <BarChart
                data={{
                  labels: ['Junior High', 'Senior High', 'College'],
                  datasets: [
                    {
                      data: [
                        gradeLevelData[0]?.juniorHigh || 0,
                        gradeLevelData[0]?.seniorHigh || 0,
                        gradeLevelData[0]?.college || 0
                      ]
                    }
                  ]
                }}
                width={screenWidth}
                height={220}
                chartConfig={barChartConfig}
                style={styles.chart}
                verticalLabelRotation={0}
              />
            )}
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportChartAsImage(chartRefs.gradeLevelChart, 'Grade Level Chart')}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareChart(chartRefs.gradeLevelChart, 'Grade Level Chart')}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => printChart(chartRefs.gradeLevelChart, 'Grade Level Chart')}
            >
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Strands Chart */}
        <View style={styles.chartContainer} ref={chartRefs.topStrandsChart}>
          <Text style={styles.sectionTitle}>Top Strands</Text>
          <View style={styles.chartWrapper}>
            {topStrands.length > 0 && (
              <BarChart
                data={{
                  labels: topStrands.slice(0, 5).map(item => item.strand),
                  datasets: [
                    {
                      data: topStrands.slice(0, 5).map(item => item.average)
                    }
                  ]
                }}
                width={screenWidth}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(225, 87, 89, ${opacity})`
                }}
                style={styles.chart}
                verticalLabelRotation={30}
              />
            )}
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportChartAsImage(chartRefs.topStrandsChart, 'Top Strands Chart')}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareChart(chartRefs.topStrandsChart, 'Top Strands Chart')}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => printChart(chartRefs.topStrandsChart, 'Top Strands Chart')}
            >
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Courses Chart */}
        <View style={styles.chartContainer} ref={chartRefs.topCoursesChart}>
          <Text style={styles.sectionTitle}>Top Courses</Text>
          <View style={styles.chartWrapper}>
            {topCourses.length > 0 && (
              <BarChart
                data={{
                  labels: topCourses.slice(0, 5).map(item => item.course),
                  datasets: [
                    {
                      data: topCourses.slice(0, 5).map(item => item.average)
                    }
                  ]
                }}
                width={screenWidth}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(89, 161, 79, ${opacity})`
                }}
                style={styles.chart}
                verticalLabelRotation={30}
              />
            )}
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportChartAsImage(chartRefs.topCoursesChart, 'Top Courses Chart')}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareChart(chartRefs.topCoursesChart, 'Top Courses Chart')}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => printChart(chartRefs.topCoursesChart, 'Top Courses Chart')}
            >
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Full Report */}
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={generatePDFReport}
          >
            <Text style={styles.exportButtonText}>Generate Full Report (PDF)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  actionButton: {
    backgroundColor: '#4e79a7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  exportContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  exportButton: {
    backgroundColor: '#59a14f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboard;