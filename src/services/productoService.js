import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar token en headers
const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Obtener todos los productos
export const obtenerProductos = async () => {
  try {
    await setAuthToken();
    const response = await api.get('/productos');
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener productos';
  }
};

// Obtener un producto por ID
export const obtenerProductoPorId = async (id) => {
  try {
    await setAuthToken();
    const response = await api.get(`/productos/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al obtener producto';
  }
};

// Crear producto (solo admin)
export const crearProducto = async (productoData) => {
  try {
    await setAuthToken();
    const response = await api.post('/productos', productoData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al crear producto';
  }
};

// Actualizar producto (solo admin)
export const actualizarProducto = async (id, productoData) => {
  try {
    await setAuthToken();
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al actualizar producto';
  }
};

// Eliminar producto (solo admin)
export const eliminarProducto = async (id) => {
  try {
    await setAuthToken();
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al eliminar producto';
  }
};

// Subir imagen de producto (solo admin)
export const subirImagenProducto = async (id, imageUri) => {
  try {
    await setAuthToken();
    
    const formData = new FormData();
    
    // Obtener extensión del archivo
    const fileExtension = imageUri.split('.').pop();
    const fileName = `producto-${Date.now()}.${fileExtension}`;
    
    formData.append('imagen', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileExtension}`,
    });

    const response = await api.post(`/productos/${id}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || error.response?.data?.message || 'Error al subir imagen';
  }
};

// Eliminar imagen de producto (solo admin)
export const eliminarImagenProducto = async (id) => {
  try {
    await setAuthToken();
    const response = await api.delete(`/productos/${id}/imagen`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.mensaje || 'Error al eliminar imagen';
  }
};

// Obtener URL completa de imagen
export const obtenerUrlImagen = (imagePath) => {
  if (!imagePath) return null;
  
  // Si la imagen ya es una URL completa (Cloudinary), retornarla directamente
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si es una ruta local antigua, construir URL con el backend
  const baseURL = api.defaults.baseURL.replace('/api', '');
  return `${baseURL}/${imagePath}`;
};
