// Production/default environment.
// All microservices sit behind a single AWS ALB, routed by path prefix.
const ALB = 'http://theatre-alb-1442845415.us-east-1.elb.amazonaws.com';

export const environment = {
  production: true,
  appName: 'Sapumal Theatre — Admin Panel',
  services: {
    identity: `${ALB}/identity-service`,
    catalogue: `${ALB}/catalogue-service`,
    seat: `${ALB}/seat-service`,
    booking: `${ALB}/booking-service`,
  },
};
