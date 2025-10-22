import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login de usuario
export const login = async (correo, contrasena) => {
  try {
    const response = await api.post('/usuarios/login', {
      correo,
      contrasena,
    });

    if (response.data.token) {
      // Guardar token en AsyncStorage
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al iniciar sesión';
  }
};

// Registro de usuario
export const register = async (nombre, correo, contrasena, rol = 'mesero') => {
  try {
    const response = await api.post('/usuarios/registro', {
      nombre,
      correo,
      contrasena,
      rol,
    });

    if (response.data.token) {
      // Guardar token en AsyncStorage
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al registrar usuario';
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

// Obtener token guardado
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
};

// Obtener datos del usuario guardados
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return null;
  }
};
