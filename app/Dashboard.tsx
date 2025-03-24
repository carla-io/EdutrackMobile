import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Alert
} from "react-native";
import { BarChart, PieChart, RadarChart } from "react-native-chart-kit";
import axios from "axios";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import {
  FontAwesome5,
  FontAwesome,
  MaterialCommunityIcons,
  Ionicons
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"

const { width } = Dimensions.get("window");

const Dashboard = ({ navigation }) => {
  const [user, setUser] = useState({ name: "", gradeLevel: "", profilePicture: "", id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const chartRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) {
        console.log("No token found");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post("http://192.168.100.171:4000/api/auth/user", { token });

        if (response.data.user) {
          const { _id, name, gradeLevel, profilePicture } = response.data.user;
          setUser({ id: _id, name, gradeLevel, profilePicture });

          // Ensure valid user ID before fetching predictions
          if (_id && _id.length === 24) {
            fetchPredictions(_id, gradeLevel);
          } else {
            console.error("Invalid user ID:", _id);
            setError("User ID is invalid.");
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err);
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchPredictions = async (userId, gradeLevel) => {
    if (!userId || userId.length !== 24) {
      console.error("Invalid user ID:", userId);
      setUser(prevUser => ({ ...prevUser, hasPredictions: false }));
      return;
    }
  
    try {
      let apiUrl = "";
      
      // Set API URL based on grade level
      if (gradeLevel === "Junior High School") {
        apiUrl = `http://192.168.100.171:4000/api/predictions/${userId}`;
      } else if (gradeLevel === "Senior High School") {
        apiUrl = `http://192.168.100.171:4000/api/prediction_shs/${userId}`;
      } else if (gradeLevel === "College") {
        apiUrl = `http://192.168.100.171:4000/api/prediction_college/${userId}`;
      } else {
        // Instead of setting error, just mark as no predictions
        setUser(prevUser => ({ ...prevUser, hasPredictions: false }));
        return;
      }
  
      const response = await axios.get(apiUrl);
      console.log("API Response:", response.data);
  
      if (!response.data || !response.data.success) {
        // No predictions found - this is a valid state, not an error
        setUser(prevUser => ({ ...prevUser, hasPredictions: false }));
        return;
      }
  
      let labels = [];
      let values = [];
  
      // Process data based on grade level
      if (gradeLevel === "Junior High School") {
        const predictions = response.data.data || [];
        labels = predictions.map((item) => item.strand);
        values = predictions.map((item) => Number(item.score) || 0);
      } else if (gradeLevel === "Senior High School") {
        const { predictions, overallprediction_shs } = response.data.data || {};
  
        if (overallprediction_shs && Object.keys(overallprediction_shs).length > 0) {
          labels = Object.keys(overallprediction_shs);
          values = labels.map((strand) => Number(overallprediction_shs[strand]) || 0);
        } else if (predictions && Object.keys(predictions).length > 0) {
          labels = Object.keys(predictions);
          values = labels.map((strand) => Number(predictions[strand]?.percentage) || 0);
        }
      } else if (gradeLevel === "College") {
        const overallprediction_college = response.data.data || [];
        console.log("Extracted College Predictions:", overallprediction_college);
        
        if (Array.isArray(overallprediction_college) && overallprediction_college.length > 0) {
          labels = overallprediction_college.map((item) => item.career);
          values = overallprediction_college.map((item) => Number(item.score) || 0);
        }
      }
  
      console.log("Chart Labels:", labels);
      console.log("Chart Values:", values);
  
      if (labels.length === 0 || values.length === 0) {
        // No predictions available - this is a valid state, not an error
        setUser(prevUser => ({ ...prevUser, hasPredictions: false }));
        return;
      }
  
      // Sort data for better visualization
      const combined = labels.map((label, index) => ({
        label,
        value: values[index],
      }));
      combined.sort((a, b) => b.value - a.value);
  
      // Take top 5 results if there are more
      const topResults = combined.slice(0, 5);
  
      setChartData({
        labels: topResults.map(item => item.label),
        datasets: [
          {
            data: topResults.map(item => item.value),
          }
        ],
        colors: [
          "rgba(128, 0, 0, 0.8)",
          "rgba(178, 34, 34, 0.8)",
          "rgba(220, 20, 60, 0.8)",
          "rgba(255, 99, 71, 0.8)",
          "rgba(255, 140, 51, 0.8)"
        ],
        backgroundColors: [
          "rgb(128, 0, 0)",
          "rgb(178, 34, 34)",
          "rgb(220, 20, 60)",
          "rgb(255, 99, 71)",
          "rgb(255, 140, 51)"
        ]
      });
      
      // Set that user has predictions
      setUser(prevUser => ({ ...prevUser, hasPredictions: true }));
  
      console.log("Chart Data Updated:", {
        labels: topResults.map(item => item.label),
        datasets: [{ data: topResults.map(item => item.value) }]
      });
    } catch (err) {
      console.error("Error fetching predictions:", err);
      // Instead of setting error state, just mark as no predictions
      setUser(prevUser => ({ ...prevUser, hasPredictions: false }));
    }
  };

  // Save chart as image
  const captureChart = async () => {
    if (!chartRef.current) return;
    
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images');
        return;
      }
      
      setIsDownloading(true);
      
      // Capture the chart view
      const result = await captureRef(chartRef, {
        format: 'jpg',
        quality: 0.9,
      });
      
      // Save the image
      const asset = await MediaLibrary.createAssetAsync(result);
      
      // Share the image
      await Sharing.shareAsync(result, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share your prediction results',
      });
      
      Alert.alert('Success', 'Chart saved to gallery');
    } catch (err) {
      console.error('Error capturing chart:', err);
      Alert.alert('Error', 'Failed to save chart');
    } finally {
      setIsDownloading(false);
    }
  };

  // Get top prediction
  const getTopPrediction = () => {
    if (!chartData || !chartData.labels || !chartData.datasets[0].data) return null;
    
    const data = chartData.datasets[0].data;
    const labels = chartData.labels;
    const maxIndex = data.indexOf(Math.max(...data));
    
    return {
      label: labels[maxIndex],
      value: data[maxIndex]
    };
  };

  // Get prediction strengths
  const getPredictionStrengths = () => {
    if (!chartData || !chartData.labels || !chartData.datasets[0].data) return [];
    
    const data = chartData.datasets[0].data;
    const labels = chartData.labels;
    
    return labels.map((label, index) => ({
      label,
      value: data[index]
    })).sort((a, b) => b.value - a.value);
  };

  // Generate recommendations based on top predictions
  const getRecommendations = () => {
    const topPrediction = getTopPrediction();
    if (!topPrediction) return [];
    
    const recommendations = {
      "STEM": [
        "Focus on strengthening your math and science skills",
        "Consider joining science competitions or clubs",
        "Explore programming or engineering projects",
        "Look into summer programs in science or technology fields"
      ],
      "HUMSS": [
        "Develop your writing and communication skills",
        "Participate in debate clubs or public speaking events",
        "Read widely across literature, history, and social sciences",
        "Consider volunteering for community service projects"
      ],
      "ABM": [
        "Take courses in business, economics, or accounting",
        "Develop your analytical and problem-solving skills",
        "Consider joining business clubs or competitions",
        "Look for internship opportunities in business settings"
      ],
      "GAS": [
        "Explore a variety of subjects to find your strengths",
        "Focus on developing well-rounded academic skills",
        "Consider career exploration activities",
        "Work on time management and study skills"
      ],
      "ARTS": [
        "Build a portfolio of your creative work",
        "Take specialized classes in your art form",
        "Participate in exhibitions, performances, or competitions",
        "Study the business aspects of creative careers"
      ]
    };
    
    // Return recommendations for the top strand or default recommendations
    return recommendations[topPrediction.label] || [
      "Continue exploring different subject areas",
      "Meet with a guidance counselor to discuss your interests",
      "Take a variety of elective courses",
      "Consider job shadowing in fields that interest you"
    ];
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(128, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    labelColor: () => "rgba(0, 0, 0, 0.8)",
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#880000"
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.dashboardGrid}>
      {/* Predictions Chart Card */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <FontAwesome5 name="chart-bar" size={20} color="#880000" />
            <Text style={styles.cardTitleText}>Your Predicted Strands</Text>
          </View>
          {chartData && (
            <TouchableOpacity 
              style={styles.downloadButton} 
              onPress={captureChart}
              disabled={isDownloading}
            >
              <FontAwesome name="download" size={16} color="#fff" />
              <Text style={styles.downloadButtonText}>
                {isDownloading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.cardContent}>
          {user.name ? (
            user.gradeLevel === "Junior High School" || 
            user.gradeLevel === "Senior High School" || 
            user.gradeLevel === "College" ? (
              chartData ? (
                <View style={styles.chartContainer} ref={chartRef}>
                  <BarChart
                    data={{
                      labels: chartData.labels,
                      datasets: [
                        {
                          data: chartData.datasets[0].data
                        }
                      ]
                    }}
                    width={width - 40}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      // Rotate labels to prevent overlapping
                      formatXLabel: (label) => {
                        // Shortening labels if too long
                        return label.length > 10 ? label.substring(0, 10) + '...' : label;
                      },
                      // Add more spacing for labels
                      barPercentage: 0.7,
                      // Improved label formatting
                      propsForLabels: {
                        fontSize: 10,
                        rotation: -45,
                        textAnchor: 'end',
                        dy: -10,
                      }
                    }}
                    style={styles.chart}
                    fromZero
                    yAxisSuffix="%"
                    showBarTops={true}
                    showValuesOnTopOfBars={true}
                    // Add more bottom margin to accommodate rotated labels
                    verticalLabelRotation={45}
                    xLabelsOffset={-10}
                  />
                </View>
              ) : user.hasPredictions === false ? (
                // User has been checked and confirmed to have no predictions
                <View style={styles.noPredictionsMessage}>
                  <FontAwesome5 name="chart-bar" size={40} color="#880000" style={{ opacity: 0.5 }} />
                  <Text style={styles.noPredictionsTitle}>No Predictions Available Yet</Text>
                  <Text style={styles.noPredictionsText}>
                    Complete an assessment to see your personalized strand predictions.
                  </Text>
                  <TouchableOpacity 
                    style={styles.startAssessmentButton}
                    onPress={() => router.push("Portal")}
                  >
                    <Text style={styles.startAssessmentButtonText}>Start Assessment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Loading state while checking predictions
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#880000" />
                  <Text style={styles.loadingText}>Loading your predictions...</Text>
                </View>
              )
            ) : (
              // Grade level not supported
              <View style={styles.noDataMessage}>
                <Text style={styles.noDataText}>
                  No predictions are available for your current grade level.
                </Text>
                <Text style={styles.noDataSubtext}>
                  Please complete an assessment to see your results.
                </Text>
              </View>
            )
          ) : (
            // Guest user
            <View style={styles.guestMessage}>
              <FontAwesome5 name="user" size={40} color="#888" />
              <Text style={styles.guestTitle}>Hello, Guest!</Text>
              <Text style={styles.guestText}>
                Please log in to see your personalized results and predictions.
              </Text>
            </View>
          )}
        </View>
      </View>
  
      {/* Action Cards */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitleText}>Quick Actions</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.actionButtons}>
            {/* Only show "View Detailed Results" if the user has predictions */}
            {user.hasPredictions && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  if (user.gradeLevel === "Junior High School") {
                    router.push("Finaljhs");
                  } else if (user.gradeLevel === "Senior High School") {
                    router.push("Finalshs");
                  } else if (user.gradeLevel === "College") {
                    router.push("GraphCollege");
                  } else {
                    // Fallback for any other grade level
                    router.push("Graph");
                  }
                }}
              >
                <View style={styles.buttonContent}>
                  <View style={[styles.buttonIcon, styles.resultsIcon]}>
                    <FontAwesome5 name="chart-bar" size={24} color="#fff" />
                  </View>
                  <View style={styles.buttonText}>
                    <Text style={styles.buttonTitle}>View Detailed Results</Text>
                    <Text style={styles.buttonSubtitle}>See complete analysis of your assessment</Text>
                  </View>
                </View>
                <FontAwesome5 name="arrow-right" size={16} color="#880000" style={styles.arrowIcon} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, !user.hasPredictions && styles.primaryActionButton]}
              onPress={() => router.push("Portal")}
            >
              <View style={styles.buttonContent}>
                <View style={[styles.buttonIcon, styles.assessmentIcon]}>
                  <FontAwesome5 name="graduation-cap" size={24} color="#fff" />
                </View>
                <View style={styles.buttonText}>
                  <Text style={styles.buttonTitle}>{user.hasPredictions ? "Continue Assessment" : "Start Assessment"}</Text>
                  <Text style={styles.buttonSubtitle}>
                    {user.hasPredictions 
                      ? "Continue your educational assessment journey" 
                      : "Begin your educational assessment journey"}
                  </Text>
                </View>
              </View>
              <FontAwesome5 name="arrow-right" size={16} color="#880000" style={styles.arrowIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderVisualizationsTab = () => (
    <View style={styles.visualizationsGrid}>
      {chartData ? (
        <>
          {/* Pie Chart */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="chart-pie" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Distribution</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.chartContainer}>
                <PieChart
                  data={chartData.labels.map((label, index) => ({
                    name: label,
                    population: chartData.datasets[0].data[index],
                    color: chartData.backgroundColors[index % chartData.backgroundColors.length],
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 12
                  }))}
                  width={width - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"0"}
                  center={[10, 0]}
                  absolute
                />
              </View>
            </View>
          </View>
  
          {/* Radar Chart */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="chart-line" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Compatibility</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.chartContainer}>
                <Text style={styles.centeredText}>
                  Radar chart visualization is best viewed in the full analytics dashboard
                </Text>
              </View>
            </View>
          </View>
  
          {/* Horizontal Bar Chart */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="chart-bar" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Ranking</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.chartContainer}>
                <BarChart
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      {
                        data: chartData.datasets[0].data
                      }
                    ]
                  }}
                  width={width - 40}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    // Rotate labels to prevent overlapping
                    formatXLabel: (label) => {
                      // Shortening labels if too long
                      return label.length > 10 ? label.substring(0, 10) + '...' : label;
                    },
                    // Add more spacing for labels
                    barPercentage: 0.7,
                    // Improved label formatting
                    propsForLabels: {
                      fontSize: 10,
                      rotation: -45,
                      textAnchor: 'end',
                      dy: -10,
                    }
                  }}
                  style={styles.chart}
                  fromZero
                  yAxisSuffix="%"
                  showBarTops={true}
                  showValuesOnTopOfBars={true}
                  // Add more bottom margin to accommodate rotated labels
                  verticalLabelRotation={45}
                  xLabelsOffset={-10}
                />
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* No Data Placeholder for Pie Chart */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="chart-pie" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Distribution</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.chartContainer, styles.noDataContainer]}>
                <FontAwesome5 name="chart-pie" size={48} color="#CCCCCC" />
                <Text style={styles.noDataText}>No assessment data yet</Text>
                <Text style={styles.noDataSubtext}>Complete your assessment to see your strand distribution</Text>
              </View>
            </View>
          </View>
  
          {/* No Data Placeholder for Radar Chart */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="chart-line" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Compatibility</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.chartContainer, styles.noDataContainer]}>
                <FontAwesome5 name="chart-line" size={48} color="#CCCCCC" />
                <Text style={styles.noDataText}>No compatibility data yet</Text>
                <Text style={styles.noDataSubtext}>Complete your assessment to see your strand compatibility</Text>
              </View>
            </View>
          </View>
  
          {/* No Data Placeholder for Bar Chart */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="chart-bar" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Ranking</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.chartContainer, styles.noDataContainer]}>
                <FontAwesome5 name="chart-bar" size={48} color="#CCCCCC" />
                <Text style={styles.noDataText}>No ranking data yet</Text>
                <Text style={styles.noDataSubtext}>Complete your assessment to see your strand ranking</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
  
  const renderAnalysisTab = () => (
    <View style={styles.analysisContainer}>
      {chartData ? (
        <>
          {/* Summary Card */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome name="star" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Summary Report</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>Your Top Strand Match</Text>
                  {getTopPrediction() && (
                    <View style={styles.topPrediction}>
                      <View style={styles.predictionBadge}>
                        <Text style={styles.predictionBadgeText}>
                          {getTopPrediction().label}
                        </Text>
                      </View>
                      <View style={styles.predictionScore}>
                        <Text style={styles.predictionScoreText}>
                          {getTopPrediction().value.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={styles.summaryText}>
                  <Text style={styles.paragraphText}>
                    Based on your assessment results, you show a strong alignment with the <Text style={styles.boldText}>{getTopPrediction()?.label}</Text> strand. This suggests that your interests, skills, and aptitudes are well-suited for this educational path.
                  </Text>
                  
                  <Text style={styles.paragraphText}>
                    Your results indicate that you have a natural inclination towards the subjects and career paths associated with this strand. This can serve as a valuable guide for your educational and career planning.
                  </Text>
                </View>
              </View>
            </View>
          </View>
  
          {/* Strand Breakdown */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="file-alt" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Compatibility</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.analysisContent}>
                <Text style={styles.sectionTitle}>Strand Compatibility Breakdown</Text>
                
                <View style={styles.strandBreakdown}>
                  {getPredictionStrengths().map((prediction, index) => (
                    <View style={styles.strandItem} key={index}>
                      <View style={styles.strandHeader}>
                        <Text style={styles.strandName}>{prediction.label}</Text>
                        <Text style={styles.strandScore}>{prediction.value.toFixed(1)}%</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${prediction.value}%`, backgroundColor: chartData.backgroundColors[index % chartData.backgroundColors.length] }
                          ]}
                        />
                      </View>
                      <Text style={styles.strandDescription}>
                        {prediction.label === "STEM" && "Science, Technology, Engineering, and Mathematics - Focuses on advanced concepts in science and mathematics."}
                        {prediction.label === "HUMSS" && "Humanities and Social Sciences - Focuses on human behavior, culture, and society."}
                        {prediction.label === "ABM" && "Accountancy, Business, and Management - Focuses on business principles and financial management."}
                        {prediction.label === "GAS" && "General Academic Strand - Provides a well-rounded academic foundation across multiple disciplines."}
                        {prediction.label === "ARTS" && "Arts and Design - Focuses on creative expression, design principles, and artistic techniques."}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
  
          {/* Recommendations Card */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="lightbulb" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Recommendations</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.recommendationsContent}>
                <Text style={styles.sectionTitle}>Next Steps Based on Your Results</Text>
                
                <View style={styles.recommendationsList}>
                  {getRecommendations().map((recommendation, index) => (
                    <View style={styles.recommendationItem} key={index}>
                      <View style={styles.recommendationIcon}>
                        <FontAwesome5 name="check" size={14} color="#fff" />
                      </View>
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.recommendationNote}>
                  <Text style={styles.noteText}>
                    Remember that these recommendations are based on your current assessment results. Your interests and skills may evolve over time, so it's important to stay open to exploring different paths.
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.fullWidthButton}
                  onPress={() => navigation.navigate("Portal")}
                >
                  <View style={styles.buttonContent}>
                    <View style={styles.buttonIcon}>
                      <FontAwesome5 name="graduation-cap" size={24} color="#fff" />
                    </View>
                    <View style={styles.buttonText}>
                      <Text style={styles.buttonTitle}>Continue Your Assessment</Text>
                      <Text style={styles.buttonSubtitle}>Get more personalized recommendations</Text>
                    </View>
                  </View>
                  <FontAwesome5 name="arrow-right" size={16} color="#fff" style={styles.arrowIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* No Data Placeholder for Summary Card */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome name="star" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Summary Report</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.summaryContent, styles.noDataContainer]}>
                <FontAwesome5 name="file-alt" size={48} color="#CCCCCC" />
                <Text style={styles.noDataText}>No summary report yet</Text>
                <Text style={styles.noDataSubtext}>Complete your assessment to see your personalized summary</Text>
              </View>
            </View>
          </View>
  
          {/* No Data Placeholder for Strand Breakdown */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="file-alt" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Strand Compatibility</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.analysisContent, styles.noDataContainer]}>
                <FontAwesome5 name="list" size={48} color="#CCCCCC" />
                <Text style={styles.noDataText}>No strand compatibility data yet</Text>
                <Text style={styles.noDataSubtext}>Complete your assessment to see how you match with different strands</Text>
              </View>
            </View>
          </View>
  
          {/* Get Started Card (instead of Recommendations) */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <FontAwesome5 name="lightbulb" size={20} color="#880000" />
                <Text style={styles.cardTitleText}>Get Started</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.getStartedContent}>
                <Text style={styles.sectionTitle}>Begin Your Strand Assessment</Text>
                
                <View style={styles.getStartedInfo}>
                  <Text style={styles.paragraphText}>
                    Take the assessment to discover which academic strand aligns best with your interests, skills, and career aspirations.
                  </Text>
                  
                  <Text style={styles.paragraphText}>
                    The assessment will analyze your responses across multiple dimensions to provide personalized recommendations for your educational journey.
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.fullWidthButton}
                  onPress={() => navigation.navigate("Portal")}
                >
                  <View style={styles.buttonContent}>
                    <View style={styles.buttonIcon}>
                      <FontAwesome5 name="play-circle" size={24} color="#fff" />
                    </View>
                    <View style={styles.buttonText}>
                      <Text style={styles.buttonTitle}>Start Your Assessment</Text>
                      <Text style={styles.buttonSubtitle}>Discover your academic path</Text>
                    </View>
                  </View>
                  <FontAwesome5 name="arrow-right" size={16} color="#fff" style={styles.arrowIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
// Add this function at the component level (outside any useEffect)
const refetchData = async () => {
  setLoading(true);
  setError(null);
  
  const token = await AsyncStorage.getItem("auth-token");
  if (!token) {
    console.log("No token found");
    setLoading(false);
    return;
  }

  try {
    const response = await axios.post("http://192.168.100.171:4000/api/auth/user", { token });

    if (response.data.user) {
      const { _id, name, gradeLevel, profilePicture } = response.data.user;
      setUser({ id: _id, name, gradeLevel, profilePicture });

      // Ensure valid user ID before fetching predictions
      if (_id && _id.length === 24) {
        fetchPredictions(_id, gradeLevel);
      } else {
        console.error("Invalid user ID:", _id);
        setError("User ID is invalid.");
      }
    }
  } catch (err) {
    console.error("Error fetching user:", err.response?.data || err);
    setError("Failed to fetch user data");
  } finally {
    setLoading(false);
  }
};

// Then in your useEffect
useEffect(() => {
  refetchData();
}, []);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header/Nav equivalent */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#880000" />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                refetchData();
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.profileImageWrapper}>
                  <Image
                    source={user.profilePicture?.url 
                      ? { uri: user.profilePicture.url }
                      : require("./assets/1.png")}
                    style={styles.profileImage}
                    onError={() => console.log("Profile image failed to load")}
                  />
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>{user.name || "Guest"}</Text>
                  <View style={styles.profileInfoItem}>
                    <FontAwesome5 name="graduation-cap" size={16} color="#666" style={styles.profileIcon} />
                    <Text style={styles.profileInfoText}>{user.gradeLevel || "Not specified"}</Text>
                  </View>
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>Student</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Dashboard Content */}
            <View style={styles.dashboardContent}>
              <View style={styles.welcomeMessage}>
                <Text style={styles.welcomeTitle}>Welcome to Your Dashboard</Text>
                <Text style={styles.welcomeText}>
                  Explore insightful predictions for your future strand, course, and career based on your profile and assessment results.
                </Text>
              </View>

              {/* Dashboard Tabs */}
              <View style={styles.dashboardTabs}>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'overview' && styles.activeTab]}
                  onPress={() => setActiveTab('overview')}
                >
                  <FontAwesome5 name="chart-bar" size={16} color={activeTab === 'overview' ? "#880000" : "#666"} />
                  <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'visualizations' && styles.activeTab]}
                  onPress={() => setActiveTab('visualizations')}
                >
                  <FontAwesome5 name="chart-pie" size={16} color={activeTab === 'visualizations' ? "#880000" : "#666"} />
                  <Text style={[styles.tabText, activeTab === 'visualizations' && styles.activeTabText]}>Visualizations</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'analysis' && styles.activeTab]}
                  onPress={() => setActiveTab('analysis')}
                >
                  <FontAwesome5 name="file-alt" size={16} color={activeTab === 'analysis' ? "#880000" : "#666"} />
                  <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>Analysis</Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'visualizations' && renderVisualizationsTab()}
              {activeTab === 'analysis' && renderAnalysisTab()}
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Footer equivalent */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>@ Edutrack All Rights Reserved 2025</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  header: {

    padding: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold"
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16
  },
  errorContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  errorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#880000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15
  },
    errorIconText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold"
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#333"
    },
    errorText: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
      marginBottom: 15
    },
    retryButton: {
      backgroundColor: "#880000",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5
    },
    retryButtonText: {
      color: "#fff",
      fontWeight: "bold"
    },
    profileCard: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 15,
      margin: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center"
    },
    profileImageWrapper: {
      width: 70,
      height: 70,
      borderRadius: 35,
      overflow: "hidden",
      marginRight: 15,
      backgroundColor: "#f0f0f0",
      alignItems: "center",
      justifyContent: "center"
    },
    profileImage: {
      width: "100%",
      height: "100%"
    },
    profileDetails: {
      flex: 1
    },
    profileName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 5
    },
    profileInfoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5
    },
    profileIcon: {
      marginRight: 8
    },
    profileInfoText: {
      fontSize: 14,
      color: "#666"
    },
    profileBadge: {
      backgroundColor: "#880000",
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
      alignSelf: "flex-start"
    },
    profileBadgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold"
    },
    dashboardContent: {
      padding: 15
    },
    welcomeMessage: {
      marginBottom: 20
    },
    welcomeTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 5
    },
    welcomeText: {
      fontSize: 14,
      color: "#666",
      lineHeight: 20
    },
    dashboardTabs: {
      flexDirection: "row",
      backgroundColor: "#fff",
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 5
    },
    tabText: {
      fontSize: 14,
      color: "#666",
      marginLeft: 5
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: "#880000"
    },
    activeTabText: {
      color: "#880000",
      fontWeight: "bold"
    },
    dashboardGrid: {
      marginBottom: 15
    },
    visualizationsGrid: {
      marginBottom: 15
    },
    dashboardCard: {
      backgroundColor: "#fff",
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      overflow: "hidden"
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0"
    },
    cardTitle: {
      flexDirection: "row",
      alignItems: "center"
    },
    cardTitleText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
      marginLeft: 8
    },
    cardContent: {
      padding: 15
    },
    chartContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 10
    },
    chart: {
      borderRadius: 8,
      padding: 5
    },
    chartLoading: {
      alignItems: "center",
      justifyContent: "center",
      height: 220
    },
    downloadButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#880000",
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5
    },
    downloadButtonText: {
      color: "#fff",
      marginLeft: 5,
      fontSize: 12
    },
    noDataMessage: {
      alignItems: "center",
      justifyContent: "center",
      height: 220,
      padding: 20
    },
    noDataText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#666",
      textAlign: "center",
      marginBottom: 8
    },
    noDataSubtext: {
      fontSize: 14,
      color: "#888",
      textAlign: "center"
    },
    guestMessage: {
      alignItems: "center",
      justifyContent: "center",
      height: 220,
      padding: 20
    },
    guestTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginTop: 15,
      marginBottom: 8
    },
    guestText: {
      fontSize: 14,
      color: "#666",
      textAlign: "center"
    },
    actionButtons: {
      marginTop: 5
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#f8f8f8",
      padding: 15,
      borderRadius: 8,
      marginBottom: 10
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center"
    },
    buttonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#880000",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 15
    },
    resultsIcon: {
      backgroundColor: "#880000"
    },
    assessmentIcon: {
      backgroundColor: "#008800"
    },
    buttonText: {
      flex: 1,
      color: "white"
    },
    buttonTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 3
    },
    buttonSubtitle: {
      fontSize: 12,
      color: "#666"
    },
    arrowIcon: {
      marginLeft: 10
    },
    analysisContainer: {
      marginBottom: 15
    },
    summaryContent: {
      padding: 5
    },
    summaryHeader: {
      marginBottom: 15
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 10
    },
    topPrediction: {
      flexDirection: "row",
      alignItems: "center"
    },
    predictionBadge: {
      backgroundColor: "#880000",
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginRight: 10
    },
    predictionBadgeText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16
    },
    predictionScore: {
      backgroundColor: "#f0f0f0",
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 5
    },
    predictionScoreText: {
      color: "#333",
      fontWeight: "bold",
      fontSize: 16
    },
    summaryText: {
      marginTop: 10
    },
    paragraphText: {
      fontSize: 14,
      color: "#666",
      lineHeight: 20,
      marginBottom: 10
    },
    boldText: {
      fontWeight: "bold",
      color: "#333"
    },
    analysisContent: {
      padding: 5
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 15
    },
    strandBreakdown: {
      marginTop: 5
    },
    strandItem: {
      marginBottom: 20
    },
    strandHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5
    },
    strandName: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333"
    },
    strandScore: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#880000"
    },
    progressBar: {
      height: 8,
      backgroundColor: "#f0f0f0",
      borderRadius: 4,
      marginBottom: 8,
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      borderRadius: 4
    },
    strandDescription: {
      fontSize: 13,
      color: "#666",
      lineHeight: 18
    },
    recommendationsContent: {
      padding: 5
    },
    recommendationsList: {
      marginVertical: 10
    },
    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12
    },
    recommendationIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#880000",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      marginTop: 2
    },
    recommendationText: {
      flex: 1,
      fontSize: 14,
      color: "#333",
      lineHeight: 20
    },
    recommendationNote: {
      backgroundColor: "#f8f8f8",
      padding: 15,
      borderRadius: 8,
      marginVertical: 15
    },
    noteText: {
      fontSize: 13,
      color: "#666",
      lineHeight: 18,
      fontStyle: "italic"
    },
    fullWidthButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#880000",
      padding: 15,
      borderRadius: 8,
      marginTop: 10
    },
    centeredText: {
      textAlign: "center",
      color: "#666",
      fontSize: 14,
      padding: 20
    },
    footer: {
      backgroundColor: "#880000",
      padding: 10,
      alignItems: "center"
    },
    footerText: {
      color: "#fff",
      fontSize: 12
    },
    noPredictionsMessage: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    noPredictionsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 15,
      marginBottom: 10,
      textAlign: 'center',
    },
    noPredictionsText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 20,
    },
    startAssessmentButton: {
      backgroundColor: '#880000',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 10,
    },
    startAssessmentButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    
    // Modified action button when it's the primary action
    primaryActionButton: {
      backgroundColor: '#f8f8f8',
      borderWidth: 2,
      borderColor: '#880000',
    },
    noDataContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      minHeight: 200,
    },
    noDataText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#555555',
      marginTop: 16,
      textAlign: 'center',
    },
    noDataSubtext: {
      fontSize: 14,
      color: '#888888',
      marginTop: 8,
      textAlign: 'center',
    },
    getStartedContent: {
      padding: 16,
    },
    getStartedInfo: {
      marginVertical: 16,
    },
  });
  
  export default Dashboard;