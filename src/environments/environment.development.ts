// Development environment.
// Each service is called via "/api/<service>/..." and forwarded by the dev
// proxy (proxy.conf.js) to its real host, avoiding browser CORS.
export const environment = {
  production: false,
  appName: 'Sapumal Theatre — Admin Panel',
  services: {
    identity: '/api/identity',
    // booking: '/api/booking',        (add later)
    // production: '/api/production',
    // payment: '/api/payment',
  },
};
