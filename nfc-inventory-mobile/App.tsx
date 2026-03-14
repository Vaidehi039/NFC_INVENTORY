import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ScanScreen from "./src/screens/ScanScreen";

/* ================= STACK NAVIGATION ================= */

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>

      {/* Status bar for Android/iOS */}
      <StatusBar style="auto" />

      <Stack.Navigator
        initialRouteName="Login"     
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right"           
        }}
      >

        {/* Authentication Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        {/* Main App Screens */}
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
        />

        <Stack.Screen
          name="Scan"
          component={ScanScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>
  );
}