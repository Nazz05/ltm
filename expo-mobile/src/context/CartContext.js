import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiUrl } from '../config/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load giỏ hàng từ backend khi user đăng nhập
  useEffect(() => {
    if (token) {
      loadCartFromServer();
    } else {
      setCartItems([]);
    }
  }, [token]);

  const loadCartFromServer = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/cart'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.data?.items) {
        setCartItems(
          data.data.items.map((item) => ({
            id: item.productId,
            name: item.product?.name || '',
            price: item.product?.price || 0,
            imageUrl: item.product?.image || '',
            quantity: item.quantity,
            size: 'M',
            color: 'Đen',
            availableQuantity: item.product?.stock || 0,
            cartItemId: item.id,
          }))
        );
      }
    } catch (error) {
      console.log('Lỗi tải giỏ hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    if (!token) {
      // Nếu chưa đăng nhập, chỉ update local
      setCartItems((currentItems) => {
        const existing = currentItems.find(
          (item) => item.id === product.id && item.size === product.size && item.color === product.color
        );
        if (existing) {
          return currentItems.map((item) =>
            item.id === product.id && item.size === product.size && item.color === product.color
              ? { ...item, quantity: item.quantity + product.quantity }
              : item
          );
        }
        return [...currentItems, product];
      });
      return;
    }

    try {
      // Gửi lên backend
      const response = await fetch(apiUrl('/cart/add'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: product.quantity,
        }),
      });

      const data = await response.json();
      if (response.ok && data.data?.items) {
        // Cập nhật local state từ server response
        setCartItems(
          data.data.items.map((item) => ({
            id: item.productId,
            name: item.product?.name || '',
            price: item.product?.price || 0,
            imageUrl: item.product?.image || '',
            quantity: item.quantity,
            size: 'M',
            color: 'Đen',
            availableQuantity: item.product?.stock || 0,
            cartItemId: item.id,
          }))
        );
      }
    } catch (error) {
      console.log('Lỗi thêm vào giỏ:', error);
      // Fallback: cập nhật local state nếu API fail
      setCartItems((currentItems) => {
        const existing = currentItems.find((item) => item.id === product.id);
        if (existing) {
          return currentItems.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + product.quantity } : item
          );
        }
        return [...currentItems, product];
      });
    }
  };

  const updateQuantity = async (id, size, color, quantity) => {
    if (quantity < 1) return;

    const item = cartItems.find((item) => item.id === id && item.size === size && item.color === color);
    if (!item || !token) {
      setCartItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id && item.size === size && item.color === color ? { ...item, quantity } : item
        )
      );
      return;
    }

    try {
      const response = await fetch(apiUrl(`/cart/${item.cartItemId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();
      if (response.ok && data.data?.items) {
        setCartItems(
          data.data.items.map((item) => ({
            id: item.productId,
            name: item.product?.name || '',
            price: item.product?.price || 0,
            imageUrl: item.product?.image || '',
            quantity: item.quantity,
            size: 'M',
            color: 'Đen',
            availableQuantity: item.product?.stock || 0,
            cartItemId: item.id,
          }))
        );
      }
    } catch (error) {
      console.log('Lỗi cập nhật số lượng:', error);
    }
  };

  const removeFromCart = async (id, size, color) => {
    const item = cartItems.find((item) => item.id === id && item.size === size && item.color === color);
    if (!item) return;

    if (!token) {
      setCartItems((currentItems) =>
        currentItems.filter((item) => !(item.id === id && item.size === size && item.color === color))
      );
      return;
    }

    try {
      const response = await fetch(apiUrl(`/cart/${item.cartItemId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.data?.items) {
        setCartItems(
          data.data.items.map((item) => ({
            id: item.productId,
            name: item.product?.name || '',
            price: item.product?.price || 0,
            imageUrl: item.product?.image || '',
            quantity: item.quantity,
            size: 'M',
            color: 'Đen',
            availableQuantity: item.product?.stock || 0,
            cartItemId: item.id,
          }))
        );
      }
    } catch (error) {
      console.log('Lỗi xóa khỏi giỏ:', error);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    
    if (!token) return;

    try {
      await fetch(apiUrl('/cart'), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.log('Lỗi xóa giỏ hàng:', error);
    }
  };

  const getCartTotal = () =>
    cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);

  const getCartCount = () => cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0);

  const value = useMemo(
    () => ({ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartCount, loading }),
    [cartItems, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
