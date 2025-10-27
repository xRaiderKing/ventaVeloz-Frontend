import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as productoService from '../services/productoService';
import * as ordenService from '../services/ordenService';

const NuevaOrdenScreen = ({ route, navigation }) => {
  const { mesaId, mesaNumero } = route.params;
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await productoService.obtenerProductos();
      // Solo productos disponibles
      setProductos(data.filter((p) => p.disponible));
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((item) => item._id === producto._id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item._id === producto._id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (productoId) => {
    const producto = carrito.find((item) => item._id === productoId);
    if (producto.cantidad > 1) {
      setCarrito(
        carrito.map((item) =>
          item._id === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
      );
    } else {
      setCarrito(carrito.filter((item) => item._id !== productoId));
    }
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter((item) => item._id !== productoId));
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  };

  const crearOrden = async () => {
    if (carrito.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto');
      return;
    }

    try {
      const ordenData = {
        mesa: mesaId,
        mesero: user._id,
        productos: carrito.map((item) => ({
          productoId: item._id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precio * item.cantidad,
        })),
        total: calcularTotal(),
        estado: 'pendiente',
      };

      await ordenService.crearOrden(ordenData);
      Alert.alert('Éxito', 'Orden creada correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const productosFiltrados = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProducto = ({ item }) => {
    const enCarrito = carrito.find((p) => p._id === item._id);
    const imageUrl = productoService.obtenerUrlImagen(item.imagen);
    
    return (
      <TouchableOpacity
        style={styles.productoCard}
        onPress={() => agregarAlCarrito(item)}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productoImagen}
            resizeMode="cover"
          />
        )}
        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>{item.nombre}</Text>
          <Text style={styles.productoCategoria}>{item.categoria}</Text>
          <Text style={styles.productoPrecio}>${item.precio.toFixed(2)}</Text>
        </View>
        {enCarrito && (
          <View style={styles.cantidadBadge}>
            <Text style={styles.cantidadText}>{enCarrito.cantidad}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCarritoItem = ({ item }) => (
    <View style={styles.carritoItem}>
      <View style={styles.carritoInfo}>
        <Text style={styles.carritoNombre}>{item.nombre}</Text>
        <Text style={styles.carritoSubtotal}>
          ${(item.precio * item.cantidad).toFixed(2)}
        </Text>
      </View>
      <View style={styles.carritoControles}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => quitarDelCarrito(item._id)}
        >
          <Text style={styles.controlButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.cantidadTexto}>{item.cantidad}</Text>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => agregarAlCarrito(item)}
        >
          <Text style={styles.controlButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => eliminarDelCarrito(item._id)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Orden - Mesa {mesaNumero}</Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de productos */}
      <View style={styles.productosSection}>
        <Text style={styles.sectionTitle}>Productos Disponibles</Text>
        <FlatList
          data={productosFiltrados}
          renderItem={renderProducto}
          keyExtractor={(item) => item._id}
          numColumns={2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay productos disponibles</Text>
            </View>
          }
        />
      </View>

      {/* Carrito */}
      {carrito.length > 0 && (
        <View style={styles.carritoContainer}>
          <View style={styles.carritoHeader}>
            <Text style={styles.carritoTitle}>Carrito ({carrito.length})</Text>
            <Text style={styles.carritoTotal}>${calcularTotal().toFixed(2)}</Text>
          </View>
          <FlatList
            data={carrito}
            renderItem={renderCarritoItem}
            keyExtractor={(item) => item._id}
            style={styles.carritoLista}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.crearButton} onPress={crearOrden}>
            <Text style={styles.crearButtonText}>Crear Orden</Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  productosSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  productoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
    overflow: 'hidden',
  },
  productoImagen: {
    width: '100%',
    height: 100,
    marginBottom: 8,
  },
  productoInfo: {
    flex: 1,
    padding: 12,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  productoCategoria: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  productoPrecio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  cantidadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  carritoContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '50%',
  },
  carritoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  carritoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  carritoTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  carritoLista: {
    maxHeight: 200,
  },
  carritoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  carritoInfo: {
    flex: 1,
  },
  carritoNombre: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  carritoSubtotal: {
    fontSize: 14,
    color: '#6b7280',
  },
  carritoControles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#eff6ff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  cantidadTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  deleteButton: {
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  crearButton: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  crearButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default NuevaOrdenScreen;
