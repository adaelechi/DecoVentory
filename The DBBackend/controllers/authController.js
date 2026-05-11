const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.login = async (req, res) => {
  console.log('Auth: Login attempt started');
  try {
    const { passcode } = req.body;

    if (!passcode) {
      console.warn('Auth: Missing passcode in request');
      return res.status(400).json({ error: 'Passcode is required' });
    }

    // Get all active admins
    console.log('Auth: Fetching active admins from database...');
    const admins = await Admin.getAllActive();
    console.log(`Auth: Found ${admins ? admins.length : 0} active admins`);

    if (!admins || admins.length === 0) {
      console.warn('Auth: No active admins found in database');
      return res.status(404).json({ error: 'No active users found. Please initialize database.' });
    }

    let matchedUser = null;
    
    // Compare passcode against all
    console.log('Auth: Comparing passcode against hashes...');
    for (const admin of admins) {
      const isMatch = await bcrypt.compare(passcode, admin.passcode_hash);
      if (isMatch) {
        matchedUser = admin;
        console.log(`Auth: Match found for role: ${admin.role}`);
        break;
      }
    }

    if (!matchedUser) {
      console.warn('Auth: Invalid passcode attempt');
      return res.status(401).json({ error: 'Invalid access code' });
    }

    // Generate JWT token
    console.log('Auth: Generating JWT token...');
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    const token = jwt.sign(
      { id: matchedUser.id, role: matchedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Auth: Login successful');
    res.json({
      success: true,
      token,
      role: matchedUser.role,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Auth: Login CRITICAL ERROR:', error);
    // Return generic error for security
    res.status(500).json({ 
      error: 'Server error'
    });
  }
};

exports.changePasscode = async (req, res) => {
  try {
    const { currentPasscode, newPasscode } = req.body;

    if (!currentPasscode || !newPasscode) {
      return res.status(400).json({ error: 'Both current and new passcode required' });
    }

    if (newPasscode.length < 6) {
      return res.status(400).json({ error: 'New passcode must be at least 6 characters' });
    }

    // This part might need adjustment if we want to change passcode for the CURRENT logged in user
    // For now keeping it simple as per original logic but modernized
    const admins = await Admin.getAllActive();
    const admin = admins.find(a => a.role === req.user.role);

    if (!admin) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current passcode
    const isMatch = await bcrypt.compare(currentPasscode, admin.passcode_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Current passcode is incorrect' });
    }

    // Hash new passcode
    const hashedPasscode = await bcrypt.hash(newPasscode, 10);

    // Update passcode
    await Admin.updatePasscode(admin.id, hashedPasscode);
    res.json({ success: true, message: 'Passcode updated successfully' });
  } catch (error) {
    console.error('Change passcode error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.adminUpdatePasscode = async (req, res) => {
  try {
    const { role, newPasscode } = req.body;
    const requester = req.user;

    if (requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update role passcodes' });
    }

    if (!role || !newPasscode) {
      return res.status(400).json({ error: 'Role and new passcode required' });
    }

    if (newPasscode.length !== 6) {
      return res.status(400).json({ error: 'Passcode must be exactly 6 characters' });
    }

    // Hash new passcode
    const hashedPasscode = await bcrypt.hash(newPasscode, 10);

    // Update passcode by role
    await Admin.updateByRole(role, hashedPasscode);
    res.json({ success: true, message: `${role.charAt(0).toUpperCase() + role.slice(1)} passcode updated successfully` });
  } catch (error) {
    console.error('Admin update passcode error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
