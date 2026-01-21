require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const responseTimeMiddleware = require('./middleware/responseTime');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseTimeMiddleware);

// İlk admin kullanıcısını oluştur
const createDefaultAdmin = async () => {
  try {
    const adminCount = await AdminUser.countDocuments();

    if (adminCount === 0) {
      const defaultAdmin = new AdminUser({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        aktif: true
      });

      await defaultAdmin.save();
      console.log('✓ Varsayılan admin kullanıcısı oluşturuldu (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Varsayılan admin oluşturulurken hata:', error.message);
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı');
    createDefaultAdmin();
  })
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'EnSQL API Servisi Çalışıyor' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/admin-users', require('./routes/adminUsers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/connector', require('./routes/connector'));
app.use('/api/connectors', require('./routes/connectors'));
app.use('/api/connector-proxy', require('./routes/connectorProxy'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/chat', require('./routes/chat'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
