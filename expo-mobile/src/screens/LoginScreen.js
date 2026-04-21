import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { apiUrl } from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const MOBILE_OAUTH_REDIRECT_URI = 'exp://192.168.0.102:8081/--/auth/callback';
const MOBILE_OAUTH_FLOW_NAME = 'GeneralOAuthFlow';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const getRedirectUri = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return MOBILE_OAUTH_REDIRECT_URI;
  };

  const redirectUri = getRedirectUri();
  const googleClientId = Constants.expoConfig?.extra?.googleClientId || '';
  const facebookClientId = Constants.expoConfig?.extra?.facebookClientId || '';

  const createOAuthState = (provider) => `${provider}:${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const openOAuth = async (provider) => {
    const isGoogle = provider === 'google';
    const clientId = isGoogle ? googleClientId : facebookClientId;
    const authUrl = isGoogle ? GOOGLE_AUTH_URL : FACEBOOK_AUTH_URL;

    if (!clientId) {
      Alert.alert('Thiếu cấu hình', `Thiếu ${provider}ClientId trong app.json > expo.extra`);
      return;
    }

    if (!redirectUri) {
      Alert.alert('Lỗi cấu hình', 'Không xác định được URI chuyển hướng OAuth.');
      return;
    }

    const state = createOAuthState(provider);
    const query = isGoogle
      ? {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          ...(Platform.OS !== 'web' ? { flowName: MOBILE_OAUTH_FLOW_NAME } : {}),
          state,
        }
      : {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'email,public_profile',
          state,
        };

    const params = new URLSearchParams(query);
    const finalUrl = `${authUrl}?${params.toString()}`;

    try {
      await Linking.openURL(finalUrl);
    } catch {
      displayToast('Không thể mở trang đăng nhập OAuth.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      displayToast('Vui lòng nhập email/tài khoản và mật khẩu.', 'warning');
      return;
    }

    try {
      setLoading(true);
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
      setTimeout(() => navigation.navigate('Home'), 500);
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
      <Text style={styles.slogan}>THỜI TRANG CHO MỌI NGƯỜI</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email/Tài khoản</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder=""
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor={theme.colors.muted}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder=""
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

        <PrimaryButton label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'} onPress={handleSubmit} disabled={loading} />

        <View style={styles.socialBlock}>
          <PrimaryButton label="Google" variant="secondary" onPress={() => openOAuth('google')} style={styles.socialButton} />
          <PrimaryButton label="Facebook" variant="secondary" onPress={() => openOAuth('facebook')} style={styles.socialButton} />
        </View>
      </View>

      <PrimaryButton label="Về trang chủ" variant="secondary" onPress={() => navigation.navigate('Home')} />
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
  content: { padding: 20, gap: 14, justifyContent: 'center', flexGrow: 1 },
  slogan: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 18,
    gap: 10,
  },
  label: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    minHeight: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: theme.colors.text,
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
    minHeight: 44,
    paddingHorizontal: 14,
  },
  socialBlock: {
    marginTop: 8,
    gap: 8,
    flexDirection: 'row',
  },
  socialButton: {
    flex: 1,
  },
});
