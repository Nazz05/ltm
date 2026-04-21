import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View, StyleSheet, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { products } from '../data/products';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import ProductCard from '../components/ProductCard';

export default function SearchScreen({ navigation }) {
  const [term, setTerm] = useState('');
  const insets = useSafeAreaInsets();

  const results = useMemo(() => {
    const keyword = term.trim().toLowerCase();
    if (!keyword) return [];
    return products.filter((product) => {
      return [product.name, product.category, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [term]);

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Tìm kiếm" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.searchHeader}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>BACK</Text>
        </Pressable>
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Tìm kiếm sản phẩm..."
          style={styles.input}
          placeholderTextColor={theme.colors.muted}
        />
        <Pressable onPress={() => setTerm('')}>
          <Text style={styles.clear}>Xóa</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Kết quả tìm kiếm</Text>
      <Text style={styles.subtitle}>{term.trim() ? `Từ khóa: "${term}"` : 'Nhập từ khóa để bắt đầu'}</Text>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />
        )}
        ListEmptyComponent={term.trim() ? <Text style={styles.empty}>Không tìm thấy sản phẩm phù hợp.</Text> : null}
      />
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  back: { color: theme.colors.primary, fontWeight: '700', fontSize: 11 },
  clear: { color: theme.colors.primary, fontWeight: '700', fontSize: 11 },
  title: { fontSize: 32, fontWeight: '800', color: theme.colors.primary },
  subtitle: { color: theme.colors.muted, fontSize: 13 },
  input: { flex: 1, color: theme.colors.text, minHeight: 40 },
  row: { justifyContent: 'space-between', marginBottom: theme.spacing.md },
  empty: { color: theme.colors.muted, paddingTop: 12, textAlign: 'center' },
});
