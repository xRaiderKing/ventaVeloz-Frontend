import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ordenService from '../services/ordenService';

const OrdenesScreen = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarOrdenes();
    }, [])
  );

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const data = await ordenService.obtenerOrdenes();
      setOrdenes(data);
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (orden, nuevoEstado) => {
    try {
      await ordenService.actualizarOrden(orden._id, { estado: nuevoEstado });
      Alert.alert('Éxito', 'Estado actualizado');
      cargarOrdenes();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const eliminarOrden = (orden) => {
    Alert.alert(
      'Eliminar Orden',
      '¿Estás seguro de eliminar esta orden?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordenService.eliminarOrden(orden._id);
              Alert.alert('Éxito', 'Orden eliminada');
              cargarOrdenes();
            } catch (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#f59e0b';
      case 'en preparación':
        return '#3b82f6';
      case 'servida':
        return '#10b981';
      case 'cancelada':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderOrden = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>
            Mesa {item.mesa?.numero || 'N/A'}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(item.fecha).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) + '20' },
          ]}
        >
          <Text
            style={[styles.estadoText, { color: getEstadoColor(item.estado) }]}
          >
            {item.estado}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.productosTitle}>Productos:</Text>
        {item.productos?.map((prod, index) => (
          <View key={index} style={styles.productoRow}>
            <Text style={styles.productoNombre}>
              {prod.cantidad}x {prod.nombre}
            </Text>
            <Text style={styles.productoSubtotal}>
              ${prod.subtotal.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${item.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.estadoButtons}>
        {['pendiente', 'en preparación', 'servida'].map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.estadoButton,
              item.estado === estado && {
                backgroundColor: getEstadoColor(estado) + '20',
                borderColor: getEstadoColor(estado),
              },
            ]}
            onPress={() => cambiarEstado(item, estado)}
            disabled={item.estado === estado}
          >
            <Text
              style={[
                styles.estadoButtonText,
                item.estado === estado && { color: getEstadoColor(estado) },
              ]}
            >
              {estado}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => eliminarOrden(item)}
      >
        <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
      </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Órdenes</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={cargarOrdenes}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ordenes}
        renderItem={renderOrden}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarOrdenes}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay órdenes registradas</Text>
          </View>
        }
      />
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
  refreshButton: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 20,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    marginBottom: 12,
  },
  productosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  productoNombre: {
    fontSize: 14,
    color: '#6b7280',
  },
  productoSubtotal: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginBottom: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  estadoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  estadoButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  estadoButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

export default OrdenesScreen;
