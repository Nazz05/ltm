import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { apiUrl } from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  // Load saved email on component mount
  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberMeEmail');
      const savedRememberMe = await AsyncStorage.getItem('rememberMeChecked');
      if (savedEmail) {
        setUsername(savedEmail);
        setRememberMe(savedRememberMe === 'true');
      }
    } catch (error) {
      console.log('Error loading saved email:', error);
    }
  };

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };



  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      displayToast('Vui lòng nhập email/tài khoản và mật khẩu.', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Save email if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMeEmail', username.trim());
        await AsyncStorage.setItem('rememberMeChecked', 'true');
      } else {
        await AsyncStorage.removeItem('rememberMeEmail');
        await AsyncStorage.setItem('rememberMeChecked', 'false');
      }

      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      login(data);
      displayToast('Đăng nhập thành công!', 'success');
      // Close the login modal and reset to Home
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

      <Text style={styles.welcomeText}>Đăng nhập vào tài khoản của bạn</Text>

      <View style={styles.card}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email/Tài khoản</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Nhập email hoặc tên tài khoản"
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
              placeholder="Nhập mật khẩu"
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

        <Pressable 
          style={styles.rememberMeRow}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && (
              <MaterialCommunityIcons name="check" size={14} color="#ffffff" />
            )}
          </View>
          <Text style={styles.rememberMeText}>Ghi nhớ tôi</Text>
        </Pressable>

        <PrimaryButton 
          label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'} 
          onPress={handleSubmit} 
          disabled={loading}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Chưa có tài khoản? </Text>
        <PrimaryButton
          label="Đăng ký"
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
          style={styles.signupLink}
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
    fontSize: 14,
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
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rememberMeText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
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
  signupLink: {
    paddingHorizontal: 0,
  },
  backButton: {
    marginTop: 8,
  },
});
