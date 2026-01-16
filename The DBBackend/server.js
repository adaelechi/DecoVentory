require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const materialRoutes = require('./routes/materials');
const chapelLogRoutes = require('./routes/chapelLogs');
const eventRoutes = require('./routes/events');
const borrowerRoutes = require('./routes/borrowers');
const activityLogRoutes = require('./routes/activityLogs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/chapel-logs', chapelLogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'DecoVentory API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 DecoVentory API Server running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
