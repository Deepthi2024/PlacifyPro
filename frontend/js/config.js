/**
 * Placify AI — Frontend Configuration
 * Centralized API Base URL and Environment Settings
 */

(function () {
  'use strict';

  // Allow override from environment or script tag before load
  const existingConfig = window.PLACIFY_CONFIG || window.PLACIFY_DEPLOYMENT_CONFIG || {};

  
function resolveBackendBaseUrl() {
  // 1. Always prioritize the explicit deployment configuration
  const deploymentUrl =
    window.PLACIFY_DEPLOYMENT_CONFIG?.API_BASE_URL;

  if (deploymentUrl) {
    return deploymentUrl.replace(/\/+$/, '');
  }

  // 2. Support an explicitly configured API URL
  if (existingConfig.API_BASE_URL) {
    return existingConfig.API_BASE_URL.replace(/\/+$/, '');
  }

  // 3. Use localhost only for local development
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // 4. Fail clearly rather than sending production requests
  // to the frontend's own domain
  throw new Error(
    'Backend URL is missing. Check deployment-config.js.'
  );
}


  const API_BASE_URL = resolveBackendBaseUrl();

  window.PLACIFY_CONFIG = Object.assign({}, existingConfig, {
    API_BASE_URL: API_BASE_URL,
    APP_NAME: 'Placify AI',
    VERSION: '1.0.0'
  });

  window.PLACIFY_API_BASE_URL = API_BASE_URL;

  // Helper utility to build API URLs cleanly
  window.getPlacifyApiUrl = function (path) {
    if (!path) return API_BASE_URL;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${API_BASE_URL}${cleanPath}`;
  };

  console.log(`[Placify Config] Initialized with API Base URL: ${API_BASE_URL}`);
})();
