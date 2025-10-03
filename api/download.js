const express = require('express');
const ytdl = require('ytdl-core');
const { getVideoId, validateYouTubeUrl } = require('../utils/helpers');

const router = express.Router();

// Get download links
router.post('/', async (req, res) => {
  try {
    const { url, format = 'best', quality = 'highest' } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL',
        message: 'Please provide a YouTube video URL'
      });
    }

    if (!validateYouTubeUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid YouTube video URL'
      });
    }

    const videoId = getVideoId(url);
    console.log(`📥 Processing download request for: ${videoId}`);

    // Check if video exists and is available
    const isValid = await ytdl.validateURL(url);
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid video',
        message: 'Video not found or unavailable'
      });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Get available formats
    const formats = ytdl.filterFormats(info.formats, format === 'mp3' ? 'audioonly' : 'video');

    let downloadFormats = [];

    if (format === 'mp3' || format === 'audio') {
      // Audio formats
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      downloadFormats = audioFormats.map(fmt => ({
        itag: fmt.itag,
        format: 'mp3',
        quality: fmt.audioBitrate ? `${fmt.audioBitrate}kbps` : 'unknown',
        size: fmt.contentLength,
        url: fmt.url,
        mimeType: fmt.mimeType
      }));
    } else {
      // Video formats
      const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
      downloadFormats = videoFormats.map(fmt => ({
        itag: fmt.itag,
        format: 'mp4',
        quality: fmt.qualityLabel || fmt.quality,
        size: fmt.contentLength,
        url: fmt.url,
        mimeType: fmt.mimeType,
        fps: fmt.fps,
        bitrate: fmt.bitrate
      }));
    }

    // Sort by quality
    downloadFormats.sort((a, b) => {
      const qualityOrder = { '2160p': 5, '1440p': 4, '1080p': 3, '720p': 2, '480p': 1, '360p': 0 };
      return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
    });

    res.json({
      success: true,
      message: 'Download links generated successfully',
      data: {
        video: {
          id: videoDetails.videoId,
          title: videoDetails.title,
          author: videoDetails.author.name,
          duration: videoDetails.lengthSeconds,
          views: videoDetails.viewCount,
          thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
          uploadDate: videoDetails.uploadDate,
          description: videoDetails.description?.substring(0, 200) + '...'
        },
        formats: downloadFormats.slice(0, 10), // Limit to top 10 formats
        requestedFormat: format,
        totalFormats: downloadFormats.length
      },
      timestamp: new Date().toISOString(),
      api: 'Ntando-Mods-Pro v1.0'
    });

  } catch (error) {
    console.error('Download Error:', error);
    
    let errorMessage = 'Unable to process download request';
    let statusCode = 500;

    if (error.message.includes('Video unavailable')) {
      errorMessage = 'Video is unavailable or private';
      statusCode = 404;
    } else if (error.message.includes('age-restricted')) {
      errorMessage = 'Video is age-restricted';
      statusCode = 403;
    }

    res.status(statusCode).json({
      success: false,
      error: 'Download failed',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Stream download endpoint
router.get('/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { format = 'mp4', quality = 'highest' } = req.query;

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        error: 'Invalid video ID'
      });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

    res.header('Content-Disposition', `attachment; filename="${title}.${format}"`);
    
    const stream = ytdl(url, {
      format: format === 'mp3' ? 'audioonly' : 'videoandaudio',
      quality: quality
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Stream Error:', error);
    res.status(500).json({
      error: 'Stream failed',
      message: error.message
    });
  }
});

module.exports = router;
