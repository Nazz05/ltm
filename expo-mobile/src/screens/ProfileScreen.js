import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PrimaryButton from '../components/PrimaryButton';

export default function ProfileScreen({ navigation }) {
  const { user, logout, token } = useAuth();
  const { clearCart } = useCart();
  const insets = useSafeAreaInsets();

  if (!token) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Bạn chưa đăng nhập</Text>
        <Text style={styles.emptyText}>Vui lòng đăng nhập để xem và quản lý hồ sơ của bạn.</Text>
        <PrimaryButton label="Đăng nhập" onPress={() => navigation.replace('Login')} />
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Hồ sơ" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.fullName || user?.name || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{user?.fullName || user?.name || 'Tài khoản'}</Text>
        <Text style={styles.sub}>{user?.email || 'Chưa có email'}</Text>
        {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
        <PrimaryButton 
          label="Cập nhật thông tin"
          variant="secondary"
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.editButton}
        />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || '-'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>{user?.phone || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vai trò</Text>
          <Text style={styles.infoValue}>{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quản lý tài khoản</Text>
      <View style={styles.grid}>
        <Card label="Đơn hàng" note="Theo dõi đơn" onPress={() => navigation.navigate('Orders')} />
        <Card label="Địa chỉ" note="Số địa chỉ" onPress={() => navigation.navigate('Address')} />
        <Card label="Thanh toán" note="Phương thức" onPress={() => navigation.navigate('Payment')} />
        <Card label="Hỗ trợ" note="Liên hệ" onPress={() => navigation.navigate('Home')} />
      </View>

      <View style={styles.actionButtons}>
        <PrimaryButton
          label="Đăng xuất"
          onPress={() => {
            logout();
            clearCart();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }}
        />
      </View>
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Profile" />
    </View>
  );
}

function Card({ label, note, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.cardNote}>{note}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  topIcon: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  brand: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 2 },
  headerBlock: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarText: { color: theme.colors.primary, fontSize: 36, fontWeight: '900' },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  sub: { color: theme.colors.muted, fontSize: 13, textAlign: 'center' },
  phone: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  editButton: {
    marginTop: 8,
    minWidth: 200,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 8,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { color: theme.colors.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  cardNote: { color: theme.colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  actionButtons: {
    gap: 10,
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14, backgroundColor: theme.colors.background },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 6 },
});
