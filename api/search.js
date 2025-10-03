const express = require('express');
const YouTube = require('youtube-sr').default;
const { formatDuration, sanitizeString } = require('../utils/helpers');

const router = express.Router();

// Search YouTube videos
router.get('/', async (req, res) => {
  try {
    const { q: query, limit = 20, type = 'video' } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchLimit = Math.min(parseInt(limit) || 20, 50); // Max 50 results

    console.log(`🔍 Searching for: "${query}" (limit: ${searchLimit})`);

    const searchResults = await YouTube.search(query, {
      limit: searchLimit,
      type: type
    });

    if (!searchResults || searchResults.length === 0) {
      return res.json({
        success: true,
        message: 'No videos found',
        data: [],
        count: 0,
        query: query
      });
    }

    const formattedResults = searchResults.map(video => ({
      id: video.id,
      title: sanitizeString(video.title),
      author: {
        name: sanitizeString(video.channel?.name || 'Unknown'),
        id: video.channel?.id,
        url: video.channel?.url,
        verified: video.channel?.verified || false
      },
      description: sanitizeString(video.description || ''),
      duration: {
        seconds: video.duration,
        formatted: formatDuration(video.duration)
      },
      views: video.views,
      uploadedAt: video.uploadedAt,
      thumbnail: {
        default: video.thumbnail?.url,
        medium: video.thumbnail?.url?.replace('default', 'mqdefault'),
        high: video.thumbnail?.url?.replace('default', 'hqdefault'),
        maxres: video.thumbnail?.url?.replace('default', 'maxresdefault')
      },
      url: video.url,
      type: video.type,
      live: video.live || false,
      tags: video.tags || [],
      category: video.category || 'Unknown'
    }));

    res.json({
      success: true,
      message: `Found ${formattedResults.length} videos`,
      data: formattedResults,
      count: formattedResults.length,
      query: query,
      timestamp: new Date().toISOString(),
      api: 'Ntando-Mods-Pro v1.0'
    });

  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'Unable to search YouTube at this time',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Please provide a search query'
      });
    }

    const suggestions = await YouTube.getSuggestions(query);

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      query: query
    });

  } catch (error) {
    console.error('Suggestions Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

module.exports = router;
