import { products } from '../data/products';
import { apiUrl } from '../config/api';

const tryFetch = async (path) => {
  try {
    const response = await fetch(apiUrl(path));
    if (!response.ok) return null;
    const json = await response.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
};

export const productService = {
  async listProducts() {
    const remote = await tryFetch('/products?page=1&limit=100');
    if (Array.isArray(remote) && remote.length > 0) return remote;
    return products;
  },

  async getProductDetail(productId) {
    const remote = await tryFetch(`/products/${productId}`);
    if (remote) return remote;
    return products.find((item) => item.id === String(productId)) || null;
  },
};
