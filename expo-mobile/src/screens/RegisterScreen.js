import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { apiUrl } from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

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

    if (!email.trim()) {
      displayToast('Vui lòng nhập email.', 'warning');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      displayToast('Email không hợp lệ.', 'warning');
      return false;
    }

    if (!password.trim()) {
      displayToast('Vui lòng nhập mật khẩu.', 'warning');
      return false;
    }

    if (password.length < 8) {
      displayToast('Mật khẩu phải có ít nhất 8 ký tự.', 'warning');
      return false;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      displayToast('Mật khẩu phải chứa chữ hoa, chữ thường và số.', 'warning');
      return false;
    }

    if (!confirmPassword.trim()) {
      displayToast('Vui lòng xác nhận mật khẩu.', 'warning');
      return false;
    }

    if (password !== confirmPassword) {
      displayToast('Mật khẩu không khớp.', 'warning');
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
      const response = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      login(data);
      displayToast('Đăng ký thành công!', 'success');
      // Close the register modal and reset to Home
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 250);
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>SIXEDI</Text>
          <Text style={styles.logoSub}>THỜI TRANG CHO MỌI NGƯỜI</Text>
        </View>

        <Text style={styles.welcomeText}>Tạo tài khoản mới</Text>

        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ Tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ tên của bạn"
              style={styles.input}
              placeholderTextColor={theme.colors.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor={theme.colors.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tối thiểu 8 ký tự, chứa chữ hoa, chữ thường, số"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor={theme.colors.muted}
              />
              <PrimaryButton
                label={showPassword ? 'Ẩn' : 'Xem'}
                variant="secondary"
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.toggleButton}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu"
                secureTextEntry={!showConfirmPassword}
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor={theme.colors.muted}
              />
              <PrimaryButton
                label={showConfirmPassword ? 'Ẩn' : 'Xem'}
                variant="secondary"
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.toggleButton}
              />
            </View>
          </View>

          <PrimaryButton
            label={loading ? 'Đang đăng ký...' : 'Đăng ký'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <PrimaryButton
            label="Đăng nhập"
            variant="secondary"
            onPress={() => navigation.replace('Login')}
            style={styles.loginLink}
          />
        </View>

        <PrimaryButton
          label="Về trang chủ"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
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
  content: { padding: 20, gap: 20, justifyContent: 'center', flexGrow: 1 },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  logoSub: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  welcomeText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  toggleButton: {
    minHeight: 48,
    paddingHorizontal: 14,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  loginLink: {
    paddingHorizontal: 0,
  },
  backButton: {
    marginTop: 8,
  },
});
