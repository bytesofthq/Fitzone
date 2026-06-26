import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import memberRoutes from './routes/memberRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173'] 
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Database Connection with Fallback
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('Error: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB Cloud Database.');
  } catch (cloudError) {
    console.error(`MongoDB Cloud connection error: ${cloudError.message}`);
    const localURI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/fitzone';
    console.log(`Attempting to connect to local MongoDB fallback: ${localURI}...`);
    try {
      await mongoose.connect(localURI);
      console.log(`Successfully connected to Local MongoDB (${localURI}).`);
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
