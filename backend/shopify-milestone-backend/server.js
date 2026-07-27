import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import shopify from './shopify.js';
import Milestone from './models/Milestone.js';

// Setup __dirname equivalents for ES Module environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '8081', 10);
const app = express();

// Global JSON middleware parsing wrapper
app.use(express.json());

// Establish connection to database instance
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected seamlessly to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 1. Static Asset Serving Middleware — serves CSS/JS/images ONLY, NOT index.html
// { index: false } is critical: prevents index.html from being served without session validation
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// 2. Shopify Installation Handshake Routes
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), (req, res) => {
  const shop = res.locals.shopify.session.shop;
  const host = req.query.host;
  
  // Clean fallback host generation if Shopify did not pass it directly
  const safeHost = host || Buffer.from(`https://${shop}/admin`).toString('base64');
  
  // Crucial: Passing the host token allows the App Bridge loading phase to pass validation
  res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?host=${encodeURIComponent(safeHost)}`);
});

// 3. SECURE ENDPOINT: Manage store configuration changes securely
app.post('/api/milestones', shopify.validateAuthenticatedSession(), async (req, res) => {
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
});

// 4. Exit-iframe handler: breaks out of the Shopify admin iframe to start OAuth
// When ensureInstalledOnShop() finds no session, it redirects here.
// We MUST redirect to the auth URL (/api/auth) — NOT back to the admin app.
// Redirecting back to admin would just reload the app with no session → infinite loop.
app.get('/exitiframe', (req, res) => {
  const { shop, host } = req.query;

  if (shop && typeof shop === 'string' && shop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
    // The auth URL — this is where OAuth begins, creating a session
    const serverHost = process.env.HOST || `https://${req.headers.host}`;
    const authUrl = `${serverHost}/api/auth?shop=${encodeURIComponent(shop)}`;

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            // Break out of the Shopify admin iframe and start the OAuth flow
            if (window.top === window.self) {
              // Already at top level, just redirect
              window.location.href = "${authUrl}";
            } else {
              // Inside an iframe — redirect the top-level window
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

// 5. Catch-All Route: Protects and serves the React frontend UI to authenticated users
// Note: Path string removed entirely to avoid newer "path-to-regexp" compilation crashes
app.use(shopify.ensureInstalledOnShop(), async (req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 App backend processing requests live on port ${PORT}`));