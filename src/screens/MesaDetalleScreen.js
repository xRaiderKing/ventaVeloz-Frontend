import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as mesaService from '../services/mesaService';
import * as ordenService from '../services/ordenService';
import * as ventaService from '../services/ventaService';

const MesaDetalleScreen = ({ route, navigation }) => {
  const { mesaId } = route.params;
  const { user } = useAuth();
  const [mesa, setMesa] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMetodoPago, setModalMetodoPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar datos cuando la pantalla vuelva a tener foco
  useFocusEffect(
    React.useCallback(() => {
      cargarDatos();
    }, [mesaId])
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const mesaData = await mesaService.obtenerMesaPorId(mesaId);
      setMesa(mesaData);
      
      // Obtener órdenes de esta mesa
      const todasOrdenes = await ordenService.obtenerOrdenes();
      const ordenesMesa = todasOrdenes.filter(
        (orden) => orden.mesa?._id === mesaId || orden.mesa === mesaId
      );
      setOrdenes(ordenesMesa);
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const liberarMesa = () => {
    // Mostrar modal para seleccionar método de pago
    setModalMetodoPago(true);
  };

  const confirmarLiberacion = async () => {
    try {
      setProcesando(true);
      setModalMetodoPago(false);
      
      // Generar datos de productos
      const productosAgrupados = {};
      ordenes.forEach((orden) => {
        if (orden.estado !== 'cancelada') {
          orden.productos?.forEach((prod) => {
            if (productosAgrupados[prod.nombre]) {
              productosAgrupados[prod.nombre].cantidad += prod.cantidad;
              productosAgrupados[prod.nombre].subtotal += prod.subtotal;
            } else {
              productosAgrupados[prod.nombre] = {
                nombre: prod.nombre,
                cantidad: prod.cantidad,
                precioUnitario: prod.precioUnitario,
                subtotal: prod.subtotal,
              };
            }
          });
        }
      });

      const productos = Object.values(productosAgrupados);
      const total = calcularTotal();
      
      // Crear registro de venta
      const ventaData = {
        mesa: mesaId,
        mesero: user._id,
        productos: productos,
        total: total,
        fecha: new Date(),
        metodoPago: metodoPago,
      };
      
      await ventaService.crearVenta(ventaData);
      
      // Eliminar todas las órdenes asociadas a esta mesa
      if (ordenes && ordenes.length > 0) {
        for (const orden of ordenes) {
          await ordenService.eliminarOrden(orden._id);
        }
      }
      
      // Liberar la mesa
      await mesaService.actualizarMesa(mesaId, {
        estado: 'disponible',
        meseroAsignado: null,
      });
      
      setProcesando(false);
      Alert.alert('Éxito', 'Venta registrada y mesa liberada', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Mesas', { refresh: true });
          },
        },
      ]);
    } catch (error) {
      setProcesando(false);
      Alert.alert('Error', error);
    }
  };

  const calcularTotal = () => {
    return ordenes.reduce((sum, orden) => {
      if (orden.estado !== 'cancelada') {
        return sum + (orden.total || 0);
      }
      return sum;
    }, 0);
  };

  const generarTicket = () => {
    const total = calcularTotal();
    const productosAgrupados = {};

    ordenes.forEach((orden) => {
      if (orden.estado !== 'cancelada') {
        orden.productos?.forEach((prod) => {
          if (productosAgrupados[prod.nombre]) {
            productosAgrupados[prod.nombre].cantidad += prod.cantidad;
            productosAgrupados[prod.nombre].subtotal += prod.subtotal;
          } else {
            productosAgrupados[prod.nombre] = {
              nombre: prod.nombre,
              cantidad: prod.cantidad,
              precioUnitario: prod.precioUnitario,
              subtotal: prod.subtotal,
            };
          }
        });
      }
    });

    const productos = Object.values(productosAgrupados);
    navigation.navigate('Ticket', {
      mesa,
      productos,
      total,
      mesaId,
      ordenes: ordenes.filter((orden) => orden.estado !== 'cancelada'),
    });
  };

  const renderOrden = ({ item }) => (
    <View style={styles.ordenCard}>
      <View style={styles.ordenHeader}>
        <Text style={styles.ordenFecha}>
          {new Date(item.fecha).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) + '20' },
          ]}
        >
          <Text style={[styles.estadoText, { color: getEstadoColor(item.estado) }]}>
            {item.estado}
          </Text>
        </View>
      </View>

      <View style={styles.ordenBody}>
        {item.productos?.map((prod, index) => (
          <View key={index} style={styles.productoRow}>
            <Text style={styles.productoText}>
              {prod.cantidad}x {prod.nombre}
            </Text>
            <Text style={styles.productoSubtotal}>
              ${prod.subtotal.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.ordenFooter}>
        <Text style={styles.ordenTotal}>Total: ${item.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#f59e0b';
      case 'en preparación':
        return '#3b82f6';
      case 'servida':
        return '#10b981';
      case 'pagada':
        return '#6366f1';
      case 'cancelada':
        return '#ef4444';
      default:
        return '#6b7280';
    }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesa {mesa?.numero}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info de la mesa */}
        <View style={styles.mesaInfo}>
          <View style={styles.mesaInfoRow}>
            <Text style={styles.mesaInfoLabel}>Estado:</Text>
            <Text style={[styles.mesaInfoValue, { color: getEstadoColor(mesa?.estado) }]}>
              {mesa?.estado}
            </Text>
          </View>
          <View style={styles.mesaInfoRow}>
            <Text style={styles.mesaInfoLabel}>Capacidad:</Text>
            <Text style={styles.mesaInfoValue}>{mesa?.capacidad} personas</Text>
          </View>
          <View style={styles.mesaInfoRow}>
            <Text style={styles.mesaInfoLabel}>Ubicación:</Text>
            <Text style={styles.mesaInfoValue}>{mesa?.ubicacion}</Text>
          </View>
          {mesa?.meseroAsignado && (
            <View style={styles.mesaInfoRow}>
              <Text style={styles.mesaInfoLabel}>Mesero:</Text>
              <Text style={styles.mesaInfoValue}>
                {mesa.meseroAsignado.nombre || 'Asignado'}
              </Text>
            </View>
          )}
        </View>

        {/* Botón para nueva orden */}
        <TouchableOpacity
          style={styles.nuevaOrdenButton}
          onPress={() => navigation.navigate('NuevaOrden', { mesaId: mesa._id, mesaNumero: mesa.numero })}
        >
          <Text style={styles.nuevaOrdenButtonText}>+ Nueva Orden</Text>
        </TouchableOpacity>

        {/* Lista de órdenes */}
        <View style={styles.ordenesSection}>
          <Text style={styles.sectionTitle}>Órdenes ({ordenes.length})</Text>
          {ordenes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay órdenes para esta mesa</Text>
            </View>
          ) : (
            <FlatList
              data={ordenes}
              renderItem={renderOrden}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Total general */}
        {ordenes.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total General:</Text>
            <Text style={styles.totalValue}>${calcularTotal().toFixed(2)}</Text>
          </View>
        )}
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        {ordenes.length > 0 && (
          <TouchableOpacity style={styles.ticketButton} onPress={generarTicket}>
            <Text style={styles.ticketButtonText}>🧾 Ver Cuenta</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.liberarButton, procesando && styles.liberarButtonDisabled]} 
          onPress={liberarMesa}
          disabled={procesando || ordenes.length === 0}
        >
          {procesando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.liberarButtonText}>✓ Liberar Mesa</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de método de pago */}
      <Modal
        visible={modalMetodoPago}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalMetodoPago(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Método de Pago</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona cómo pagó el cliente
            </Text>
            <Text style={styles.modalTotal}>
              Total: ${calcularTotal().toFixed(2)}
            </Text>

            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  metodoPago === 'efectivo' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => setMetodoPago('efectivo')}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    metodoPago === 'efectivo' && styles.paymentMethodTextActive,
                  ]}
                >
                  💵 Efectivo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  metodoPago === 'tarjeta' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => setMetodoPago('tarjeta')}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    metodoPago === 'tarjeta' && styles.paymentMethodTextActive,
                  ]}
                >
                  💳 Tarjeta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  metodoPago === 'transferencia' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => setMetodoPago('transferencia')}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    metodoPago === 'transferencia' && styles.paymentMethodTextActive,
                  ]}
                >
                  📱 Transferencia
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalMetodoPago(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmarLiberacion}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mesaInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mesaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mesaInfoLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  mesaInfoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  nuevaOrdenButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nuevaOrdenButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  ordenesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  ordenCard: {
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
  ordenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ordenFecha: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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
  ordenBody: {
    marginBottom: 12,
  },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  productoText: {
    fontSize: 14,
    color: '#374151',
  },
  productoSubtotal: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  ordenFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  ordenTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right',
  },
  totalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ticketButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ticketButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  liberarButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  liberarButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  liberarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 24,
    textAlign: 'center',
  },
  paymentMethods: {
    gap: 12,
    marginBottom: 24,
  },
  paymentMethodButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  paymentMethodTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MesaDetalleScreen;
