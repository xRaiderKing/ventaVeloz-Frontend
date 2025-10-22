import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import MesaDetalleScreen from '../screens/MesaDetalleScreen';
import NuevaOrdenScreen from '../screens/NuevaOrdenScreen';
import TicketScreen from '../screens/TicketScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // Rutas autenticadas
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="MesaDetalle" component={MesaDetalleScreen} />
            <Stack.Screen name="NuevaOrden" component={NuevaOrdenScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
          </>
        ) : (
          // Rutas públicas
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppNavigator;
