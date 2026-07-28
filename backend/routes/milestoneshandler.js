import express from 'express';
import { Milestone } from './models/milestonedata.js';

const router = express.Router();

// POST: Create or Update a milestone
router.post('/api/milestones', async (req, res) => {
  try {
    const { shopDomain, targetAmount, prizeName, prizeIconUrl } = req.body;

    // 1. Find the merchant's shop profile in database
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    // 2. Create the new milestone tied to that shop
    const newMilestone = new Milestone({
      shopId: shop._id,
      shopDomain,
      targetAmount,
      prizeName,
      prizeIconUrl
    });

    await newMilestone.save();
    return res.status(201).json({ success: true, data: newMilestone });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});