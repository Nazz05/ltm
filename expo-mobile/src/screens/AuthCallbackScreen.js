import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, Alert, ActivityIndicator, View, Platform } from 'react-native';
import { apiUrl } from '../config/api';
import { theme } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const handledCodes = new Set();
const MOBILE_OAUTH_REDIRECT_URI = 'exp://192.168.0.102:8081/--/auth/callback';

const resolveProvider = (state = '') => state.split(':')[0] || '';

export default function AuthCallbackScreen({ route, navigation }) {
  const [status, setStatus] = useState('Đang xử lý đăng nhập...');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const { login } = useAuth();

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    const run = async () => {
      const params = route?.params || {};
      const code = params.code;
      const state = params.state || '';
      const error = params.error;
      const provider = resolveProvider(state);
      let redirectUri = 'sixedishop://auth/callback';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        redirectUri = `${window.location.origin}/auth/callback`;
      } else {
        redirectUri = MOBILE_OAUTH_REDIRECT_URI;
      }

      if (error) {
        displayToast('Bạn đã hủy hoặc OAuth bị lỗi.', 'error');
        setTimeout(() => navigation.replace('Login'), 1000);
        return;
      }

      if (!code || !state) {
        displayToast('Không nhận được code/state từ OAuth.', 'error');
        setTimeout(() => navigation.replace('Login'), 1000);
        return;
      }

      if (handledCodes.has(code)) return;
      handledCodes.add(code);

      try {
        setStatus('Đang gửi code về backend...');
        const response = await fetch(apiUrl(`/auth/oauth/${provider}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập OAuth thất bại');
        }

        login(data);
        setStatus('Đăng nhập thành công.');
        displayToast('Đăng nhập thành công!', 'success');
        setTimeout(() => navigation.replace('Home'), 500);
      } catch (error) {
        handledCodes.delete(code);
        displayToast(error.message || 'Có lỗi khi xử lý OAuth', 'error');
        setTimeout(() => navigation.replace('Login'), 1500);
      }
    };

    run();
  }, [navigation, route?.params]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.title}>Đang xử lý đăng nhập</Text>
          <Text style={styles.text}>{status}</Text>
        </View>
        <PrimaryButton label="Quay về đăng nhập" variant="secondary" onPress={() => navigation.replace('Login')} />
      </ScrollView>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setShowToast(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  text: {
    textAlign: 'center',
    color: theme.colors.muted,
    lineHeight: 22,
  },
});
