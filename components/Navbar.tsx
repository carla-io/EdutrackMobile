import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Get screen dimensions for responsive design
  const { width } = Dimensions.get("window");

  // Create spinning animation for menu icon
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("auth-token");
        const userData = await AsyncStorage.getItem("user");

        if (token && userData) {
          const user = JSON.parse(userData);
          setRole(user.role);
          setUsername(user.name || "User");
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
    // Menu slide animation
    Animated.timing(slideAnim, {
      toValue: isOpen ? -280 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Background fade animation
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 0 : 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Spin animation for menu icon
    Animated.timing(spinValue, {
      toValue: isOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // Fixed the missing parentheses
      setIsLoggedIn(false);
      setRole(null);
      toggleMenu(); // Close menu when logging out
      router.replace("/Login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderNavItem = (route, label, iconName) => (
    <TouchableOpacity
      style={styles.navItem}
      onPress={() => {
        router.push(route);
        toggleMenu();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.navItemContent}>
        <Icon name={iconName} size={18} color="maroon" style={styles.navItemIcon} />
        <Text style={styles.navLink}>{label}</Text>
      </View>
      <Icon name="chevron-right" size={12} color="#888" />
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="maroon" />
      
      {/* Top Navbar */}
      <LinearGradient
        colors={["#800000", "#5d0000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topNavbar}
      >
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name={isOpen ? "times" : "bars"} size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Icon name="book" size={24} color="#fff" />
          <Text style={styles.title}>EDUTRACKER</Text>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="sign-out" size={18} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/Login")}
          >
            <Icon name="sign-in" size={18} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Dark overlay when menu is open */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View
            style={[
              styles.overlay,
              { opacity: fadeAnim, display: isOpen ? "flex" : "none" },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar Menu */}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        {isLoggedIn && (
          <View style={styles.userInfoSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.usernameText}>{username}</Text>
            <Text style={styles.roleText}>{role === "admin" ? "Administrator" : "Student"}</Text>
          </View>
        )}

        <View style={styles.navItemsContainer}>
          {isLoggedIn && (
            <>
              {role === "user" && (
                <>
                  {renderNavItem("/About", "Home", "home")}
                  {renderNavItem("/Dashboard", "Dashboard", "dashboard")}
                  {renderNavItem("/UserProfile", "User Profile", "user")}
                  {renderNavItem("/Career", "Career", "briefcase")}
                  {renderNavItem("/SHSstrands", "SHS Strands", "graduation-cap")}
                  {renderNavItem("/Contact", "Contact", "envelope")}
                  {renderNavItem("/Courses", "Courses", "list")}
                </>
              )}

              {role === "admin" && (
                <>
                  {renderNavItem("/admin/AdminDashboard", "Admin Dashboard", "tachometer")}
                  {renderNavItem("/admin/ManageUsers", "Manage Users", "users")}
                 
                </>
              )}
            </>
          )}
        </View>
        
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>EDUTRACKER v1.0</Text>
          <Text style={styles.copyrightText}>© 2025 All Rights Reserved</Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  topNavbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 70,
    paddingHorizontal: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "rgba(0, 128, 0, 0.7)",
    borderRadius: 30,
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 50,
  },
  sidebar: {
    position: "absolute",
    top: 70,
    width: 280,
    height: "100%",
    backgroundColor: "#fff",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 100,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  userInfoSection: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f8f8",
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "maroon",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  usernameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    color: "maroon",
    backgroundColor: "#f0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  navItemsContainer: {
    flex: 1,
    paddingVertical: 15,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  navItemIcon: {
    marginRight: 15,
    width: 20,
  },
  navLink: {
    fontSize: 16,
    color: "#444",
    fontWeight: "500",
  },
  footerSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  copyrightText: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 5,
  },
});

export default Navbar;