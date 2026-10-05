declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
    };
  }
}

const getProductionApiUrl = (): string => {
  // 1. Check for runtime injected environment configuration
  if (typeof window !== 'undefined' && window.__env?.apiUrl) {
    return window.__env.apiUrl;
  }

  // 2. If deployed as separate Render services (e.g. app-frontend.onrender.com),
  // automatically infer the backend service URL (app-backend.onrender.com)
  if (typeof window !== 'undefined' && window.location?.hostname?.includes('.onrender.com')) {
    if (window.location.hostname.includes('-frontend.onrender.com')) {
      const backendHost = window.location.hostname.replace('-frontend.onrender.com', '-backend.onrender.com');
      return `https://${backendHost}/api/v1`;
    }
  }

  // 3. In unified deployment or under reverse proxy, use relative path
  return '/api/v1';
};

export const environment = {
  production: true,
  apiUrl: getProductionApiUrl()
};

