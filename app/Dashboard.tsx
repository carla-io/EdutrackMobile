import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome5";

const screenWidth = Dimensions.get("window").width;

const Dashboard = () => {
  const [user, setUser] = useState({ name: "", gradeLevel: "", profilePicture: "", id: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showFullStats, setShowFullStats] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  
  const router = useRouter();

  const fetchUserAndData = async () => {
    const token = await AsyncStorage.getItem("auth-token");
    if (!token) {
      setLoading(false);
      setErrorMessage("Please log in to view your dashboard");
      return;
    }

    try {
      const response = await axios.post("http://192.168.100.171:4000/api/auth/user", { token });
      if (response.data.user) {
        const { _id, name, gradeLevel, profilePicture } = response.data.user;
        setUser({ id: _id, name, gradeLevel, profilePicture });
        await fetchPredictions(_id, gradeLevel);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setErrorMessage("Unable to load your profile. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserAndData();
    
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchPredictions = async (userId, gradeLevel) => {
    try {
      const apiUrl =
        gradeLevel === "Junior High School"
          ? `http://192.168.100.171:4000/api/predictions/${userId}`
          : `http://192.168.100.171:4000/api/prediction_shs/${userId}`;

      const response = await axios.get(apiUrl);
      if (response.data.success) {
        const predictions = response.data.data;
        const labels = Object.keys(predictions).slice(0, 5);
        const values = labels.map((key) => predictions[key].percentage || 0);

        // Sort data for better visualization (optional)
        const combined = labels.map((label, index) => ({
          label,
          value: values[index],
        }));
        combined.sort((a, b) => b.value - a.value);

        setChartData({
          labels: combined.map(item => item.label),
          datasets: [{ data: combined.map(item => item.value) }],
          colors: [
            'rgba(128, 0, 0, 0.9)',
            'rgba(170, 0, 0, 0.85)',
            'rgba(200, 0, 0, 0.8)',
            'rgba(220, 0, 0, 0.75)',
            'rgba(240, 0, 0, 0.7)'
          ]
        });
      }
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setErrorMessage("Unable to load predictions. Please try again later.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorMessage("");
    await fetchUserAndData();
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "#2ecc71";
    if (percentage >= 60) return "#3498db";
    if (percentage >= 40) return "#f39c12";
    return "#e74c3c";
  };

  // Function to render prediction cards instead of just a chart
  const renderPredictionCards = () => {
    if (!chartData) return null;
    
    const topPredictions = chartData.labels.map((label, index) => ({
      strand: label,
      percentage: chartData.datasets[0].data[index],
      color: chartData.colors[index],
    }));

    return (
      <View style={styles.predictionCardsContainer}>
        {topPredictions.slice(0, showFullStats ? 5 : 3).map((prediction, index) => (
          <Animated.View 
            key={index}
            style={[
              styles.predictionCard,
              { 
                transform: [
                  { translateY: slideUpAnim },
                  { scale: scaleAnim }
                ],
                opacity: fadeAnim,
                backgroundColor: index === 0 ? "#f8f4ff" : "#fff",
                borderLeftColor: prediction.color,
              }
            ]}
          >
            <View style={styles.predictionCardContent}>
              <View style={styles.predictionCardHeader}>
                <Text style={styles.predictionStrand}>{prediction.strand}</Text>
                {index === 0 && (
                  <View style={styles.topMatchBadge}>
                    <Text style={styles.topMatchText}>Best Match</Text>
                  </View>
                )}
              </View>

              <View style={styles.predictionCardBody}>
                <View style={styles.percentageContainer}>
                  <Text style={styles.percentageValue}>{Math.round(prediction.percentage)}%</Text>
                  <Text style={styles.percentageLabel}>Match</Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${prediction.percentage}%`,
                        backgroundColor: prediction.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        ))}
        
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setShowFullStats(!showFullStats)}
        >
          <Text style={styles.toggleButtonText}>
            {showFullStats ? "Show Less" : "Show All Predictions"}
          </Text>
          <Icon 
            name={showFullStats ? "chevron-up" : "chevron-down"} 
            size={12} 
            color="#800000" 
            style={styles.toggleIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };
  const handleViewFinalResult = () => {
    if (!user || !user.gradeLevel) {
      setErrorMessage("Grade level information is missing.");
      return;
    }
  
    if (user.gradeLevel === "Junior High School") {
      router.push("/Finaljhs");
    } else if (user.gradeLevel === "Senior High School") {
      router.push("/Finalshs");
    } else {
      router.push("/Finalcollege");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#800000" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#800000"]} />
        }
      >
        {/* Header Card with User Profile */}
        <Animated.View 
          style={[styles.cardContainer, {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }]}
        >
          <LinearGradient
            colors={["#800000", "#b30000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: user.profilePicture?.url || "https://via.placeholder.com/100" }}
                style={styles.profileImage}
              />
              <View style={styles.onlineBadge} />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.profileName}>{user.name || "Guest"}</Text>
              <View style={styles.gradeBadge}>
                <Icon name="graduation-cap" size={12} color="#fff" />
                <Text style={styles.gradeText}>{user.gradeLevel || "Student"}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push("UserProfile")}
            >
              <Icon name="user-cog" size={16} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Information Card */}
        <Animated.View 
          style={[styles.infoCard, {
            opacity: fadeAnim,
            transform: [
              { translateY: slideUpAnim },
              { scale: scaleAnim }
            ]
          }]}
        >
          <View style={styles.infoCardHeader}>
            <Icon name="lightbulb" size={16} color="#800000" />
            <Text style={styles.infoCardTitle}>Your Education Path</Text>
          </View>
          
          <Text style={styles.infoCardText}>
            Based on your assessments, we've analyzed your strengths and 
            preferences to suggest educational paths that might suit you best.
          </Text>
          
          <View style={styles.statsSummary}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{chartData?.labels.length || 0}</Text>
              <Text style={styles.statLabel}>Matched Strands</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {chartData ? Math.round(Math.max(...chartData.datasets[0].data)) : 0}%
              </Text>
              <Text style={styles.statLabel}>Top Match</Text>
            </View>
          </View>
        </Animated.View>

        {/* Error Message Display */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-circle" size={24} color="#e74c3c" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Prediction Results Cards */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Strand Predictions</Text>
            <TouchableOpacity onPress={() => router.push("GraphScreen")}>
              <Text style={styles.seeAllButton}>See Details</Text>
            </TouchableOpacity>
          </View>
          
          {chartData ? (
            renderPredictionCards()
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="chart-bar" size={40} color="#ccc" />
              <Text style={styles.noDataText}>No prediction data available</Text>
              <Text style={styles.noDataSubtext}>
                Complete your assessment to see your strand predictions
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push("Portal")}
          >
            <LinearGradient
              colors={["#800000", "#b30000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Icon name="play-circle" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Start Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewFinalResult}
          >
            <Icon name="chart-pie" size={16} color="#800000" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>View Full Results</Text>
          </TouchableOpacity>
        </View>

        {/* Charts Section */}
        {chartData && (
          <Animated.View 
            style={[styles.chartContainer, {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }]}
          >
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Prediction Chart</Text>
              <Icon name="chart-bar" size={16} color="#800000" />
            </View>
            
            <BarChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              yAxisSuffix="%"
              fromZero
              showValuesOnTopOfBars
              segments={5}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1, index) => chartData.colors[index] || `rgba(128, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.7,
                propsForBackgroundLines: {
                  strokeDasharray: "5, 5",
                  strokeWidth: 1,
                },
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              style={styles.chart}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: { 
    padding: 16,
    paddingBottom: 30,
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#800000",
  },
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  onlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2ecc71",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  profileName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "white",
    marginBottom: 4,
  },
  gradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  gradeText: {
    color: "white",
    fontSize: 12,
    marginLeft: 4,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#800000",
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  statsSummary: {
    flexDirection: "row",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 15,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#800000",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: "#eee",
    marginHorizontal: 15,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 10,
    color: "#b91c1c",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  seeAllButton: {
    fontSize: 14,
    color: "#800000",
    fontWeight: "500",
  },
  predictionCardsContainer: {
    marginBottom: 20,
  },
  predictionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 5,
  },
  predictionCardContent: {
    padding: 16,
  },
  predictionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  predictionStrand: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  topMatchBadge: {
    backgroundColor: "#800000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topMatchText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  predictionCardBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentageContainer: {
    width: 60,
    alignItems: "center",
  },
  percentageValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000",
  },
  percentageLabel: {
    fontSize: 12,
    color: "#666",
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginLeft: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#800000",
    fontWeight: "500",
  },
  toggleIcon: {
    marginLeft: 5,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 12,
    marginBottom: 20,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  actionButtonsContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#800000",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#800000",
    fontSize: 15,
    fontWeight: "500",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 0,
  },
});

export default Dashboard;