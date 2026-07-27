import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import shopify from './shopify.js';
import Milestone from './models/Milestone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Forced to 8081 to prevent Shopify CLI environment overrides from stealing port 3000
const PORT = 3000;
const app = express();
// Add right after: const app = express();

// Place this right after: const app = express();

// Global Tunnel Bypass Middleware
// Automatically injects the skip-warning header to handle direct browser window requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning');
  
  // If a browser is directly loading the page, tell the tunnel service to skip the warning page
  res.setHeader('ngrok-skip-browser-warning', 'true');
  
  next();
});
// Establish connection to database instance
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected seamlessly to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 1. Ensure Shopify CSP headers are injected globally for iframe rendering
app.use(shopify.cspHeaders());
// Locate this section in your server.js file
// It needs to climb two directories up (../../) to reach the root frontend assets
app.use(express.static(path.join(__dirname, '../../frontend/dist'), { index: false }));

// 2. Static Asset Serving — serves CSS/JS/images ONLY, NOT index.html


// 3. Shopify Installation Handshake Routes
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath, 
  shopify.auth.callback(), 
  shopify.redirectToShopifyOrAppRoot()
);

// 4. API Endpoints (Apply express.json middleware specifically to backend data routes)
app.post(
  '/api/milestones', 
  express.json(), 
  shopify.validateAuthenticatedSession(), 
  async (req, res) => {
    try {
      const session = res.locals.shopify.session;
      const { barColor, textColor, milestones } = req.body;

      const updatedConfig = await Milestone.findOneAndUpdate(
        { shop: session.shop },
        { barColor, textColor, milestones },
        { new: true, upsert: true }
      );

      res.status(200).json({ success: true, data: updatedConfig });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// 5. Exit-iframe handler: Breaks out of admin iframe when sessions are missing
app.get('/exitiframe', (req, res) => {
  const { shop } = req.query;

  if (shop && typeof shop === 'string' && shop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
    const serverHost = process.env.HOST || `https://${req.headers.host}`;
    const authUrl = `${serverHost}${shopify.config.auth.path}?shop=${encodeURIComponent(shop)}`;

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            if (window.top === window.self) {
              window.location.href = "${authUrl}";
            } else {
              window.top.location.href = "${authUrl}";
            }
          </script>
        </head>
        <body>
          <p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #5c5f62;">
            Connecting to Shopify... <a href="${authUrl}" target="_top">Click here if you aren't redirected</a>
          </p>
        </body>
      </html>
    `);
  } else {
    res.status(400).send('Missing or invalid shop query parameter');
  }
});

// 6. Explicit Root Path Handler
// This allows shopify.ensureInstalledOnShop() to intercept the baseline authentication 
// parameters cleanly right at the root domain entry level without hitting path structure limits.
app.get('/', shopify.ensureInstalledOnShop(), async (req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 7. Plain SPA Fallback Router
// Handles deep linking inside your React frontend application shell without triggering validation loops.
app.get('*', async (req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 App backend processing requests live on port ${PORT}`));