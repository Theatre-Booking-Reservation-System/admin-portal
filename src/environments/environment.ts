// Production/default environment.
// The site is served over HTTPS (Netlify) while the backend ALB is HTTP, so the
// browser would block direct HTTP calls as mixed content. Instead, call each
// service via a relative "/api/<service>/..." path. Netlify proxies these
// server-side to the ALB (see netlify.toml), keeping the browser on HTTPS only.
export const environment = {
  production: true,
  appName: 'Sapumal Theatre — Admin Panel',
  services: {
    identity: '/api/identity',
    catalogue: '/api/catalogue',
    seat: '/api/seat',
    booking: '/api/booking',
  },
};
