import React from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const protectedRoutes = new Set(['Checkout', 'Orders', 'Address', 'Payment']);

export default function BottomNavigation({ navigation, activeRoute }) {
  const { getCartCount } = useCart();
  const { user, token } = useAuth();

  const isAdmin = user?.role?.toUpperCase()?.includes('ADMIN');
  
  const navItems = [
    { route: 'Home', label: 'Trang chủ', icon: 'home-outline' },
    { route: 'Products', label: 'Sản phẩm', icon: 'grid-outline' },
    { route: 'Search', label: 'Tìm kiếm', icon: 'search-outline' },
    { route: 'Cart', label: 'Giỏ hàng', icon: 'cart-outline' },
    { route: 'Profile', label: 'Hồ sơ', icon: 'person-outline' },
    ...(isAdmin ? [{ route: 'Admin', label: 'Admin', icon: 'settings-outline' }] : []),
  ];

  const handleNavigation = (route) => {
    if (protectedRoutes.has(route) && !token) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để sử dụng chức năng này.');
      navigation.navigate('Login');
      return;
    }

    navigation.navigate(route);
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = item.route === activeRoute;
        const cartCount = item.route === 'Cart' ? getCartCount() : 0;
        return (
          <Pressable 
            key={item.route} 
            style={styles.navItem} 
            onPress={() => handleNavigation(item.route)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? theme.colors.primary : theme.colors.muted}
              />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
