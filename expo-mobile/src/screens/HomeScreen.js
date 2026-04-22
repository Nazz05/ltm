import React from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, Pressable, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ProductCard from '../components/ProductCard';
import PrimaryButton from '../components/PrimaryButton';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';

const protectedRoutes = new Set(['Checkout', 'Orders', 'Address', 'Payment']);

export default function HomeScreen({ navigation }) {
  const { user, token } = useAuth();
  const { getCartCount } = useCart();
  const insets = useSafeAreaInsets();
  const heroImage = products[0]?.image;
  const categoryCards = [
    { route: 'Products', label: 'Nhu cầu hằng ngày', image: products[3]?.image },
    { route: 'Products', label: 'Phong cách nam', image: products[1]?.image },
    { route: 'Products', label: 'Phụ kiện tinh gọn', image: products[8]?.image },
  ];

  const openRoute = (route) => {
    if (route === 'Admin' && !user?.role?.toUpperCase()?.includes('ADMIN')) {
      Alert.alert('Không có quyền', 'Bạn cần quyền admin để truy cập mục này.');
      return;
    }

    if (protectedRoutes.has(route) && !token) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để sử dụng chức năng này.');
      navigation.navigate('Login');
      return;
    }

    navigation.navigate(route);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.announcement}>
        <Text style={styles.announcementText}>Miễn phí vận chuyển cho đơn từ 500.000đ</Text>
      </View>

      <View style={styles.hero}>
        {heroImage ? <Image source={{ uri: heroImage }} style={styles.heroImage} /> : null}
        <View style={styles.overlay} />
        <View style={styles.heroBody}>
          <Text style={styles.kicker}>Bộ sưu tập mới</Text>
          <Text style={styles.title}>Phong cách{`\n`}Atelier</Text>
          <Text style={styles.subtitle}>
            Tuyển chọn thiết kế cao cấp, tập trung vào chất liệu và phom dáng để mặc đẹp mỗi ngày.
          </Text>
          <View style={styles.actions}>
            <PrimaryButton label="Mua ngay" onPress={() => openRoute('Products')} />
            <PrimaryButton
              label={token ? `Xin chào ${user?.fullName || user?.name || 'bạn'}` : 'Đăng nhập'}
              variant="secondary"
              onPress={() => (token ? openRoute('Profile') : navigation.navigate('Login'))}
            />
          </View>
        </View>
      </View>

      <View style={styles.featureGrid}>
        {['Giao nhanh', 'Đổi trả dễ', 'Chuẩn cao cấp', 'Hỗ trợ 24/7'].map((item) => (
          <View key={item} style={styles.featureItem}>
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionKicker}>TUYỂN CHỌN</Text>
        <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
      </View>

      <Pressable style={styles.largeCategory} onPress={() => openRoute(categoryCards[0].route)}>
        {categoryCards[0].image ? <Image source={{ uri: categoryCards[0].image }} style={styles.largeCategoryImage} /> : null}
        <View style={styles.largeOverlay} />
        <Text style={styles.largeCategoryLabel}>{categoryCards[0].label}</Text>
      </Pressable>

      <View style={styles.smallCategoryRow}>
        {categoryCards.slice(1).map((item) => (
          <Pressable key={item.label} style={styles.smallCategory} onPress={() => openRoute(item.route)}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.smallCategoryImage} /> : null}
            <View style={styles.smallOverlay} />
            <Text style={styles.smallCategoryLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionKicker}>DANH MỤC</Text>
        <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
      </View>

      <View style={styles.productGrid}>
        {products.slice(0, 6).map((product, index) => (
          <ProductCard
            key={product.id || index}
            product={product}
            onPress={() => navigation.navigate('ProductDetail', { product })}
          />
        ))}
      </View>

      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusBarPlaceholder: {
    backgroundColor: '#000000',
    width: '100%',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 112,
  },
  announcement: {
    backgroundColor: theme.colors.announcement,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  announcementText: {
    color: theme.colors.announcementText,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    minHeight: 360,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 249, 250, 0.58)',
  },
  heroBody: {
    padding: 18,
    justifyContent: 'flex-end',
    flex: 1,
    gap: 10,
  },
  kicker: {
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 42,
    lineHeight: 45,
    color: theme.colors.text,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.muted,
    maxWidth: '85%',
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  featureText: {
    color: theme.colors.primary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  sectionHead: {
    gap: 4,
  },
  sectionKicker: {
    color: theme.colors.muted,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 28,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  largeCategory: {
    height: 220,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  largeCategoryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  largeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  largeCategoryLabel: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    padding: 16,
  },
  smallCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  smallCategory: {
    width: '48%',
    height: 170,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  smallCategoryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  smallOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  smallCategoryLabel: {
    color: '#fff',
    fontWeight: '700',
    padding: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
