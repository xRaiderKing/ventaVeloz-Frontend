import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar token en headers
const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Obtener todas las órdenes
export const obtenerOrdenes = async () => {
  try {
    await setAuthToken();
    const response = await api.get('/ordenes');
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener órdenes';
  }
};

// Obtener una orden por ID
export const obtenerOrdenPorId = async (id) => {
  try {
    await setAuthToken();
    const response = await api.get(`/ordenes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener orden';
  }
};

// Crear orden
export const crearOrden = async (ordenData) => {
  try {
    await setAuthToken();
    const response = await api.post('/ordenes', ordenData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al crear orden';
  }
};

// Actualizar orden
export const actualizarOrden = async (id, ordenData) => {
  try {
    await setAuthToken();
    const response = await api.put(`/ordenes/${id}`, ordenData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al actualizar orden';
  }
};

// Eliminar orden
export const eliminarOrden = async (id) => {
  try {
    await setAuthToken();
    const response = await api.delete(`/ordenes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al eliminar orden';
  }
};
