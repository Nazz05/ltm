import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import Toast from '../components/Toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import PrimaryButton from '../components/PrimaryButton';

export default function CheckoutScreen({ navigation }) {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', note: '' });
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const insets = useSafeAreaInsets();

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Load địa chỉ từ API khi component mount
  useEffect(() => {
    const loadAddresses = async () => {
      if (!token || !user) {
        setLoadingAddress(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/addresses'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok && data.data && data.data.length > 0) {
          // Lấy địa chỉ mặc định hoặc địa chỉ đầu tiên
          const defaultAddr = data.data.find((addr) => addr.isDefault) || data.data[0];
          // Combine address parts: street, ward, district, city
          const fullAddress = [defaultAddr.street, defaultAddr.ward, defaultAddr.district, defaultAddr.city]
            .filter(Boolean)
            .join(', ');
          setForm((current) => ({
            ...current,
            fullName: user.fullName || user.name || '',
            phone: user.phone || '',
            address: fullAddress || '',
          }));
        } else {
          // Nếu không có địa chỉ lưu, dùng thông tin từ user
          setForm((current) => ({
            ...current,
            fullName: user.fullName || user.name || '',
            phone: user.phone || '',
          }));
        }
      } catch (error) {
        console.log('Error loading addresses:', error);
        // Fallback: dùng thông tin từ user
        setForm((current) => ({
          ...current,
          fullName: user.fullName || user.name || '',
          phone: user.phone || '',
        }));
      } finally {
        setLoadingAddress(false);
      }
    };

    loadAddresses();
  }, [token, user]);

  const shipping = getCartTotal() > 500000 ? 0 : 30000;
  const total = getCartTotal() + shipping;

  const handleContinueToConfirm = () => {
    if (!form.fullName.trim()) {
      displayToast('Vui lòng nhập họ tên.', 'warning');
      return;
    }
    if (!form.phone.trim()) {
      displayToast('Vui lòng nhập số điện thoại.', 'warning');
      return;
    }
    if (!form.address.trim()) {
      displayToast('Vui lòng nhập địa chỉ giao hàng.', 'warning');
      return;
    }

    displayToast('Thông tin đã được xác nhận!', 'success');
    setTimeout(() => setStep(2), 300);
  };

  const handleSubmit = async () => {
    if (!user || !token) {
      displayToast('Vui lòng đăng nhập để tiếp tục thanh toán.', 'error');
      setTimeout(() => navigation.navigate('Login'), 500);
      return;
    }

    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      displayToast('Vui lòng nhập đầy đủ thông tin giao hàng.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl('/orders/checkout'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddr: form.address,
          phoneNumber: form.phone,
          shippingFee: shipping,
          note: form.note,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đặt hàng thất bại');
      }

      clearCart();
      displayToast('Đặt hàng thành công!', 'success');
      const orderId = data.data?.id;
      setTimeout(() => navigation.navigate('Payment', { orderId, order: data.data }), 500);
    } catch (error) {
      displayToast(error.message || 'Không thể đặt hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Thanh toán" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{step === 1 ? 'Thông tin giao hàng' : 'Xác nhận đơn hàng'}</Text>
      <View style={styles.stepper}>
        <View style={[styles.stepLine, styles.stepActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepActive]} />
        <View style={styles.stepLine} />
      </View>
      {!user ? (
        <View style={styles.centerWrap}>
          <Text style={styles.muted}>Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục thanh toán.</Text>
          <PrimaryButton label="Đăng nhập" onPress={() => navigation.replace('Login')} />
        </View>
      ) : null}

      {user && cartItems.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={styles.muted}>Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi thanh toán.</Text>
          <PrimaryButton label="Đi tới sản phẩm" onPress={() => navigation.navigate('Products')} />
        </View>
      ) : null}

      {!user || cartItems.length === 0 ? null : (
        <>
      {loadingAddress ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Đang tải địa chỉ...</Text>
        </View>
      ) : (
        <>
          {step === 1 ? (
            <>
              <View style={styles.card}>
                <Input label="Họ tên" value={form.fullName} onChangeText={(text) => setForm((current) => ({ ...current, fullName: text }))} />
                <Input label="Số điện thoại" value={form.phone} onChangeText={(text) => setForm((current) => ({ ...current, phone: text }))} keyboardType="phone-pad" />
                <Input label="Địa chỉ giao hàng" value={form.address} onChangeText={(text) => setForm((current) => ({ ...current, address: text }))} multiline />
                <Input label="Ghi chú" value={form.note} onChangeText={(text) => setForm((current) => ({ ...current, note: text }))} multiline />
              </View>

              <View style={styles.summaryCard}>
                <Row label="Tạm tính" value={`${getCartTotal().toLocaleString('vi-VN')}đ`} />
                <Row label="Vận chuyển" value={shipping === 0 ? 'Miễn phí' : `${shipping.toLocaleString('vi-VN')}đ`} />
                <Row label="Tổng cộng" value={`${total.toLocaleString('vi-VN')}đ`} bold />
              </View>

              <PrimaryButton label="Tiếp tục xác nhận đơn hàng" onPress={handleContinueToConfirm} disabled={loadingAddress} />
              <PrimaryButton label="Quay lại giỏ hàng" variant="secondary" onPress={() => navigation.navigate('Cart')} />
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Thông tin nhận hàng</Text>
                <Row label="Họ tên" value={form.fullName} />
                <Row label="Số điện thoại" value={form.phone} />
                <Row label="Địa chỉ" value={form.address} />
                {form.note ? <Row label="Ghi chú" value={form.note} /> : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
                {cartItems.map((item) => (
                  <View key={`${item.id}-${item.size}-${item.color}`} style={styles.previewRow}>
                    <Text style={styles.previewName} numberOfLines={1}>{item.name} x{item.quantity}</Text>
                    <Text style={styles.previewPrice}>{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('vi-VN')}đ</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summaryCard}>
                <Row label="Tạm tính" value={`${getCartTotal().toLocaleString('vi-VN')}đ`} />
                <Row label="Vận chuyển" value={shipping === 0 ? 'Miễn phí' : `${shipping.toLocaleString('vi-VN')}đ`} />
                <Row label="Tổng cộng" value={`${total.toLocaleString('vi-VN')}đ`} bold />
              </View>

              <PrimaryButton label={loading ? 'Đang gửi đơn hàng...' : 'Xác nhận đặt hàng'} onPress={handleSubmit} disabled={loading || loadingAddress} />
              <PrimaryButton label="Quay lại thông tin giao hàng" variant="secondary" onPress={() => setStep(1)} />
            </>
          )}
        </>
      )}
      </>
      )}
    </ScrollView>
    {showToast && (
      <Toast
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    )}
    <BottomNavigation navigation={navigation} activeRoute="Checkout" />
    </View>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, props.multiline && styles.multiline]} placeholderTextColor={theme.colors.muted} />
    </View>
  );
}

function Row({ label, value, bold = false }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
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
  stepper: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stepLine: { height: 4, flex: 1, borderRadius: 4, backgroundColor: '#dfe4ee' },
  stepActive: { backgroundColor: theme.colors.primary },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: theme.colors.text,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 16, marginBottom: 2 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  previewName: { color: theme.colors.text, flex: 1, fontWeight: '600' },
  previewPrice: { color: theme.colors.muted, fontWeight: '700' },
  rowLabel: { color: theme.colors.muted },
  rowValue: { color: theme.colors.text, fontWeight: '700' },
  bold: { color: theme.colors.text, fontWeight: '900' },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  muted: {
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
