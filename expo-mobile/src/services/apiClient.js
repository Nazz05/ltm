import { apiUrl } from '../config/api';

export const apiFetch = async (path, { token, headers, body, ...options } = {}) => {
  const response = await fetch(apiUrl(path), {
    ...options,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response;
};
