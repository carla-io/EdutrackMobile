import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://192.168.100.171:4000/api/auth/get-all-users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        Toast.show({ type: "error", text1: "Failed to fetch users." });
      }
    };

    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://192.168.100.171:4000/api/auth/delete-user/${id}`);
      setUsers(users.filter((user) => user._id !== id));
      Toast.show({ type: "success", text1: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      Toast.show({ type: "error", text1: "Failed to delete user." });
    }
  };

  const confirmDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => deleteUser(id), style: "destructive" },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      <View style={styles.tableContainer}>
        {users.map((user, index) => (
          <View key={user._id} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
            <Text style={styles.cell}>{user.name}</Text>
            <Text style={styles.cell}>{user.email}</Text>
            <Text style={styles.cell}>{user.gradeLevel}</Text>
            <Text style={styles.cell}>{user.role}</Text>
            <Text style={styles.cell}>{user.isActive ? "Active" : "Disabled"}</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(user._id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#790000",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  evenRow: {
    backgroundColor: "#f9f9f9",
  },
  oddRow: {
    backgroundColor: "#fff",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  deleteButton: {
    backgroundColor: "#790000",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ManageUsers;
