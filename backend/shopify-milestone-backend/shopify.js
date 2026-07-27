import 'dotenv/config';
import { shopifyApp } from '@shopify/shopify-app-express';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';
import { ApiVersion } from '@shopify/shopify-api';

// Sync session engine cleanly to your Mongo database string
const sessionStorage = new MongoDBSessionStorage(
  process.env.MONGO_URI,
  'milestone-cart-db'
);

const shopify = shopifyApp({
  api: {
    apiVersion: ApiVersion.October25, // Keeps your API version stable
    // Removed the empty restResources object that caused the crash!
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