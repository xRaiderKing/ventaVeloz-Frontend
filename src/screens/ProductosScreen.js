import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as productoService from '../services/productoService';
import * as ImagePicker from 'expo-image-picker';

const ProductosScreen = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    descripcion: '',
    disponible: true,
  });
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await productoService.obtenerProductos();
      setProductos(data);
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (producto = null) => {
    if (producto) {
      setEditando(true);
      setProductoSeleccionado(producto);
      setFormData({
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: producto.precio.toString(),
        descripcion: producto.descripcion || '',
        disponible: producto.disponible,
      });
    } else {
      setEditando(false);
      setProductoSeleccionado(null);
      setFormData({
        nombre: '',
        categoria: '',
        precio: '',
        descripcion: '',
        disponible: true,
      });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setProductoSeleccionado(null);
    setImagenSeleccionada(null);
  };

  const seleccionarImagen = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagenSeleccionada(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const tomarFoto = async () => {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la cámara');
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagenSeleccionada(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const mostrarOpcionesImagen = () => {
    Alert.alert(
      'Agregar Imagen',
      'Selecciona una opción',
      [
        {
          text: 'Tomar Foto',
          onPress: tomarFoto,
        },
        {
          text: 'Elegir de Galería',
          onPress: seleccionarImagen,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const guardarProducto = async () => {
    if (!formData.nombre || !formData.categoria || !formData.precio) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const data = {
        ...formData,
        precio: parseFloat(formData.precio),
      };

      let productoId;
      if (editando) {
        await productoService.actualizarProducto(productoSeleccionado._id, data);
        productoId = productoSeleccionado._id;
      } else {
        const nuevoProducto = await productoService.crearProducto(data);
        productoId = nuevoProducto._id;
      }

      // Subir imagen si se seleccionó una
      if (imagenSeleccionada) {
        setSubiendoImagen(true);
        try {
          await productoService.subirImagenProducto(productoId, imagenSeleccionada);
        } catch (errorImagen) {
          Alert.alert('Advertencia', 'Producto guardado pero error al subir imagen');
        }
        setSubiendoImagen(false);
      }

      Alert.alert('Éxito', editando ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      cerrarModal();
      cargarProductos();
    } catch (error) {
      setSubiendoImagen(false);
      Alert.alert('Error', error);
    }
  };

  const eliminarProducto = (producto) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de eliminar "${producto.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await productoService.eliminarProducto(producto._id);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              cargarProductos();
            } catch (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const toggleDisponibilidad = async (producto) => {
    try {
      await productoService.actualizarProducto(producto._id, {
        disponible: !producto.disponible,
      });
      cargarProductos();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const renderProducto = ({ item }) => {
    const imageUrl = productoService.obtenerUrlImagen(item.imagen);
    
    return (
      <View style={styles.card}>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.cardCategory}>{item.categoria}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[
                styles.statusBadge,
                item.disponible ? styles.statusActive : styles.statusInactive,
              ]}
              onPress={() => toggleDisponibilidad(item)}
            >
              <Text
                style={[
                  styles.statusText,
                  item.disponible ? styles.statusTextActive : styles.statusTextInactive,
                ]}
              >
                {item.disponible ? 'Disponible' : 'No disponible'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {item.descripcion ? (
          <Text style={styles.cardDescription}>{item.descripcion}</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>${item.precio.toFixed(2)}</Text>
          {user?.rol === 'admin' && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => abrirModal(item)}
              >
                <Text style={styles.editButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => eliminarProducto(item)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Productos</Text>
        {user?.rol === 'admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => abrirModal()}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarProductos}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay productos registrados</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editando ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Hamburguesa Clásica"
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              />

              <Text style={styles.label}>Categoría *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Comida Rápida"
                value={formData.categoria}
                onChangeText={(text) => setFormData({ ...formData, categoria: text })}
              />

              <Text style={styles.label}>Precio *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formData.precio}
                onChangeText={(text) => setFormData({ ...formData, precio: text })}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción del producto"
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                multiline
                numberOfLines={3}
              />

              {/* Selector de imagen */}
              <Text style={styles.label}>Imagen del Producto</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={mostrarOpcionesImagen}
              >
                <Text style={styles.imagePickerButtonText}>
                  📷 {imagenSeleccionada ? 'Cambiar Imagen' : 'Agregar Imagen'}
                </Text>
              </TouchableOpacity>

              {imagenSeleccionada && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: imagenSeleccionada }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImagenSeleccionada(null)}
                  >
                    <Text style={styles.removeImageButtonText}>❌ Quitar</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, disponible: !formData.disponible })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.disponible && styles.checkboxChecked,
                  ]}
                >
                  {formData.disponible && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Disponible</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cerrarModal}
                  disabled={subiendoImagen}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, subiendoImagen && styles.saveButtonDisabled]}
                  onPress={guardarProducto}
                  disabled={subiendoImagen}
                >
                  {subiendoImagen ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#dc2626',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 12,
  },
  imagePickerButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  imagePickerButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeImageButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProductosScreen;
