import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function TopBar({ onCartPress, cartCount }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.brandName}>SIXEDI</Text>
      <Pressable style={styles.cartButton} onPress={onCartPress}>
        <Ionicons name="bag-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.cartCount}>{cartCount}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  brandName: {
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  cartCount: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
