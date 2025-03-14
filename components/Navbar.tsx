import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(null); // State to store the user role
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const router = useRouter();
  const slideAnim = useState(new Animated.Value(-220))[0]; // Sidebar animation

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("auth-token");
        const userData = await AsyncStorage.getItem("user"); // Retrieve full user object

        if (token && userData) {
          const user = JSON.parse(userData);
          setRole(user.role); // Extract and set user role
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const toggleMenu = () => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? -220 : 0, // Slide in and out
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear; // Remove user data
      setIsLoggedIn(false);
      setRole(null);
      router.replace("/Login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <View style={styles.topNavbar}>
        <TouchableOpacity onPress={toggleMenu}>
          <Icon name="bars" size={24} color="maroon" style={styles.icon} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Icon name="book" size={24} color="maroon" />
          <Text style={styles.title}>EDUTRACKER</Text>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sidebar (Slide-out menu) */}
      <TouchableWithoutFeedback onPress={() => isOpen && toggleMenu()}>
        <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
          {/* ✅ Show Only If User is Logged In */}
          {isLoggedIn && (
            <>
              {/* ✅ User Links (Only If Role is "user") */}
              {role === "user" && (
                <>
                  <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push("/Dashboard")}
                  >
                    <Text style={styles.navLink}>Home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push("/About")}
                  >
                    <Text style={styles.navLink}>About</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push("/UserProfile")}
                  >
                    <Text style={styles.navLink}>User Profile</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ✅ Admin Links (Only If Role is "admin") */}
              {role === "admin" && (
                <>
                  <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push("/admin/AdminDashboard")}
                  >
                    <Text style={styles.navLink}>Admin Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push("/admin/ManageUsers")}
                  >
                    <Text style={styles.navLink}>Manage Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push("/admin/Reports")}
                  >
                    <Text style={styles.navLink}>Reports</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  topNavbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "maroon",
    marginLeft: 10,
  },
  icon: {
    marginLeft: 10,
  },
  logoutButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: "maroon",
    borderRadius: 5,
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
  loginButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: "green",
    borderRadius: 5,
  },
  loginText: {
    color: "white",
    fontWeight: "bold",
  },
  sidebar: {
    position: "absolute",
    top: 60,
    left: 0,
    width: 220,
    height: "100%",
    backgroundColor: "#f5f5f5",
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 100,
  },
  navItem: {
    paddingVertical: 10,
  },
  navLink: {
    fontSize: 16,
    color: "maroon",
    fontWeight: "bold",
  },
});

export default Navbar;
