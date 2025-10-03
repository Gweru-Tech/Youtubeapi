const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com', 'https://ntando-mods.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// API Routes
app.use('/api/search', require('./api/search'));
app.use('/api/download', require('./api/download'));
app.use('/api/info', require('./api/info'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Ntando-Mods-Pro API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    author: 'Mr Ntando - Elite Pro Tech'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Ntando-Mods-Pro YouTube API',
    version: '1.0.0',
    author: 'Mr Ntando - Elite Pro Tech',
    description: 'Professional YouTube API for searching and downloading videos',
    endpoints: {
      search: {
        url: '/api/search',
        method: 'GET',
        params: { q: 'search query', limit: 'number (optional, default: 20)' },
        description: 'Search YouTube videos'
      },
      videoInfo: {
        url: '/api/info/:videoId',
        method: 'GET',
        description: 'Get detailed video information'
      },
      download: {
        url: '/api/download',
        method: 'POST',
        body: { url: 'youtube video url', format: 'mp3|mp4|best' },
        description: 'Get download links for YouTube videos'
      }
    },
    social: {
      facebook: 'https://www.facebook.com/people/Elite-Pro/61567898664873/',
      whatsapp: 'https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g',
      youtube: 'https://youtube.com/@eliteprotechs',
      telegram: 'https://t.me/elitepro_md/',
      github: 'https://github.com/eliteprotech'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/api', '/api/search', '/api/info/:videoId', '/api/download']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Ntando-Mods-Pro API running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
  console.log(`💻 Created by: Mr Ntando - Elite Pro Tech`);
});

module.exports = app;
