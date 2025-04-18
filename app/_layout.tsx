import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../components/Navbar";

const Layout = () => {
  const pathname = usePathname().toLowerCase();

  console.log("Current Pathname:", pathname); // Debugging

  // Check if the pathname contains "login" or "register"
  const hideNavbar = pathname.includes("login") || pathname.includes("register") || pathname === "/";

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Show Navbar only when not on login, register, or index */}
      {!hideNavbar && <Navbar />}

      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
    marginTop: 2,
    paddingHorizontal: 0,
  },
});

export default Layout;
