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
  // Auto-calculate fees based on plan
  if (this.isModified('plan') || !this.fees) {
    if (this.plan === 'Strength') {
      this.fees = 600;
    } else if (this.plan === 'Cardio') {
      this.fees = 1200;
    }
  }

  // Calculate default expiry date as 1 month from start date if not provided
  if (!this.expiryDate) {
    const start = this.startDate ? new Date(this.startDate) : new Date();
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + 1);
    this.expiryDate = expiry;
  }
});

const Member = mongoose.model('Member', memberSchema);
export default Member;
