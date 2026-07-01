import Member from '../models/memberModel.js';

// @desc    Get all members with filters and search
// @route   GET /api/members
// @access  Private
export const getMembers = async (req, res) => {
  try {
    const { search, plan, status } = req.query;
    const query = {};

    // 1. Text Search Filter (name or phone)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Gym Plan Filter
    if (plan) {
      query.plan = plan;
    }

    // 3. Expiry Status Filter
    if (status) {
      const now = new Date();
      if (status === 'Active') {
        query.expiryDate = { $gte: now };
      } else if (status === 'Expired') {
        query.expiryDate = { $lt: now };
      }
    }

    const members = await Member.find(query).sort({ createdAt: -1 });

    // Dynamic enrichment with current active/expired status string
    const enrichedMembers = members.map(member => {
      const isExpired = new Date(member.expiryDate) < new Date();
      return {
        ...member._doc,
        status: isExpired ? 'Expired' : 'Active'
      };
    });

    res.json(enrichedMembers);
  } catch (error) {
    console.error('Get Members Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single member details
// @route   GET /api/members/:id
// @access  Private
export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const isExpired = new Date(member.expiryDate) < new Date();
    const enrichedMember = {
      ...member._doc,
      status: isExpired ? 'Expired' : 'Active'
    };

    res.json(enrichedMember);
  } catch (error) {
    console.error('Get Member Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new gym member
// @route   POST /api/members
// @access  Private
export const createMember = async (req, res) => {
  const { name, phone, age, gender, plan, duration, startDate, expiryDate, fees } = req.body;

  try {
    if (!name || !phone || !age || !gender || !plan) {
      return res.status(400).json({ message: 'Please provide name, phone, age, gender and plan' });
    }

    // Initialize document (pre-save middleware calculates fees and default expiry if needed)
    const member = new Member({
      name,
      phone,
      age: Number(age),
      gender,
      plan,
      duration,
      startDate: startDate ? new Date(startDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      fees: fees !== undefined ? Number(fees) : undefined
    });

    const savedMember = await member.save();

    const isExpired = new Date(savedMember.expiryDate) < new Date();
    res.status(201).json({
      message: 'Member registered successfully',
      member: {
        ...savedMember._doc,
        status: isExpired ? 'Expired' : 'Active'
      }
    });
  } catch (error) {
    console.error('Create Member Error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update member details
// @route   PUT /api/members/:id
// @access  Private
export const updateMember = async (req, res) => {
  const { name, phone, age, gender, plan, duration, startDate, expiryDate, fees } = req.body;

  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Map updated fields
    member.name = name !== undefined ? name : member.name;
    member.phone = phone !== undefined ? phone : member.phone;
    member.age = age !== undefined ? Number(age) : member.age;
    member.gender = gender !== undefined ? gender : member.gender;
    member.plan = plan !== undefined ? plan : member.plan;
    member.duration = duration !== undefined ? duration : member.duration;
    member.startDate = startDate !== undefined ? new Date(startDate) : member.startDate;
    member.expiryDate = expiryDate !== undefined ? new Date(expiryDate) : member.expiryDate;
    
    if (fees !== undefined) {
      member.fees = Number(fees);
    } else if ((plan && plan !== member.plan) || (duration && duration !== member.duration)) {
      const targetPlan = plan || member.plan;
      const targetDuration = duration || member.duration || '1 Month';
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
      member.fees = planFees[targetPlan]?.[targetDuration] || (targetPlan === 'Strength' ? 600 : 1200);
    }

    const updatedMember = await member.save();

    const isExpired = new Date(updatedMember.expiryDate) < new Date();
    res.json({
      message: 'Member updated successfully',
      member: {
        ...updatedMember._doc,
        status: isExpired ? 'Expired' : 'Active'
      }
    });
  } catch (error) {
    console.error('Update Member Error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a gym member
// @route   DELETE /api/members/:id
// @access  Private
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await Member.deleteOne({ _id: req.params.id });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Delete Member Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check and list memberships expiring today or tomorrow
// @route   GET /api/members/check-expiry
// @access  Private
export const checkExpiry = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Query for members whose expiry dates match the target range
    const members = await Member.find({
      expiryDate: {
        $gte: startOfToday,
        $lte: endOfTomorrow
      }
    }).sort({ expiryDate: 1 });

    const enrichedMembers = members.map(member => {
      const isExpired = new Date(member.expiryDate) < new Date();
      return {
        ...member._doc,
        status: isExpired ? 'Expired' : 'Active'
      };
    });

    res.json(enrichedMembers);
  } catch (error) {
    console.error('Check Expiry Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
