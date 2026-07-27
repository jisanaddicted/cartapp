import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  shop: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g., "your-store.myshopify.com"
  barColor: { 
    type: String, 
    default: '#008060' 
  },
  textColor: { 
    type: String, 
    default: '#000000' 
  },
  milestones: [
    {
      threshold: { type: Number, required: true }, // Stored in cents ($50 = 5000)
      rewardText: { type: String, required: true }  // e.g., "Free Shipping!"
    }
  ]
}, { timestamps: true });

export default mongoose.model('Milestone', MilestoneSchema);