import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import shopify from './shopify.js';
import Milestone from './models/Milestone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// CRITICAL FOR RENDER DEPLOYMENTS: Trusts proxy headers from Render's load balancers
app.set('trust proxy', true);




// Establish connection to database instance
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected seamlessly to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 1. Ensure Shopify CSP headers are injected globally for iframe rendering
app.use(shopify.cspHeaders());

// 2. Dynamic Asset Path Detector (Declared exactly ONCE)
let DETECTED_STATIC_PATH = path.join(__dirname, 'dist');

if (!fs.existsSync(DETECTED_STATIC_PATH) || !fs.existsSync(path.join(DETECTED_STATIC_PATH, 'index.html'))) {
  DETECTED_STATIC_PATH = path.join(__dirname, '../../frontend/dist');
}

console.log(`📂 Express is actively serving static files from: ${DETECTED_STATIC_PATH}`);
app.use(express.static(DETECTED_STATIC_PATH, { index: false }));

// 3. Shopify Installation Handshake Routes
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
// GET: Fetch configuration for a merchant store when dashboard mounts
app.get(
  '/api/milestones',
  shopify.validateAuthenticatedSession(),
  async (req, res) => {
    try {
      const session = res.locals.shopify.session;

      const config = await Milestone.findOne({ shop: session.shop });

      if (!config) {
        // Fallback baseline defaults if merchant has never saved configuration before
        return res.status(200).json({
          success: true,
          data: {
            barColor: '#008060',
            textColor: '#000000',
            milestones: []
          }
        });
      }

      res.status(200).json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
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

      // 🔍 DEBUG LOGS: Watch your Render terminal logs to see what prints here!
      console.log("---------------- API HIT ----------------");
      console.log("Shop Session Domain:", session?.shop);
      console.log("Incoming Body Data:", JSON.stringify(req.body, null, 2));

      if (!session?.shop) {
        return res.status(400).json({ success: false, error: "Shop domain session token missing." });
      }

      const updatedConfig = await Milestone.findOneAndUpdate(
        { shop: session.shop },
        { barColor, textColor, milestones },
        { new: true, upsert: true }
      );

      console.log("MongoDB Saved Result:", updatedConfig);
      console.log("-----------------------------------------");

      res.status(200).json({ success: true, data: updatedConfig });
    } catch (error) {
      console.error("❌ Database Write Error:", error);
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
    .sendFile(path.join(DETECTED_STATIC_PATH, 'index.html'));
});

// 7. Plain SPA Fallback Router
app.get('*', async (req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .sendFile(path.join(DETECTED_STATIC_PATH, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 App backend processing requests live on port ${PORT}`));