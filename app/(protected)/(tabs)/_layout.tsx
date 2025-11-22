import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{tabBarActiveTintColor: "#660033", headerShown: false}}>
      <Tabs.Screen name = "index"
        options = {{
          title : "Home",
          tabBarIcon: ({color}) => (
            <AntDesign name="home" size={24} color={color} />
          )
        }} />
      <Tabs.Screen name = "walks"
        options = {{
          title: "My Walk",
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="dog-side" size={24} color={color} />
          )
        }} />
      <Tabs.Screen name = "profile"
        options = {{
          title: "Profile",
          tabBarIcon: ({color}) => (
            <Ionicons name="person" size={24} color={color} />
          )
        }} />
    </Tabs>
  )
}
