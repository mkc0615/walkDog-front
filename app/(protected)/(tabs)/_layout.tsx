import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{tabBarActiveTintColor: "coral", headerShown: false}}>
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
    </Tabs>
  )
}
