import { apiUrl } from '../config/api';

export const apiFetch = async (path, { token, headers, ...options } = {}) => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response;
};
