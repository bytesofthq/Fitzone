import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import memberRoutes from './routes/memberRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow requests from all origins (useful for dev) or specify frontend port e.g. 'http://localhost:5173'
  credentials: true
}));
app.use(express.json());

// Database Connection with Fallback
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitzone';
  try {
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB Cloud Database.');
  } catch (cloudError) {
    console.error(`MongoDB Cloud connection error: ${cloudError.message}`);
    console.log('Attempting to connect to local MongoDB fallback...');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/fitzone');
      console.log('Successfully connected to Local MongoDB (127.0.0.1:27017/fitzone).');
    } catch (localError) {
      console.error(`Failed to connect to local fallback MongoDB: ${localError.message}`);
      process.exit(1);
    }
  }
};

connectDB();

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/members', memberRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fitzone API is running smoothly' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
