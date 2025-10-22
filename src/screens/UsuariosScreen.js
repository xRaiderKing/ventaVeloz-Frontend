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
import * as usuarioService from '../services/usuarioService';

const UsuariosScreen = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'mesero',
    activo: true,
  });

  useEffect(() => {
    if (user?.rol === 'admin') {
      cargarUsuarios();
    }
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.obtenerUsuarios();
      setUsuarios(data);
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (usuario = null) => {
    setUsuarioSeleccionado(usuario);
    if (usuario) {
      // Editar usuario existente
      setFormData({
        nombre: usuario.nombre,
        correo: usuario.correo,
        contrasena: '',
        rol: usuario.rol,
        activo: usuario.activo,
      });
    } else {
      // Crear nuevo usuario
      setFormData({
        nombre: '',
        correo: '',
        contrasena: '',
        rol: 'mesero',
        activo: true,
      });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setUsuarioSeleccionado(null);
  };

  const guardarUsuario = async () => {
    if (!formData.nombre || !formData.correo) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!usuarioSeleccionado && !formData.contrasena) {
      Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      if (usuarioSeleccionado) {
        // Actualizar usuario existente
        await usuarioService.actualizarUsuario(usuarioSeleccionado._id, formData);
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        await usuarioService.crearUsuario(formData);
        Alert.alert('Éxito', 'Usuario creado correctamente');
      }
      cerrarModal();
      cargarUsuarios();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const eliminarUsuario = (usuario) => {
    if (usuario._id === user._id) {
      Alert.alert('Error', 'No puedes eliminar tu propio usuario');
      return;
    }

    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de eliminar a ${usuario.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await usuarioService.eliminarUsuario(usuario._id);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              cargarUsuarios();
            } catch (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const toggleActivo = async (usuario) => {
    if (usuario._id === user._id) {
      Alert.alert('Error', 'No puedes desactivar tu propio usuario');
      return;
    }

    try {
      await usuarioService.actualizarUsuario(usuario._id, {
        activo: !usuario.activo,
      });
      cargarUsuarios();
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const renderUsuario = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nombre}</Text>
          <Text style={styles.userEmail}>{item.correo}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              item.rol === 'admin'
                ? styles.badgeAdmin
                : styles.badgeMesero,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.rol === 'admin'
                  ? styles.badgeTextAdmin
                  : styles.badgeTextMesero,
              ]}
            >
              {item.rol === 'admin' ? '👑 Admin' : '👨‍🍳 Mesero'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.badge,
              item.activo ? styles.badgeActive : styles.badgeInactive,
            ]}
            onPress={() => toggleActivo(item)}
          >
            <Text
              style={[
                styles.badgeText,
                item.activo ? styles.badgeTextActive : styles.badgeTextInactive,
              ]}
            >
              {item.activo ? '✓ Activo' : '✗ Inactivo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.memberSince}>
          Miembro desde:{' '}
          {new Date(item.createdAt).toLocaleDateString('es-ES')}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => abrirModal(item)}
        >
          <Text style={styles.editButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => eliminarUsuario(item)}
          disabled={item._id === user._id}
        >
          <Text
            style={[
              styles.deleteButtonText,
              item._id === user._id && styles.deleteButtonTextDisabled,
            ]}
          >
            🗑️ Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Usuarios</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Total: {usuarios.length} | Activos:{' '}
              {usuarios.filter((u) => u.activo).length}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => abrirModal()}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={usuarios}
        renderItem={renderUsuario}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarUsuarios}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay usuarios registrados</Text>
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
                {usuarioSeleccionado ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              />

              <Text style={styles.label}>Correo *</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                value={formData.correo}
                onChangeText={(text) => setFormData({ ...formData, correo: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {!usuarioSeleccionado && (
                <>
                  <Text style={styles.label}>Contraseña *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.contrasena}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contrasena: text })
                    }
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}

              <Text style={styles.label}>Rol</Text>
              <View style={styles.radioGroup}>
                {['mesero', 'admin'].map((rol) => (
                  <TouchableOpacity
                    key={rol}
                    style={[
                      styles.radioButton,
                      formData.rol === rol && styles.radioButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, rol })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        formData.rol === rol && styles.radioButtonTextActive,
                      ]}
                    >
                      {rol === 'admin' ? '👑 Admin' : '👨‍🍳 Mesero'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, activo: !formData.activo })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.activo && styles.checkboxChecked,
                  ]}
                >
                  {formData.activo && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Usuario activo</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cerrarModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={guardarUsuario}
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
    marginBottom: 8,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardBody: {
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeAdmin: {
    backgroundColor: '#fef3c7',
  },
  badgeMesero: {
    backgroundColor: '#dbeafe',
  },
  badgeActive: {
    backgroundColor: '#d1fae5',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextAdmin: {
    color: '#92400e',
  },
  badgeTextMesero: {
    color: '#1e40af',
  },
  badgeTextActive: {
    color: '#065f46',
  },
  badgeTextInactive: {
    color: '#991b1b',
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonTextDisabled: {
    color: '#9ca3af',
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
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  radioButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UsuariosScreen;
