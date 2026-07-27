import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import shopify from './shopify.js';
import Milestone from './models/Milestone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// 🚨 CRITICAL FOR RENDER DEPLOYMENTS: Tells Express to trust proxy headers from Render's load balancers
app.set('trust proxy', true);

// Global Tunnel Bypass Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning');
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Establish connection to database instance
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected seamlessly to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 1. Ensure Shopify CSP headers are injected globally for iframe rendering
app.use(shopify.cspHeaders());

// 2. Static Asset Serving
// Uniformly set to target the '../../frontend/dist' folder relative to your server script
const STATIC_PATH = path.join(__dirname, '../../frontend/dist');
app.use(express.static(STATIC_PATH, { index: false }));

// 3. Shopify Installation Handshake Routes
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath, 
  shopify.auth.callback(), 
  shopify.redirectToShopifyOrAppRoot()
);

// 4. API Endpoints
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

// 5. Exit-iframe handler
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
app.get('/', shopify.ensureInstalledOnShop(), async (req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .sendFile(path.join(STATIC_PATH, 'index.html'));
});

// 7. Plain SPA Fallback Router
// Aligned to serve index.html from the same static path to fix MIME type errors
app.get('*', async (req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .sendFile(path.join(STATIC_PATH, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 App backend processing requests live on port ${PORT}`)); 