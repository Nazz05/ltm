import React, { useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import Toast from '../components/Toast';
import { useCart } from '../context/CartContext';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export default function CartScreen({ navigation }) {
  const { token } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const insets = useSafeAreaInsets();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  if (!token) {
    return (
      <View style={styles.screenWrapper}>
        <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
        <BackHeader title="Giỏ hàng" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.emptyText}>Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn.</Text>
          <PrimaryButton label="Đăng nhập" onPress={() => navigation.replace('Login')} />
        </View>
      </View>
    );
  }

  const shipping = getCartTotal() > 500000 ? 0 : 30000;
  const total = getCartTotal() + shipping;

  if (cartItems.length === 0) {
    return (
      <View style={styles.screenWrapper}>
        <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
        <BackHeader title="Giỏ hàng" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptyText}>Hãy thêm sản phẩm từ danh sách để tiếp tục mua sắm.</Text>
          <PrimaryButton label="Về trang sản phẩm" onPress={() => navigation.navigate('Products')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Giỏ hàng" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Giỏ hàng của bạn</Text>
      <Text style={styles.subtitle}>{cartItems.length} sản phẩm đã chọn</Text>

      <View style={styles.list}>
        {cartItems.map((item) => (
          <View key={`${item.id}-${item.size}-${item.color}`} style={styles.itemCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.itemBody}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>Kích cỡ: {item.size} | Màu: {item.color}</Text>
              <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>

              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>

              <Pressable onPress={() => removeFromCart(item.id, item.size, item.color)}>
                <Text style={styles.remove}>Xóa khỏi giỏ</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tóm tắt</Text>
        <Row label="Tạm tính" value={formatMoney(getCartTotal())} />
        <Row label="Vận chuyển" value={shipping === 0 ? 'Miễn phí' : formatMoney(shipping)} />
        <View style={styles.divider} />
        <Row label="Tổng cộng" value={formatMoney(total)} bold />

        <PrimaryButton label="Tiến hành thanh toán" onPress={() => navigation.navigate('Checkout')} />
        <PrimaryButton label="Tiếp tục mua sắm" variant="secondary" onPress={() => navigation.navigate('Products')} />
        <PrimaryButton label="Xóa toàn bộ giỏ" variant="secondary" onPress={() => Alert.alert('Xóa giỏ hàng', 'Bạn có chắc chắn?', [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => { clearCart(); displayToast('Giỏ hàng đã xóa.', 'success'); } }])} />
      </View>
    </ScrollView>
    {showToast && (
      <Toast
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    )}
    <BottomNavigation navigation={navigation} activeRoute="Cart" />
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
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.primary },
  subtitle: { color: theme.colors.muted, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.1 },
  list: { gap: 12 },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  image: { width: 92, height: 92, borderRadius: 12, backgroundColor: '#f3f4f6' },
  itemBody: { flex: 1, gap: 4 },
  itemName: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  itemMeta: { color: theme.colors.muted, fontSize: 12 },
  itemPrice: { color: theme.colors.primary, fontWeight: '800' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#c7d7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: theme.colors.primary, fontWeight: '900' },
  qtyValue: { minWidth: 20, textAlign: 'center', fontWeight: '700' },
  remove: { color: theme.colors.danger, marginTop: 6, fontWeight: '700' },
  summaryCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    shadowColor: '#001f54',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 1,
  },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: theme.colors.muted },
  rowValue: { color: theme.colors.text, fontWeight: '700' },
  bold: { fontWeight: '900', color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.divider, marginVertical: 4 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14, backgroundColor: theme.colors.background },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 6 },
});
