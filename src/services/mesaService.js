import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar token en headers
const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Obtener todas las mesas
export const obtenerMesas = async () => {
  try {
    await setAuthToken();
    const response = await api.get('/mesas');
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener mesas';
  }
};

// Obtener una mesa por ID
export const obtenerMesaPorId = async (id) => {
  try {
    await setAuthToken();
    const response = await api.get(`/mesas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener mesa';
  }
};

// Crear mesa (solo admin)
export const crearMesa = async (mesaData) => {
  try {
    await setAuthToken();
    const response = await api.post('/mesas', mesaData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al crear mesa';
  }
};

// Actualizar mesa
export const actualizarMesa = async (id, mesaData) => {
  try {
    await setAuthToken();
    const response = await api.put(`/mesas/${id}`, mesaData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al actualizar mesa';
  }
};

// Eliminar mesa (solo admin)
export const eliminarMesa = async (id) => {
  try {
    await setAuthToken();
    const response = await api.delete(`/mesas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al eliminar mesa';
  }
};
