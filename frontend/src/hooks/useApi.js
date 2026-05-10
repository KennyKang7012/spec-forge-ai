import useAuthStore from '../stores/authStore';

export const useApi = () => {
  const { token, logout } = useAuthStore();

  const request = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 如果有 token，自動帶入 Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      // 由於 Vite 設定了 proxy，這裡直接打 /api 開頭的路徑即可
      console.log(`[useApi] Fetching: ${config.method} ${endpoint}`);
      const response = await fetch(endpoint, config);
      
      // 檢查是否為 401 (未授權/Token 過期)
      if (response.status === 401) {
        logout();
        throw new Error('Session expired or unauthorized. Please log in again.');
      }

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {}
        throw new Error(errorData.detail || errorData.message || `API request failed: ${response.status}`);
      }

      // 如果請求的是 blob (例如下載檔案)
      if (options.responseType === 'blob') {
        return await response.blob();
      }

      // 如果請求的是 arraybuffer
      if (options.responseType === 'arraybuffer') {
        return await response.arrayBuffer();
      }

      // 預設處理為 JSON
      const text = await response.text();
      if (!text) return {};
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.warn('Response is not valid JSON:', text.substring(0, 100));
        return text;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, data, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint, data, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  };
};
