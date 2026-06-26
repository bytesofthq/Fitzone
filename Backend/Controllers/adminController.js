import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fitzone_super_secret_jwt_key_98765', {
    expiresIn: '30d'
  });
};

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Public
export const registerAdmin = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Please provide name, phone and password' });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ phone });
    if (adminExists) {
      return res.status(400).json({ message: 'An admin with this phone number already exists' });
    }

    // Create the admin
    const admin = await Admin.create({
      name,
      phone,
      password
    });

    if (admin) {
      res.status(201).json({
        message: 'Admin registered successfully',
        token: generateToken(admin._id),
        admin: {
          id: admin._id,
          name: admin.name,
          phone: admin.phone
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    console.error('Register Admin Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  const { phone, password } = req.body;

  try {
    if (!phone || !password) {
      return res.status(400).json({ message: 'Please provide phone and password' });
    }

    // Find admin by phone
    const admin = await Admin.findOne({ phone });

    // Validate credentials
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        message: 'Login successful',
        token: generateToken(admin._id),
        admin: {
          id: admin._id,
          name: admin.name,
          phone: admin.phone
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid phone number or password' });
    }
  } catch (error) {
    console.error('Login Admin Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Public
export const logoutAdmin = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
