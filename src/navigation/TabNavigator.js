import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// Screens
import ProductosScreen from '../screens/ProductosScreen';
import MesasScreen from '../screens/MesasScreen';
import OrdenesScreen from '../screens/OrdenesScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import VentasScreen from '../screens/VentasScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 8 : 8,
          height: Platform.OS === 'android' ? 60 + insets.bottom : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Productos"
        component={ProductosScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🍔" color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Mesas"
        component={MesasScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🪑" color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Órdenes"
        component={OrdenesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="📋" color={color} />
          ),
        }}
      />

      {isAdmin && (
        <>
          <Tab.Screen
            name="Ventas"
            component={VentasScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <TabIcon emoji="💰" color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Usuarios"
            component={UsuariosScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <TabIcon emoji="👥" color={color} />
              ),
            }}
          />
        </>
      )}

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="👤" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Componente auxiliar para iconos emoji
const TabIcon = ({ emoji, color }) => {
  return (
    <Text style={{ fontSize: 24 }}>
      {emoji}
    </Text>
  );
};

export default TabNavigator;
