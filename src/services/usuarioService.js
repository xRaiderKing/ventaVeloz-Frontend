import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar token en headers
const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Obtener perfil del usuario autenticado
export const obtenerPerfil = async () => {
  try {
    await setAuthToken();
    const response = await api.get('/usuarios/perfil');
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener perfil';
  }
};

// Obtener todos los usuarios (solo admin)
export const obtenerUsuarios = async () => {
  try {
    await setAuthToken();
    const response = await api.get('/usuarios');
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener usuarios';
  }
};

// Obtener un usuario por ID (solo admin)
export const obtenerUsuarioPorId = async (id) => {
  try {
    await setAuthToken();
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener usuario';
  }
};

// Crear nuevo usuario (solo admin)
export const crearUsuario = async (usuarioData) => {
  try {
    await setAuthToken();
    const response = await api.post('/usuarios/registro', usuarioData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al crear usuario';
  }
};

// Actualizar usuario (solo admin)
export const actualizarUsuario = async (id, usuarioData) => {
  try {
    await setAuthToken();
    const response = await api.put(`/usuarios/${id}`, usuarioData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al actualizar usuario';
  }
};

// Eliminar usuario (solo admin)
export const eliminarUsuario = async (id) => {
  try {
    await setAuthToken();
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al eliminar usuario';
  }
};
