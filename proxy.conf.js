
//  Dev proxy for the Angular dev server (avoids browser CORS in development).

const SERVICES = {
  identity: process.env.IDENTITY_HOST || 'http://54.209.202.149:8081',
  // booking:    process.env.BOOKING_HOST    || 'http://107.21.38.75:8082',
  // production: process.env.PRODUCTION_HOST || 'http://<host>:<port>',
  // payment:    process.env.PAYMENT_HOST    || 'http://<host>:<port>',
};

module.exports = Object.entries(SERVICES).reduce((cfg, [name, target]) => {
  cfg[`/api/${name}`] = {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { [`^/api/${name}`]: '' },
  };
  return cfg;
}, {});
