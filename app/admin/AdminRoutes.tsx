import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AdminDashboard from "../admin/AdminDashboard";
import ManageUsers from "../admin/ManageUsers";


const AdminStack = createStackNavigator();

const AdminRoutes = () => {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen name="/admin/AdminDashboard" component={AdminDashboard} />
      <AdminStack.Screen name="ManageUsers" component={ManageUsers} />
    </AdminStack.Navigator>
  );
};

export default AdminRoutes;
