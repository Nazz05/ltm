import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import PrimaryButton from '../components/PrimaryButton';

const tabs = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'users', label: 'Người dùng' },
  { key: 'revenue', label: 'Doanh thu' },
  { key: 'addresses', label: 'Địa chỉ' },
  { key: 'logs', label: 'Nhật ký' },
  { key: 'products', label: 'Sản phẩm' },
];

export default function AdminScreen({ navigation }) {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState({ loading: true });
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role?.toUpperCase().includes('ADMIN');

  const loadTab = async (tabKey = activeTab) => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      setState((current) => ({ ...current, loading: true }));

      if (tabKey === 'dashboard' || tabKey === 'revenue') {
        const response = await apiFetch('/admin/revenue', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({
          ...current,
          summary: payload?.summary || {},
          revenue: payload?.dailyRevenue || [],
          loading: false,
        }));
        return;
      }

      if (tabKey === 'orders') {
        const response = await apiFetch('/admin/orders', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, orders: payload?.orders || payload || [], loading: false }));
        return;
      }

      if (tabKey === 'users') {
        const response = await apiFetch('/admin/users', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, users: payload?.users || payload || [], loading: false }));
        return;
      }

      if (tabKey === 'addresses') {
        const response = await apiFetch('/admin/addresses', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, addresses: payload?.addresses || payload || [], loading: false }));
        return;
      }

      if (tabKey === 'logs') {
        const response = await apiFetch('/admin/audit-logs?page=0&size=20', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, logs: payload?.content || payload?.logs || payload || [], loading: false }));
        return;
      }

      const response = await apiFetch('/products?page=1&limit=20');
      const data = await response.json();
      const payload = data?.data ?? data;
      setState((current) => ({ ...current, products: Array.isArray(payload) ? payload : payload?.products || [], loading: false }));
    } catch {
      setState((current) => ({ ...current, loading: false }));
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    loadTab(activeTab);
  }, [activeTab, token, isAdmin]);

  if (!isAdmin) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.title}>Quản trị</Text>
        <Text style={styles.denied}>Bạn không có quyền truy cập trang này.</Text>
        <PrimaryButton label="Về trang chủ" onPress={() => navigation.navigate('Home')} />
      </View>
    );
  }

  const summary = state.summary || {};

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Quản trị" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>MANAGEMENT TERMINAL</Text>
      <Text style={styles.title}>Quan tri he thong</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {state.loading ? <Text style={styles.muted}>Đang tải dữ liệu...</Text> : null}

      {activeTab === 'dashboard' || activeTab === 'revenue' ? (
        <View style={styles.card}>
          <Row label="Tổng doanh thu" value={Number(summary.totalRevenue || 0).toLocaleString('vi-VN') + 'đ'} />
          <Row label="Tổng đơn hàng" value={String(summary.totalOrders || 0)} />
          <Row label="Giá trị TB" value={Number(summary.averageOrderValue || 0).toLocaleString('vi-VN') + 'đ'} />
        </View>
      ) : null}

      {activeTab === 'orders'
        ? (state.orders || []).map((order) => <MiniCard key={order.id} title={`Đơn #${order.id}`} lines={[`Trạng thái: ${order.status}`, `Tổng tiền: ${Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ`, order.shippingAddr || '-']} />)
        : null}

      {activeTab === 'users'
        ? (state.users || []).map((item) => <MiniCard key={item.id} title={item.fullName || item.email} lines={[item.email, item.role, item.phone || '-']} />)
        : null}

      {activeTab === 'addresses'
        ? (state.addresses || []).map((item) => <MiniCard key={item.id} title={item.fullName || 'Địa chỉ'} lines={[item.address || '-', item.phone || '-', item.isDefault ? 'Mặc định' : '']} />)
        : null}

      {activeTab === 'logs'
        ? (state.logs || []).map((item) => <MiniCard key={item.id} title={`${item.action} • ${item.entity}`} lines={[`Người dùng: ${item.userId || '-'}`, `Thời gian: ${item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}`]} />)
        : null}

      {activeTab === 'products'
        ? (state.products || []).map((item) => <MiniCard key={item.id} title={item.name} lines={[item.category?.name || item.category || '-', `${Number(item.price || 0).toLocaleString('vi-VN')}đ`, `Tồn kho: ${item.stock ?? item.quantum ?? '-'}`]} />)
        : null}

      <PrimaryButton label="Về trang chủ" variant="secondary" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Admin" />
    </View>
  );
}

function MiniCard({ title, lines }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {lines.filter(Boolean).map((line) => (
        <Text key={line} style={styles.line}>{line}</Text>
      ))}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  topIcon: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  brand: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1 },
  kicker: { color: theme.colors.muted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.primary },
  deniedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  denied: { color: theme.colors.muted, textAlign: 'center' },
  tabs: { gap: 10, paddingVertical: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginRight: 8 },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.text, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  muted: { color: theme.colors.muted },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, gap: 6 },
  cardTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 16 },
  line: { color: theme.colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: theme.colors.muted },
  value: { color: theme.colors.text, fontWeight: '800' },
});
