const SystemMetrics = require('../models/SystemMetrics');

// Response time tracking middleware
const responseTimeMiddleware = async (req, res, next) => {
  const startTime = Date.now();

  // Response bittiğinde çalışacak
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;

    // Sadece API endpoint'lerini kaydet, statik dosyaları atla
    if (req.path.startsWith('/api/')) {
      try {
        await SystemMetrics.create({
          responseTime,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode
        });
      } catch (error) {
        // Hata olsa bile uygulamayı kesmesin
        console.error('Metrics save error:', error.message);
      }
    }
  });

  next();
};

module.exports = responseTimeMiddleware;
