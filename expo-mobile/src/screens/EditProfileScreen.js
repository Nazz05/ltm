import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { apiUrl } from '../config/api';
import BackHeader from '../components/BackHeader';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
  const { user, token, login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      displayToast('Vui lòng nhập họ tên.', 'warning');
      return false;
    }

    if (phone && !/^[0-9\s\+\-\(\)]*$/.test(phone)) {
      displayToast('Số điện thoại không hợp lệ.', 'warning');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl('/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật thất bại');
      }

      // Update auth context with new user data
      if (data.data) {
        login({ user: data.data, accessToken: token });
      }

      displayToast('Cập nhật thông tin thành công!', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      const rawMessage = error?.message || 'Có lỗi xảy ra';
      const friendlyMessage = /network request failed/i.test(rawMessage)
        ? 'Không kết nối được tới backend. Hãy kiểm tra API URL và đảm bảo backend đang chạy trong cùng mạng LAN.'
        : rawMessage;
      displayToast(friendlyMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Cập nhật thông tin" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ Tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ tên của bạn"
              style={styles.input}
              placeholderTextColor={theme.colors.muted}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại (không bắt buộc)"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor={theme.colors.muted}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>{user?.email || '-'}</Text>
            </View>
            <Text style={styles.helperText}>Email không thể thay đổi</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <PrimaryButton
            label={loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            onPress={handleSubmit}
            disabled={loading}
          />
          <PrimaryButton
            label="Hủy"
            variant="secondary"
            onPress={() => navigation.goBack()}
            disabled={loading}
          />
        </View>
      </ScrollView>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setShowToast(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#ffffff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: 10,
    marginTop: 12,
  },
});
