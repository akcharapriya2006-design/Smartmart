declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
    };
  }
}

export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && window.__env?.apiUrl)
    ? window.__env.apiUrl
    : 'https://smartmart-81wh.onrender.com/api/v1'
};
