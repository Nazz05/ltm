import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import PrimaryButton from '../components/PrimaryButton';

const DEFAULT_FORM = { street: '', ward: '', district: '', city: '', zipCode: '' };

export default function AddressScreen({ navigation }) {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const insets = useSafeAreaInsets();

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const loadAddresses = async () => {
    if (!token) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để quản lý địa chỉ.');
      navigation.navigate('Login');
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/addresses', { token });
      const data = await response.json();
        const payload = data?.data ?? data;
        setAddresses(Array.isArray(payload) ? payload : payload?.addresses || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const submitAddress = async () => {
    if (!form.street.trim()) {
      displayToast('Vui lòng nhập đường.', 'warning');
      return;
    }
    if (!form.district.trim()) {
      displayToast('Vui lòng nhập quận/huyện.', 'warning');
      return;
    }
    if (!form.city.trim()) {
      displayToast('Vui lòng nhập tỉnh/thành phố.', 'warning');
      return;
    }

    try {
      const response = await apiFetch('/addresses', {
        token,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Không thể thêm địa chỉ');
      }

      setForm(DEFAULT_FORM);
      await loadAddresses();
      displayToast('Đã thêm địa chỉ mới!', 'success');
    } catch (error) {
      displayToast(error.message || 'Không thể thêm địa chỉ', 'error');
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      await apiFetch(`/addresses/${addressId}`, { token, method: 'DELETE' });
      await loadAddresses();
      displayToast('Đã xóa địa chỉ!', 'success');
    } catch (error) {
      displayToast(error.message || 'Không thể xóa địa chỉ', 'error');
    }
  };

  const setDefault = async (addressId) => {
    try {
      await apiFetch(`/addresses/${addressId}/set-default`, { token, method: 'POST' });
      await loadAddresses();
      displayToast('Đã đặt làm địa chỉ mặc định!', 'success');
    } catch (error) {
      displayToast(error.message || 'Không thể đặt mặc định', 'error');
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Địa chỉ" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Địa chỉ giao hàng</Text>
      <Text style={styles.subtitle}>Bước 1 trong quy trình thanh toán</Text>

      <View style={styles.card}>
        <Input label="Đường" value={form.street} onChangeText={(text) => setForm((current) => ({ ...current, street: text }))} />
        <Input label="Phường/Xã" value={form.ward} onChangeText={(text) => setForm((current) => ({ ...current, ward: text }))} />
        <Input label="Quận/Huyện" value={form.district} onChangeText={(text) => setForm((current) => ({ ...current, district: text }))} />
        <Input label="Tỉnh/Thành" value={form.city} onChangeText={(text) => setForm((current) => ({ ...current, city: text }))} />
        <Input label="Mã bưu chính" value={form.zipCode} onChangeText={(text) => setForm((current) => ({ ...current, zipCode: text }))} />
        <PrimaryButton label="Thêm địa chỉ" onPress={submitAddress} />
      </View>

      {loading ? <Text style={styles.muted}>Đang tải địa chỉ...</Text> : null}

      {addresses.map((item) => (
        <View key={item.id} style={styles.addressCard}>
          <Text style={styles.addressTitle}>{item.street || item.address || 'Địa chỉ'}</Text>
          <Text style={styles.addressText}>{[item.ward, item.district, item.city].filter(Boolean).join(', ')}</Text>
          <Text style={styles.addressText}>{item.zipCode || item.postalCode || ''}</Text>
          <Text style={styles.addressText}>{item.isDefault ? 'Mặc định' : 'Không mặc định'}</Text>
          <View style={styles.row}>
            {!item.isDefault ? <PrimaryButton label="Mặc định" variant="secondary" onPress={() => setDefault(item.id)} style={styles.rowButton} /> : null}
            <PrimaryButton label="Xóa" variant="secondary" onPress={() => deleteAddress(item.id)} style={styles.rowButton} />
          </View>
        </View>
      ))}

      {!loading && addresses.length === 0 ? <Text style={styles.muted}>Chưa có địa chỉ nào.</Text> : null}

      <PrimaryButton label="Về trang chủ" variant="secondary" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
    {showToast && (
      <Toast
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    )}
    <BottomNavigation navigation={navigation} activeRoute="Address" />
    </View>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor={theme.colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  topIcon: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  brand: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '800', color: theme.colors.primary },
  subtitle: { color: theme.colors.muted, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  muted: { color: theme.colors.muted },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  field: { gap: 6 },
  label: { color: theme.colors.text, fontWeight: '700' },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    color: theme.colors.text,
    backgroundColor: '#fff',
  },
  addressCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 6,
  },
  addressTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 16 },
  addressText: { color: theme.colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  rowButton: { flex: 1, minWidth: 120 },
});
