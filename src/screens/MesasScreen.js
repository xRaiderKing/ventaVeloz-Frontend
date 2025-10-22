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
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as mesaService from '../services/mesaService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const MesasScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: '',
    estado: 'disponible',
    ubicacion: 'interior',
  });

  useEffect(() => {
    cargarMesas();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarMesas();
    }, [])
  );

  const cargarMesas = async () => {
    try {
      setLoading(true);
      const data = await mesaService.obtenerMesas();
      setMesas(data);
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (mesa = null) => {
    if (mesa) {
      setEditando(true);
      setMesaSeleccionada(mesa);
      setFormData({
        numero: mesa.numero.toString(),
        capacidad: mesa.capacidad.toString(),
        estado: mesa.estado,
        ubicacion: mesa.ubicacion || 'interior',
      });
    } else {
      setEditando(false);
      setMesaSeleccionada(null);
      setFormData({
        numero: '',
        capacidad: '',
        estado: 'disponible',
        ubicacion: 'interior',
      });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setMesaSeleccionada(null);
  };

  const guardarMesa = async () => {
    if (!formData.numero || !formData.capacidad) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const data = {
        ...formData,
        numero: parseInt(formData.numero),
        capacidad: parseInt(formData.capacidad),
      };

      if (editando) {
        await mesaService.actualizarMesa(mesaSeleccionada._id, data);
        Alert.alert('Éxito', 'Mesa actualizada correctamente');
      } else {
        await mesaService.crearMesa(data);
        Alert.alert('Éxito', 'Mesa creada correctamente');
      }

      cerrarModal();
      cargarMesas();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const eliminarMesa = (mesa) => {
    Alert.alert(
      'Eliminar Mesa',
      `¿Estás seguro de eliminar la Mesa ${mesa.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await mesaService.eliminarMesa(mesa._id);
              Alert.alert('Éxito', 'Mesa eliminada correctamente');
              cargarMesas();
            } catch (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const tomarMesa = async (mesa) => {
    Alert.alert(
      'Tomar Mesa',
      `¿Deseas tomar la Mesa ${mesa.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar Mesa',
          onPress: async () => {
            try {
              await mesaService.actualizarMesa(mesa._id, {
                estado: 'ocupada',
                meseroAsignado: user._id,
              });
              Alert.alert('Éxito', 'Mesa tomada correctamente');
              cargarMesas();
            } catch (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const verDetalleMesa = (mesa) => {
    navigation.navigate('MesaDetalle', { mesaId: mesa._id });
  };

  const cambiarEstado = async (mesa, nuevoEstado) => {
    try {
      await mesaService.actualizarMesa(mesa._id, { estado: nuevoEstado });
      cargarMesas();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'disponible':
        return '#10b981';
      case 'ocupada':
        return '#ef4444';
      case 'reservada':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'disponible':
        return '✓';
      case 'ocupada':
        return '◉';
      case 'reservada':
        return '◐';
      default:
        return '○';
    }
  };

  const renderMesa = ({ item }) => {
    const esMiMesa = item.meseroAsignado?._id === user._id || item.meseroAsignado === user._id;
    const meseroNombre = item.meseroAsignado?.nombre || 'Desconocido';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => item.estado === 'ocupada' && esMiMesa ? verDetalleMesa(item) : null}
        disabled={item.estado !== 'ocupada' || !esMiMesa}
      >
        <View style={styles.cardHeader}>
          <View style={styles.mesaNumber}>
            <Text style={styles.mesaNumberText}>Mesa {item.numero}</Text>
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
              {getEstadoIcon(item.estado)} {item.estado}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👥 Capacidad:</Text>
            <Text style={styles.infoValue}>
              {item.capacidad} {item.capacidad === 1 ? 'persona' : 'personas'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Ubicación:</Text>
            <Text style={styles.infoValue}>{item.ubicacion}</Text>
          </View>
          {item.estado === 'ocupada' && item.meseroAsignado && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👨‍🍳 Mesero:</Text>
              <Text style={[styles.infoValue, esMiMesa && styles.miMesaText]}>
                {esMiMesa ? 'Tú' : meseroNombre}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          {item.estado === 'disponible' && (
            <TouchableOpacity
              style={styles.tomarMesaButton}
              onPress={() => tomarMesa(item)}
            >
              <Text style={styles.tomarMesaButtonText}>✋ Tomar Mesa</Text>
            </TouchableOpacity>
          )}

          {item.estado === 'ocupada' && esMiMesa && (
            <TouchableOpacity
              style={styles.verDetalleButton}
              onPress={() => verDetalleMesa(item)}
            >
              <Text style={styles.verDetalleButtonText}>👀 Ver Detalles</Text>
            </TouchableOpacity>
          )}

          {item.estado === 'ocupada' && !esMiMesa && (
            <View style={styles.ocupadaInfo}>
              <Text style={styles.ocupadaText}>Mesa ocupada por otro mesero</Text>
            </View>
          )}

          {user?.rol === 'admin' && (
            <View style={styles.adminButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => abrirModal(item)}
              >
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => eliminarMesa(item)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Mesas</Text>
        {user?.rol === 'admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => abrirModal()}
          >
            <Text style={styles.addButtonText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={mesas}
        renderItem={renderMesa}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarMesas}
        numColumns={2}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay mesas registradas</Text>
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
                {editando ? 'Editar Mesa' : 'Nueva Mesa'}
              </Text>

              <Text style={styles.label}>Número de Mesa *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 1"
                value={formData.numero}
                onChangeText={(text) => setFormData({ ...formData, numero: text })}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Capacidad (personas) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 4"
                value={formData.capacidad}
                onChangeText={(text) =>
                  setFormData({ ...formData, capacidad: text })
                }
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Estado</Text>
              <View style={styles.radioGroup}>
                {['disponible', 'ocupada', 'reservada'].map((estado) => (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.radioButton,
                      formData.estado === estado && styles.radioButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, estado })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        formData.estado === estado && styles.radioButtonTextActive,
                      ]}
                    >
                      {estado}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Ubicación</Text>
              <View style={styles.radioGroup}>
                {['interior', 'terraza', 'balcón', 'jardín'].map((ubicacion) => (
                  <TouchableOpacity
                    key={ubicacion}
                    style={[
                      styles.radioButton,
                      formData.ubicacion === ubicacion && styles.radioButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, ubicacion })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        formData.ubicacion === ubicacion &&
                          styles.radioButtonTextActive,
                      ]}
                    >
                      {ubicacion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cerrarModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={guardarMesa}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
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
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    flex: 1,
    maxWidth: '46%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  mesaNumber: {
    marginBottom: 8,
  },
  mesaNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  estadoButtons: {
    marginBottom: 8,
  },
  estadoButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  estadoButtonActive: {
    backgroundColor: '#f0f9ff',
  },
  estadoButtonText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  miMesaText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  tomarMesaButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  tomarMesaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verDetalleButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  verDetalleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ocupadaInfo: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  ocupadaText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  adminButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
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
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  radioButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  radioButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MesasScreen;
