import 'dotenv/config';
import { shopifyApp } from '@shopify/shopify-app-express';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';

// Sync session engine cleanly to your Mongo database string
const sessionStorage = new MongoDBSessionStorage(
  process.env.MONGO_URI,
  'milestone-cart-db'
);

const shopify = shopifyApp({
  api: {
    // Passed as a direct string to guarantee a 1:1 match with your shopify.app.toml version
    apiVersion: '2026-07', 
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage,
});

export default shopify;