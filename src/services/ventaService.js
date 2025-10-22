import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar token en headers
const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Crear nueva venta
export const crearVenta = async (ventaData) => {
  try {
    await setAuthToken();
    const response = await api.post('/ventas', ventaData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al crear venta';
  }
};

// Obtener todas las ventas
export const obtenerVentas = async () => {
  try {
    await setAuthToken();
    const response = await api.get('/ventas');
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener ventas';
  }
};

// Obtener ventas por fecha
export const obtenerVentasPorFecha = async (fechaInicio, fechaFin) => {
  try {
    await setAuthToken();
    const response = await api.get('/ventas/fecha', {
      params: {
        fechaInicio,
        fechaFin,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener ventas por fecha';
  }
};

// Obtener estadísticas de ventas
export const obtenerEstadisticas = async (fecha) => {
  try {
    await setAuthToken();
    const response = await api.get('/ventas/estadisticas', {
      params: { fecha },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener estadísticas';
  }
};

// Obtener venta por ID
export const obtenerVentaPorId = async (id) => {
  try {
    await setAuthToken();
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener venta';
  }
};
