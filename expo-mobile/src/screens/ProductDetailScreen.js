import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { productService } from '../services/productService';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import PrimaryButton from '../components/PrimaryButton';
import SurfaceCard from '../components/SurfaceCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const load = async () => {
      const data = await productService.getProductDetail(id);
      setProduct(data);
    };

    load();
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    return [product.image, ...(product.images || [])].filter(Boolean);
  }, [product]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Đang tải chi tiết sản phẩm...</Text>
      </View>
    );
  }

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock <= 0;

  const addProduct = () => {
    if (!user) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập trước khi mua hàng.');
      navigation.navigate('Login');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: images[0] || product.image,
      quantity,
      size: 'M',
      color: 'Đen',
      availableQuantity: stock,
    });
    Alert.alert('Đã thêm vào giỏ', 'Sản phẩm đã được thêm vào giỏ hàng.');
  };

  const buyNow = () => {
    if (!user) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập trước khi mua hàng.');
      navigation.navigate('Login');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: images[0] || product.image,
      quantity,
      size: 'M',
      color: 'Đen',
      availableQuantity: stock,
    });
    navigation.navigate('Checkout');
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Chi tiết sản phẩm" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View>
        <Image source={{ uri: images[selectedImage] }} style={styles.heroImage} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {images.map((image, index) => (
            <Pressable key={`${image}-${index}`} onPress={() => setSelectedImage(index)}>
              <Image
                source={{ uri: image }}
                style={[styles.thumb, selectedImage === index && styles.thumbActive]}
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.category}>Bộ sưu tập {typeof product.category === 'string' ? product.category : product.category?.name || 'Sản phẩm'}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {product.oldPrice ? <Text style={styles.oldPrice}>{formatMoney(product.oldPrice)}</Text> : null}
          {product.oldPrice ? <Text style={styles.badge}>Ưu đãi</Text> : null}
        </View>
        <Text style={styles.stock}>{isOutOfStock ? 'Đã hết hàng' : `Còn ${stock} sản phẩm, giao nhanh trong 24h`}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Số lượng</Text>
          <View style={styles.qtyControls}>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity((current) => Math.max(1, current - 1))}>
              <Text style={styles.qtyBtnText}>-</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQuantity((current) => Math.min(stock, current + 1))}
              disabled={isOutOfStock}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'} onPress={addProduct} />
          <PrimaryButton label="Mua ngay" variant="secondary" onPress={buyNow} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Mô tả và chất liệu</Text>
          <Text style={styles.infoText}>- Chất liệu bền đẹp, dễ phối đồ và giữ phom tốt.</Text>
          <Text style={styles.infoText}>- Hoàn thiện đường may kỹ lưỡng, thoáng khi mặc.</Text>
          <Text style={styles.infoText}>- Khuyến nghị giặt nhẹ, tránh sấy nhiệt cao.</Text>
        </View>
      </SurfaceCard>
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="ProductDetail" />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    color: theme.colors.muted,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: theme.radius.lg,
    backgroundColor: '#e2e8f0',
  },
  thumbs: {
    gap: 10,
    marginTop: 10,
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  thumbActive: {
    borderColor: theme.colors.primary,
  },
  card: {
    gap: 12,
  },
  category: {
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  oldPrice: {
    fontSize: 14,
    color: theme.colors.muted,
    textDecorationLine: 'line-through',
  },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stock: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: theme.colors.primarySoft,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  description: {
    color: theme.colors.muted,
    lineHeight: 22,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  qtyLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  qtyBtnText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '700',
    color: theme.colors.text,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 10,
    gap: 6,
  },
  infoTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  infoText: {
    color: theme.colors.muted,
    lineHeight: 21,
  },
});
