import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import PrimaryButton from '../components/PrimaryButton';

export default function OrdersScreen({ navigation }) {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  if (!token) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Bạn chưa đăng nhập</Text>
        <Text style={styles.emptyText}>Vui lòng đăng nhập để xem đơn hàng của bạn.</Text>
        <PrimaryButton label="Đăng nhập" onPress={() => navigation.replace('Login')} />
      </View>
    );
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/orders/my', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setOrders(Array.isArray(payload) ? payload : payload?.orders || payload?.items || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigation, token]);

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Đơn hàng" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Đơn hàng của tôi</Text>
      <Text style={styles.subtitle}>{user?.fullName || user?.email || 'Tài khoản hiện tại'}</Text>

      {loading ? <Text style={styles.muted}>Đang tải đơn hàng...</Text> : null}

      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <Text style={styles.cardTitle}>Đơn #{order.id}</Text>
          <Text style={styles.row}>Trạng thái: <Text style={styles.bold}>{order.status || 'Đang xử lý'}</Text></Text>
          <Text style={styles.row}>Tổng tiền: <Text style={styles.bold}>{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</Text></Text>
          <Text style={styles.row}>Địa chỉ: {order.shippingAddr || '-'}</Text>
          <Text style={styles.row}>Ngày đặt: {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</Text>
        </View>
      ))}

      {!loading && orders.length === 0 ? <Text style={styles.muted}>Chưa có đơn hàng nào.</Text> : null}

      <PrimaryButton label="Về trang chủ" variant="secondary" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Orders" />
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
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.primary },
  subtitle: { color: theme.colors.muted },
  muted: { color: theme.colors.muted },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 2 },
  row: { color: theme.colors.muted, lineHeight: 20 },
  bold: { color: theme.colors.text, fontWeight: '800' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14, backgroundColor: theme.colors.background },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 6 },
});
