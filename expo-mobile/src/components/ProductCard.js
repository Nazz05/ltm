import React from 'react';
import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../theme';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export default function ProductCard({ product, onPress }) {
  const categoryName = typeof product.category === 'string' ? product.category : product.category?.name || 'Sản phẩm';
  
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.category}>{categoryName}</Text>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {product.oldPrice ? <Text style={styles.oldPrice}>{formatMoney(product.oldPrice)}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  pressed: {
    opacity: 0.92,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
  },
  body: {
    padding: 12,
    gap: 6,
  },
  category: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  price: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  oldPrice: {
    color: theme.colors.muted,
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
});
