// Helper functions for the API

/**
 * Extract video ID from YouTube URL
 */
function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Validate YouTube URL
 */
function validateYouTubeUrl(url) {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]{11}(&[\w=]*)?$/;
  return regex.test(url);
}

/**
 * Format duration from seconds to readable format
 */
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str) {
  if (!str) return '';
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>]/g, '')
            .trim();
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate random string
 */
function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Validate request parameters
 */
function validateParams(params, required = []) {
  const missing = required.filter(param => !params[param]);
  return {
    isValid: missing.length === 0,
    missing: missing
  };
}

/**
 * Create error response
 */
function createErrorResponse(message, details = null, statusCode = 500) {
  return {
    success: false,
    error: message,
    details: details,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create success response
 */
function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString(),
    api: 'Ntando-Mods-Pro v1.0'
  };
}

module.exports = {
  getVideoId,
  validateYouTubeUrl,
  formatDuration,
  sanitizeString,
  formatFileSize,
  generateId,
  validateParams,
  createErrorResponse,
  createSuccessResponse
};
