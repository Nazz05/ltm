import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import PrimaryButton from '../components/PrimaryButton';
import { apiUrl } from '../config/api';

export default function PaymentScreen({ navigation, route }) {
  const { token } = useAuth();
  const [methods, setMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const insets = useSafeAreaInsets();
  const orderId = route?.params?.orderId;
  const orderData = route?.params?.order;

  const createStandardPayment = async (methodCode) => {
    const response = await fetch(apiUrl('/payments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId,
        methodCode,
        amount: orderData.totalPrice,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Tạo giao dịch thanh toán thất bại');
    }

    return data;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [methodsRes, paymentsRes] = await Promise.all([
          apiFetch('/payments/methods'),
          token ? apiFetch('/payments', { token }) : Promise.resolve(null),
        ]);

        const methodsData = methodsRes ? await methodsRes.json() : null;
        const paymentsData = paymentsRes ? await paymentsRes.json() : null;
        const methodsPayload = methodsData?.data ?? methodsData;
        const paymentsPayload = paymentsData?.data ?? paymentsData;
        
        const methodsList = Array.isArray(methodsPayload) ? methodsPayload : methodsPayload?.methods || [];
        setMethods(methodsList);
        
        // Chọn phương thức đầu tiên mặc định
        if (methodsList.length > 0) {
          setSelectedMethod(methodsList[0]);
        }
        
        setPayments(Array.isArray(paymentsPayload) ? paymentsPayload : paymentsPayload?.payments || []);
      } catch {
        setMethods([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!orderId || !orderData) {
      Alert.alert('Lỗi', 'Thông tin đơn hàng không hợp lệ');
      return;
    }

    try {
      setProcessing(true);
      const methodCode = String(selectedMethod.code || '').toUpperCase();

      // COD xử lý thanh toán thường, các phương thức còn lại đi qua VNPAY.
      if (methodCode === 'COD') {
        await createStandardPayment(methodCode);

        Alert.alert('Thành công', 'Đơn hàng đã được xác nhận thanh toán COD.');
        navigation.navigate('Home');
        return;
      }

      // Các phương thức online sẽ đi qua VNPAY
      const vnpayResponse = await fetch(apiUrl('/payments/vnpay/create-url'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          locale: 'vn',
        }),
      });

      const vnpayData = await vnpayResponse.json();
      if (!vnpayResponse.ok) {
        const backendMessage = vnpayData?.message || '';
        if (backendMessage.includes('Thiếu cấu hình VNPAY')) {
          await createStandardPayment(methodCode);
          Alert.alert(
            'Thiếu cấu hình VNPAY',
            'Backend chưa cấu hình VNPAY nên hệ thống đã chuyển sang tạo thanh toán thường để bạn tiếp tục test.'
          );
          navigation.navigate('Home');
          return;
        }

        throw new Error(vnpayData.message || 'Không thể tạo link thanh toán VNPAY');
      }

      const paymentUrl = vnpayData?.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error('Không nhận được link thanh toán VNPAY');
      }

      if (Platform.OS === 'web') {
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Một số thiết bị trả false với canOpenURL dù URL https hợp lệ.
        await Linking.openURL(paymentUrl);
      }

      Alert.alert('Đang chuyển hướng', 'Bạn đang được chuyển sang cổng thanh toán VNPAY.');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể xác nhận thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  if (!orderId || !orderData) {
    return (
      <View style={styles.screenWrapper}>
        <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
        <BackHeader title="Thanh toán" />
        <View style={styles.centerWrap}>
          <Text style={styles.muted}>Không có thông tin đơn hàng. Vui lòng thử lại.</Text>
          <PrimaryButton label="Về giỏ hàng" onPress={() => navigation.navigate('Cart')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Thanh toán" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Phương thức thanh toán</Text>
        <Text style={styles.subtitle}>Bước 3 trong quy trình thanh toán</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đơn hàng #{orderData.id}</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Tổng tiền:</Text>
            <Text style={styles.orderValue}>{Number(orderData.totalPrice || 0).toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Địa chỉ:</Text>
            <Text style={styles.orderValue}>{orderData.shippingAddr}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Trạng thái:</Text>
            <Text style={styles.orderValue}>{orderData.status || 'Đang xử lý'}</Text>
          </View>
        </View>

        {loading ? <Text style={styles.muted}>Đang tải dữ liệu thanh toán...</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chọn phương thức thanh toán</Text>
          {methods.length > 0 ? (
            methods.map((method) => (
              <Pressable
                key={method.id || method.code}
                style={[
                  styles.methodItem,
                  selectedMethod?.code === method.code && styles.methodItemSelected,
                ]}
                onPress={() => setSelectedMethod(method)}
              >
                <View style={styles.methodContent}>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    {method.description && <Text style={styles.methodDesc}>{method.description}</Text>}
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod?.code === method.code && styles.radioButtonSelected,
                  ]}
                >
                  {selectedMethod?.code === method.code && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.muted}>Không có phương thức thanh toán nào.</Text>
          )}
        </View>

        {selectedMethod && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết</Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Phương thức:</Text>
              <Text style={styles.orderValue}>{selectedMethod.name}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Số tiền:</Text>
              <Text style={styles.orderValue}>{Number(orderData.totalPrice || 0).toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        )}

        <PrimaryButton
          label={processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          onPress={handleConfirmPayment}
          disabled={processing || !selectedMethod}
        />
        <PrimaryButton
          label="Quay lại"
          variant="secondary"
          onPress={() => navigation.navigate('Checkout')}
        />
      </ScrollView>
      <BottomNavigation navigation={navigation} activeRoute="Payment" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  title: { fontSize: 30, fontWeight: '800', color: theme.colors.primary },
  subtitle: { color: theme.colors.muted, lineHeight: 22, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  muted: { color: theme.colors.muted },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 8,
  },
  cardTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  orderLabel: { color: theme.colors.muted, fontWeight: '600' },
  orderValue: { color: theme.colors.text, fontWeight: '700' },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  methodItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  methodContent: {
    flex: 1,
  },
  methodInfo: { flex: 1, gap: 2 },
  methodName: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  methodDesc: { color: theme.colors.muted, fontSize: 12 },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  radioButtonSelected: { borderColor: theme.colors.primary },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    margin: 3,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
});
