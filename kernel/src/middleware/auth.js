const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Customer = require('../models/Customer');

// JWT token doğrulama middleware
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Yetkisiz erişim - Token bulunamadı'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token'dan role bilgisini al ve uygun modeli kullan
    let user;
    if (decoded.role === 'admin' || decoded.role === 'user') {
      user = await AdminUser.findById(decoded.id).select('-password');
    } else {
      user = await Customer.findById(decoded.id).select('-password');
      // Customer için role ekle (model'de yok)
      if (user) {
        user.role = 'customer';
      }
    }

    req.user = user;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Hizmet bitiş tarihi kontrolü (customer için)
    if (req.user.hizmetBitisTarihi) {
      if (new Date() > new Date(req.user.hizmetBitisTarihi)) {
        return res.status(403).json({
          success: false,
          message: 'Hizmet süreniz dolmuştur'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Yetkisiz erişim - Geçersiz token'
    });
  }
};

// Admin yetkisi kontrolü
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir'
    });
  }
};

// Connector authentication
exports.connectorAuth = async (req, res, next) => {
  const { clientId, clientPassword } = req.body;

  if (!clientId || !clientPassword) {
    return res.status(401).json({
      success: false,
      message: 'ClientId ve clientPassword gereklidir'
    });
  }

  try {
    const user = await User.findOne({ clientId, role: 'client' });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz connector bilgileri'
      });
    }

    const isMatch = await user.compareClientPassword(clientPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz connector bilgileri'
      });
    }

    // Hizmet bitiş tarihi kontrolü
    if (user.hizmetBitisTarihi && new Date() > new Date(user.hizmetBitisTarihi)) {
      return res.status(403).json({
        success: false,
        message: 'Hizmet süreniz dolmuştur'
      });
    }

    req.connectorUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};
