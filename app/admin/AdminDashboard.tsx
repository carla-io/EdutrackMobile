import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import axios from "axios";
import { LineChart, Grid, XAxis } from "react-native-svg-charts";
import { PieChart } from "react-native-chart-kit";
import * as shape from "d3-shape";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Circle, G, Text as SvgText } from "react-native-svg";

const AdminDashboard = () => {
  const [registrationData, setRegistrationData] = useState([]);
  const [registrationDates, setRegistrationDates] = useState([]);
  const [gradeLevelData, setGradeLevelData] = useState([]);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = await AsyncStorage.getItem("admin-name");
        if (storedName) setAdminName(storedName);
      } catch (error) {
        console.error("Error fetching admin name:", error);
      }
    };

    const fetchRegistrationData = async () => {
        try {
          const response = await axios.get("http://192.168.100.171:4000/api/auth/registrations-over-time");
      
          // Debugging: Log API response
          console.log("Fetched Data:", response.data);
      
          const formattedData = response.data.data.map((item) => ({
            date: item._id ? item._id.substring(5) : "Unknown",  // Avoid crashing if _id is undefined
            count: item.count || 0,  // Ensure count is always a number
          }));
      
          setRegistrationData(formattedData);
        } catch (error) {
          console.error("Error fetching registration data:", error);
        }
      };
      

    const fetchGradeLevelData = async () => {
      try {
        const response = await axios.get(
          "http://192.168.85.237:4000/api/auth/grade-level-distribution"
        );
        const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#790000"];
        const formattedData = response.data.data.map((item, index) => ({
          name: item._id,
          population: item.count,
          color: COLORS[index % COLORS.length],
          legendFontColor: "#000",
          legendFontSize: 12,
        }));

        setGradeLevelData(formattedData);
      } catch (error) {
        console.error("Error fetching grade level data:", error);
      }
    };

    fetchUserData();
    fetchRegistrationData();
    fetchGradeLevelData();
  }, []);

  // Component to add data points with numbers
  const DataPoints = ({ data }) => (
    <G>
      {data.map((value, index) => (
        <G key={index}>
          <Circle cx={index * 35} cy={200 - value * 10} r={4} fill="#790000" />
          <SvgText
            x={index * 35}
            y={200 - value * 10 - 10}
            fontSize="12"
            fill="#790000"
            textAnchor="middle"
          >
            {value}
          </SvgText>
        </G>
      ))}
    </G>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Admin Profile Section */}
      <View style={styles.profileContainer}>
        <Text style={styles.avatar}>👤</Text>
        <View>
          <Text style={styles.adminName}>{adminName}</Text>
          <Text style={styles.adminRole}>
            ROLE: <Text style={styles.adminRoleHighlight}>ADMIN</Text>
          </Text>
        </View>
      </View>

      {/* Dashboard Title */}
      <Text style={styles.dashboardTitle}>
        Here’s the daily record of our insights on our website today.
      </Text>

      {/* User Registrations Over Time Chart */}
      <View style={{ height: 250 }}>
  {/* Line Chart */}
  <LineChart
    style={{ flex: 1 }}
    data={registrationData.map((item) => item.count)} // Only numbers!
    svg={{ stroke: "#790000", strokeWidth: 3 }}
    contentInset={{ top: 20, bottom: 20 }}
    curve={shape.curveLinear}
  >
    <Grid />
  </LineChart>

  {/* X-Axis Labels */}
  <XAxis
    style={{ marginTop: 10 }}
    data={registrationData.map((_, index) => index)} // Indices instead of objects
    formatLabel={(value, index) => registrationData[index]?.date || ""}
    contentInset={{ left: 20, right: 20 }}
    svg={{ fontSize: 10, fill: "black" }}
  />
</View>

      {/* Grade Level Distribution Pie Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Grade Level Distribution</Text>
        <PieChart
          data={gradeLevelData}
          width={350}
          height={250}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  avatar: {
    fontSize: 40,
    marginRight: 15,
  },
  adminName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#790000",
  },
  adminRole: {
    fontSize: 14,
    fontWeight: "bold",
  },
  adminRoleHighlight: {
    color: "#790000",
  },
  dashboardTitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  lineChart: {
    height: 200,
  },
  xAxis: {
    marginTop: 10,
    height: 40, // Increase height for rotation
  },
});

export default AdminDashboard;
