import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as mesaService from '../services/mesaService';
import * as ventaService from '../services/ventaService';
import * as ordenService from '../services/ordenService';

const TicketScreen = ({ route, navigation }) => {
  const { mesa, productos, total, mesaId, ordenes } = route.params;
  const { user } = useAuth();
  const [procesando, setProcesando] = React.useState(false);
  const [metodoPago, setMetodoPago] = React.useState('efectivo');

  const marcarComoPagada = async () => {
    try {
      setProcesando(true);
      
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
            // Navegar a Mesas y forzar recarga
            navigation.navigate('Mesas', { refresh: true });
          },
        },
      ]);
    } catch (error) {
      setProcesando(false);
      Alert.alert('Error', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuenta</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Ticket */}
        <View style={styles.ticket}>
          <View style={styles.ticketHeader}>
            <Text style={styles.restaurantName}>VentaVeloz</Text>
            <Text style={styles.ticketSubtitle}>Sistema de Restaurante</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.ticketInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mesa:</Text>
              <Text style={styles.infoValue}>#{mesa?.numero}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>
                {new Date().toLocaleDateString('es-ES')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hora:</Text>
              <Text style={styles.infoValue}>
                {new Date().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {mesa?.meseroAsignado && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mesero:</Text>
                <Text style={styles.infoValue}>
                  {mesa.meseroAsignado.nombre || 'N/A'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Productos */}
          <View style={styles.productosSection}>
            <View style={styles.productosHeader}>
              <Text style={styles.headerCant}>Cant.</Text>
              <Text style={styles.headerDesc}>Descripción</Text>
              <Text style={styles.headerPrecio}>Precio</Text>
              <Text style={styles.headerTotal}>Total</Text>
            </View>

            {productos.map((prod, index) => (
              <View key={index} style={styles.productoRow}>
                <Text style={styles.productoCant}>{prod.cantidad}</Text>
                <Text style={styles.productoDesc}>{prod.nombre}</Text>
                <Text style={styles.productoPrecio}>
                  ${prod.precioUnitario.toFixed(2)}
                </Text>
                <Text style={styles.productoTotal}>
                  ${prod.subtotal.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Totales */}
          <View style={styles.totalesSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA (0%):</Text>
              <Text style={styles.totalValue}>$0.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelFinal}>TOTAL:</Text>
              <Text style={styles.totalValueFinal}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.ticketFooter}>
            <Text style={styles.footerText}>¡Gracias por su visita!</Text>
            <Text style={styles.footerText}>Vuelva pronto</Text>
          </View>
        </View>
      </ScrollView>

      {/* Selector de método de pago */}
      <View style={styles.paymentMethodContainer}>
        <Text style={styles.paymentMethodLabel}>Método de Pago:</Text>
        <View style={styles.paymentMethods}>
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              metodoPago === 'efectivo' && styles.paymentMethodButtonActive,
            ]}
            onPress={() => setMetodoPago('efectivo')}
            disabled={procesando}
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
            disabled={procesando}
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
            disabled={procesando}
          >
            <Text
              style={[
                styles.paymentMethodText,
                metodoPago === 'transferencia' && styles.paymentMethodTextActive,
              ]}
            >
              📱 Transfer.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.imprimirButton}
          onPress={() => Alert.alert('Imprimir', 'Función de impresión no implementada')}
          disabled={procesando}
        >
          <Text style={styles.imprimirButtonText}>🖨️ Imprimir</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pagarButton, procesando && styles.pagarButtonDisabled]} 
          onPress={marcarComoPagada}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.pagarButtonText}>💰 Marcar como Pagada</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
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
  content: {
    flex: 1,
    padding: 16,
  },
  ticket: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  ticketInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  productosSection: {
    marginBottom: 8,
  },
  productosHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCant: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  headerDesc: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  headerPrecio: {
    width: 60,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'right',
  },
  headerTotal: {
    width: 70,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'right',
  },
  productoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  productoCant: {
    width: 40,
    fontSize: 14,
    color: '#1f2937',
  },
  productoDesc: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  productoPrecio: {
    width: 60,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  productoTotal: {
    width: 70,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'right',
  },
  totalesSection: {
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  totalLabelFinal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  ticketFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentMethodContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  paymentMethodText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  paymentMethodTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  imprimirButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imprimirButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pagarButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pagarButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  pagarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TicketScreen;
