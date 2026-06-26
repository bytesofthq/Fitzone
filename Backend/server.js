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

// Helper to programmatically percent-encode MongoDB connection URI passwords
const formatMongoURI = (uri) => {
  if (!uri) return uri;
  try {
    const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/);
    if (!protocolMatch) return uri;
    
    const protocol = protocolMatch[1];
    const remaining = uri.slice(protocol.length);
    
    const lastAtIdx = remaining.lastIndexOf('@');
    if (lastAtIdx === -1) return uri;
    
    const credentials = remaining.slice(0, lastAtIdx);
    const hostAndOptions = remaining.slice(lastAtIdx);
    
    const colonIdx = credentials.indexOf(':');
    if (colonIdx === -1) return uri;
    
    const username = credentials.slice(0, colonIdx);
    const password = credentials.slice(colonIdx + 1);
    
    let encodedPassword;
    try {
      encodedPassword = encodeURIComponent(decodeURIComponent(password));
    } catch (e) {
      encodedPassword = encodeURIComponent(password);
    }
    
    return `${protocol}${username}:${encodedPassword}${hostAndOptions}`;
  } catch (err) {
    console.error(`Error formatting MongoDB URI: ${err.message}`);
    return uri;
  }
};

// Database Connection with Fallback
const connectDB = async () => {
  const rawMongoURI = process.env.MONGO_URI;
  if (!rawMongoURI) {
    console.error('Error: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  const mongoURI = formatMongoURI(rawMongoURI);

  try {
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB Cloud Database.');
  } catch (cloudError) {
    console.error(`MongoDB Cloud connection error: ${cloudError.message}`);
    const rawLocalURI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/fitzone';
    const localURI = formatMongoURI(rawLocalURI);
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
