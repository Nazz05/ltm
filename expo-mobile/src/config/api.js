import Constants from 'expo-constants';
import { Platform } from 'react-native';

const inferBaseUrlFromExpoHost = () => {
  const hostCandidate =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';

  const host = String(hostCandidate).split(':')[0];
  if (!host) return null;

  return `http://${host}:8080/api`;
};

const fallbackBaseUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080/api'
  : 'http://localhost:8080/api';

let rawBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  fallbackBaseUrl;

const inferredBaseUrl = inferBaseUrlFromExpoHost();
if (
  inferredBaseUrl &&
  Platform.OS !== 'web' &&
  /localhost|127\.0\.0\.1/.test(rawBaseUrl)
) {
  rawBaseUrl = inferredBaseUrl;
}

export const API_BASE_URL = String(rawBaseUrl).replace(/\/$/, '');

export const apiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
