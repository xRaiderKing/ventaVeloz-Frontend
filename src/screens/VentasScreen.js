import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as ventaService from '../services/ventaService';

const VentasScreen = () => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    cantidadVentas: 0,
    promedioVenta: 0,
  });

  useEffect(() => {
    if (user?.rol === 'admin') {
      cargarVentas();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.rol === 'admin') {
        cargarVentas();
      }
    }, [])
  );

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const data = await ventaService.obtenerVentas();
      setVentas(data);
      aplicarFiltro('hoy', data);
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = (filtro, ventasData = ventas) => {
    setFiltroFecha(filtro);
    const ahora = new Date();
    let ventasFilt = [];

    switch (filtro) {
      case 'hoy':
        ventasFilt = ventasData.filter((venta) => {
          const fechaVenta = new Date(venta.fecha);
          return (
            fechaVenta.getDate() === ahora.getDate() &&
            fechaVenta.getMonth() === ahora.getMonth() &&
            fechaVenta.getFullYear() === ahora.getFullYear()
          );
        });
        break;
      case 'semana':
        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - 7);
        ventasFilt = ventasData.filter((venta) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= inicioSemana;
        });
        break;
      case 'mes':
        ventasFilt = ventasData.filter((venta) => {
          const fechaVenta = new Date(venta.fecha);
          return (
            fechaVenta.getMonth() === ahora.getMonth() &&
            fechaVenta.getFullYear() === ahora.getFullYear()
          );
        });
        break;
      case 'todas':
        ventasFilt = ventasData;
        break;
      default:
        ventasFilt = ventasData;
    }

    setVentasFiltradas(ventasFilt);
    calcularEstadisticas(ventasFilt);
  };

  const calcularEstadisticas = (ventasData) => {
    const total = ventasData.reduce((sum, venta) => sum + venta.total, 0);
    const cantidad = ventasData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;

    setEstadisticas({
      totalVentas: total,
      cantidadVentas: cantidad,
      promedioVenta: promedio,
    });
  };

  const verDetalleVenta = (venta) => {
    setVentaSeleccionada(venta);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setVentaSeleccionada(null);
  };

  const renderVenta = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => verDetalleVenta(item)}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Mesa {item.mesa?.numero || 'N/A'}</Text>
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
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.meseroText}>
          👨‍🍳 {item.mesero?.nombre || 'Desconocido'}
        </Text>
        <Text style={styles.productosText}>
          {item.productos?.length || 0} productos
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (user?.rol !== 'admin') {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedText}>
          ⚠️ Acceso denegado. Solo administradores.
        </Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Ventas y Reportes</Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>
            ${estadisticas.totalVentas.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ventas</Text>
          <Text style={styles.statValue}>{estadisticas.cantidadVentas}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Promedio</Text>
          <Text style={styles.statValue}>
            ${estadisticas.promedioVenta.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        {['hoy', 'semana', 'mes', 'todas'].map((filtro) => (
          <TouchableOpacity
            key={filtro}
            style={[
              styles.filtroButton,
              filtroFecha === filtro && styles.filtroButtonActive,
            ]}
            onPress={() => aplicarFiltro(filtro)}
          >
            <Text
              style={[
                styles.filtroButtonText,
                filtroFecha === filtro && styles.filtroButtonTextActive,
              ]}
            >
              {filtro.charAt(0).toUpperCase() + filtro.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de ventas */}
      <FlatList
        data={ventasFiltradas}
        renderItem={renderVenta}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarVentas}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay ventas en el período seleccionado
            </Text>
          </View>
        }
      />

      {/* Modal de detalle */}
      {ventaSeleccionada && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Detalle de Venta</Text>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Mesa:</Text>
                    <Text style={styles.modalValue}>
                      #{ventaSeleccionada.mesa?.numero || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Mesero:</Text>
                    <Text style={styles.modalValue}>
                      {ventaSeleccionada.mesero?.nombre || 'Desconocido'}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Fecha:</Text>
                    <Text style={styles.modalValue}>
                      {new Date(ventaSeleccionada.fecha).toLocaleString('es-ES')}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Método de Pago:</Text>
                    <Text style={styles.modalValue}>
                      {ventaSeleccionada.metodoPago || 'Efectivo'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productosTitle}>Productos:</Text>
                {ventaSeleccionada.productos?.map((prod, index) => (
                  <View key={index} style={styles.productoRow}>
                    <Text style={styles.productoNombre}>
                      {prod.cantidad}x {prod.nombre}
                    </Text>
                    <Text style={styles.productoSubtotal}>
                      ${prod.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.modalTotal}>
                  <Text style={styles.modalTotalLabel}>Total:</Text>
                  <Text style={styles.modalTotalValue}>
                    ${ventaSeleccionada.total.toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={cerrarModal}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  filtrosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filtroButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  filtroButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  filtroButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filtroButtonTextActive: {
    color: '#2563eb',
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
  totalBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  meseroText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  productosText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
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
  modalInfo: {
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  productosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginTop: 16,
  },
  modalTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  closeButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VentasScreen;
