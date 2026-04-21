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
      </View>

      <View style={styles.grid}>
        <Card label="Đơn hàng" note="Theo dõi đơn" onPress={() => navigation.navigate('Orders')} />
        <Card label="Địa chỉ" note="Số địa chỉ" onPress={() => navigation.navigate('Address')} />
        <Card label="Thanh toán" note="Phương thức" onPress={() => navigation.navigate('Payment')} />
        <Card label="Hỗ trợ" note="Liên hệ" onPress={() => navigation.navigate('Home')} />
      </View>

      <PrimaryButton label="Đăng nhập" onPress={() => navigation.navigate('Login')} />
      <PrimaryButton
        label="Đăng xuất"
        variant="secondary"
        onPress={() => {
          logout();
          clearCart();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }}
      />
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
  headerBlock: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: { color: theme.colors.primary, fontSize: 30, fontWeight: '900' },
  title: { fontSize: 30, fontWeight: '800', color: theme.colors.primary },
  sub: { color: theme.colors.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 5,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  cardTitle: { color: theme.colors.primary, fontSize: 20, fontWeight: '800' },
  cardNote: { color: theme.colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14, backgroundColor: theme.colors.background },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 6 },
});
