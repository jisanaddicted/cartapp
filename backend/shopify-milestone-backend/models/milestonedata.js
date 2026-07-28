import mongoose from 'mongoose';

// --- MILESTONE SCHEMA ---
// Represents individual targets the merchant creates (e.g., Spend $100 -> Get Free Tote Bag)
const MilestoneSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopDomain: {
    type: String, // e.g., "my-cool-store.myshopify.com" for quick querying
    required: true,
    index: true
  },
  targetAmount: {
    type: Number, // The spending goal (e.g., 100.00)
    required: true,
    min: 0
  },
  prizeName: {
    type: String, // The name of the reward (e.g., "Free Leather Tote Bag")
    required: true,
    trim: true
  },
  prizeIconUrl: {
    type: String, // MongoDB stores the URL of the uploaded image/icon
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// --- SHOP SCHEMA ---
// Tracks the merchant's global configurations, UI styles, and AI features
const ShopSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accessToken: {
    type: String, // Shopify offline OAuth token
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // UI Design Configuration for the Cart Drawer
  uiSettings: {
    primaryColor: { type: String, default: '#000000' },
    progressBarColor: { type: String, default: '#008060' }, // Shopify Green
    textColor: { type: String, default: '#ffffff' },
    drawerPosition: { type: String, enum: ['left', 'right'], default: 'right' }
  },
  // AI Agent Configuration
  aiSettings: {
    isVoiceEnabled: { type: Boolean, default: false },
    isChatEnabled: { type: Boolean, default: true },
    agentName: { type: String, default: 'AI Shopping Assistant' },
    customPromptInstructions: { 
      type: String, 
      default: 'You are a helpful retail assistant. Politely upsell items that complement the user\'s current cart to help them hit their milestones.'
    }
  }
}, { timestamps: true });

// Export Models
export const Milestone = mongoose.model('Milestone', MilestoneSchema);
export const Shop = mongoose.model('Shop', ShopSchema);