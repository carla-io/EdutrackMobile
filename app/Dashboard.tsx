import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;

const Dashboard = () => {
  const [user, setUser] = useState({ name: "", gradeLevel: "", profilePicture: "", id: "" });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post("http://192.168.100.171:4000/api/auth/user", { token });
        if (response.data.user) {
          const { _id, name, gradeLevel, profilePicture } = response.data.user;
          setUser({ id: _id, name, gradeLevel, profilePicture });
          fetchPredictions(_id, gradeLevel);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
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

        setChartData({
          labels,
          datasets: [{ data: values }],
        });
      }
    } catch (err) {
      console.error("Error fetching predictions:", err);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#800000" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: user.profilePicture?.url || "https://via.placeholder.com/100" }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.profileName}>{user.name || "Guest"}</Text>
          <Text style={styles.whiteText}>Current Grade/Year: {user.gradeLevel || "Log in first"}</Text>
        </View>
      </View>

      <Text style={styles.description}>Explore predictions for your future strand and career.</Text>

      {chartData ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Your Predicted Strands</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisSuffix="%"
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(128, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            style={{ marginVertical: 8, borderRadius: 8 }}
            fromZero
          />
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading chart...</Text>
      )}

      <View style={styles.buttonContainer}>
        <Button title="View Result" onPress={() => router.push("GraphScreen")} color="#800000" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Start the Process" onPress={() => router.push("Portal")} color="#B22222" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 20 },
  loader: { flex: 1, justifyContent: "center" },
  profileHeader: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  profileImage: { width: 50, height: 50, borderRadius: 50, marginRight: 15 },
  whiteText: {
    color: 'white', // Set text color to white
    fontSize: 14,
  },
  profileName: { fontSize: 20, fontWeight: "bold", color: "white" },
  description: { textAlign: "center", marginVertical: 10 },
  chartContainer: { alignItems: "center", marginTop: 10 },
  chartTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  buttonContainer: { marginTop: 20 },
  loadingText: { textAlign: "center" },
});

export default Dashboard;
