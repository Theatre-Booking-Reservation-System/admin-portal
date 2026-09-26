
//  Dev proxy for the Angular dev server (avoids browser CORS in development).


const ALB_HOST =
  process.env.ALB_HOST || 'http://ec2-3-237-240-69.compute-1.amazonaws.com';

// Map the app's service key 
const SERVICES = {
  identity: 'identity-service',
  catalogue: 'catalogue-service',
  seat: 'seat-service',
  booking: 'booking-service',
};

module.exports = Object.entries(SERVICES).reduce((cfg, [name, albPath]) => {
  cfg[`/api/${name}`] = {
    target: ALB_HOST,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { [`^/api/${name}`]: `/${albPath}` },
  };
  return cfg;
}, {});
