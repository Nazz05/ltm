import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { productService } from '../services/productService';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import ProductCard from '../components/ProductCard';
import PrimaryButton from '../components/PrimaryButton';

const categoryLabels = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Nam', label: 'Nam' },
  { key: 'Nữ', label: 'Nữ' },
  { key: 'Giày dép', label: 'Giày' },
  { key: 'Phụ kiện', label: 'Phụ kiện' },
];

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await productService.listProducts();
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    };

    load();
  }, []);

  const filteredProducts = useMemo(() => {
    if (category === 'all') return products;
    return products.filter((item) => item.category === category || item.category?.name === category);
  }, [category, products]);

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Sản phẩm" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.breadcrumb}>Trang chủ / Tất cả sản phẩm</Text>
      <Text style={styles.title}>Tất cả sản phẩm</Text>
      <Text style={styles.subtitle}>Bộ sưu tập tuyển chọn với đường nét hiện đại và chất liệu cao cấp.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {categoryLabels.map((item) => (
          <PrimaryButton
            key={item.key}
            label={item.label}
            variant={category === item.key ? 'primary' : 'secondary'}
            onPress={() => setCategory(item.key)}
            style={styles.filterButton}
          />
        ))}
      </ScrollView>

      {loading ? (
        <Text style={styles.stateText}>Đang tải sản phẩm...</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />
          )}
          ListEmptyComponent={<Text style={styles.stateText}>Không có sản phẩm nào.</Text>}
        />
      )}

      {!loading && filteredProducts.length > 0 ? (
        <PrimaryButton label="Xem thêm sản phẩm" variant="secondary" onPress={() => setCategory('all')} />
      ) : null}
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Products" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  topIcon: {
    color: theme.colors.primary,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  brand: {
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 2,
  },
  breadcrumb: {
    color: theme.colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 22,
    maxWidth: '90%',
  },
  filters: {
    gap: 10,
    paddingVertical: 6,
  },
  filterButton: {
    marginRight: 8,
    minWidth: 116,
    borderRadius: 999,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stateText: {
    color: theme.colors.muted,
    paddingVertical: 20,
  },
});
