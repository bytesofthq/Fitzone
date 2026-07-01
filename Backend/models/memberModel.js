import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a member name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Please add member age']
  },
  gender: {
    type: String,
    required: [true, 'Please select gender'],
    enum: ['Male', 'Female', 'Other']
  },
  plan: {
    type: String,
    required: [true, 'Please select a plan'],
    enum: ['Strength', 'Cardio']
  },
  duration: {
    type: String,
    enum: ['1 Month', '2 Month', '3 Month', '6 Month', '1 Yr'],
    default: '1 Month'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  fees: {
    type: Number
  }
}, {
  timestamps: true
});

// Synchronous Mongoose Pre-save Hook for Fee & Expiry defaults (no next parameter)
memberSchema.pre('save', function () {
  // Auto-calculate fees based on plan and duration if not provided
  if (!this.fees) {
    const planFees = {
      Strength: {
        '1 Month': 600,
        '2 Month': 1100,
        '3 Month': 1600,
        '6 Month': 2700,
        '1 Yr': 6000
      },
      Cardio: {
        '1 Month': 1200,
        '2 Month': 2200,
        '3 Month': 3300,
        '6 Month': 6000,
        '1 Yr': 11000
      }
    };
    const targetPlan = this.plan;
    const targetDuration = this.duration || '1 Month';
    this.fees = planFees[targetPlan]?.[targetDuration] || (targetPlan === 'Strength' ? 600 : 1200);
  }

  // Calculate default expiry date based on start date and duration if not provided
  if (!this.expiryDate) {
    const start = this.startDate ? new Date(this.startDate) : new Date();
    const expiry = new Date(start);
    
    const durationMonths = {
      '1 Month': 1,
      '2 Month': 2,
      '3 Month': 3,
      '6 Month': 6,
      '1 Yr': 12
    };
    const months = durationMonths[this.duration || '1 Month'] || 1;
    expiry.setMonth(expiry.getMonth() + months);
    
    this.expiryDate = expiry;
  }
});

const Member = mongoose.model('Member', memberSchema);
export default Member;
