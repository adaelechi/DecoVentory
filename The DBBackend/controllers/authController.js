const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.login = async (req, res) => {
  try {
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({ error: 'Passcode is required' });
    }

    // Get all active admins
    Admin.getAllActive(async (err, admins) => {
      if (err) {
        console.error('Database error fetching admins:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (!admins || admins.length === 0) {
        console.warn('Login attempt failed: No active admins found in database');
        return res.status(404).json({ error: 'No active users found' });
      }

      let matchedUser = null;
      
      // Compare passcode against all
      for (const admin of admins) {
        const isMatch = await bcrypt.compare(passcode, admin.passcode_hash);
        if (isMatch) {
          matchedUser = admin;
          break;
        }
      }

      if (!matchedUser) {
        return res.status(401).json({ error: 'Invalid passcode' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: matchedUser.id, role: matchedUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        role: matchedUser.role,
        message: 'Login successful'
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
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

    // Get active admin
    Admin.getActive(async (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      // Verify current passcode
      const isMatch = await bcrypt.compare(currentPasscode, admin.passcode_hash);

      if (!isMatch) {
        return res.status(401).json({ error: 'Current passcode is incorrect' });
      }

      // Hash new passcode
      const hashedPasscode = await bcrypt.hash(newPasscode, 10);

      // Update passcode
      Admin.updatePasscode(admin.id, hashedPasscode, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update passcode' });
        }

        res.json({ success: true, message: 'Passcode updated successfully' });
      });
    });
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
    Admin.updateByRole(role, hashedPasscode, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update passcode' });
      }

      res.json({ success: true, message: `${role.charAt(0).toUpperCase() + role.slice(1)} passcode updated successfully` });
    });
  } catch (error) {
    console.error('Admin update passcode error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
