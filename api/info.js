const express = require('express');
const ytdl = require('ytdl-core');
const { getVideoId, validateYouTubeUrl, formatDuration } = require('../utils/helpers');

const router = express.Router();

// Get detailed video information
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    if (!validateYouTubeUrl(url)) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Please provide a valid YouTube video ID'
      });
    }

    console.log(`ℹ️ Getting info for video: ${videoId}`);

    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;
    const formats = info.formats;

    // Process available formats
    const audioFormats = ytdl.filterFormats(formats, 'audioonly').map(fmt => ({
      itag: fmt.itag,
      type: 'audio',
      quality: fmt.audioBitrate ? `${fmt.audioBitrate}kbps` : 'unknown',
      container: fmt.container,
      size: fmt.contentLength,
      bitrate: fmt.bitrate
    }));

    const videoFormats = ytdl.filterFormats(formats, 'videoandaudio').map(fmt => ({
      itag: fmt.itag,
      type: 'video',
      quality: fmt.qualityLabel || fmt.quality,
      container: fmt.container,
      size: fmt.contentLength,
      fps: fmt.fps,
      bitrate: fmt.bitrate,
      resolution: `${fmt.width}x${fmt.height}`
    }));

    // Get related videos (if available)
    const relatedVideos = info.related_videos?.slice(0, 5).map(video => ({
      id: video.id,
      title: video.title,
      author: video.author?.name,
      duration: formatDuration(video.length_seconds),
      views: video.view_count,
      thumbnail: video.thumbnails?.[0]?.url
    })) || [];

    const videoInfo = {
      id: details.videoId,
      title: details.title,
      description: details.description,
      author: {
        name: details.author.name,
        id: details.author.id,
        url: details.author.channel_url,
        avatar: details.author.thumbnails?.[0]?.url,
        verified: details.author.verified || false,
        subscribers: details.author.subscriber_count
      },
      duration: {
        seconds: parseInt(details.lengthSeconds),
        formatted: formatDuration(details.lengthSeconds)
      },
      views: parseInt(details.viewCount),
      likes: details.likes,
      uploadDate: details.uploadDate,
      publishDate: details.publishDate,
      thumbnails: {
        default: details.thumbnails[0]?.url,
        medium: details.thumbnails[1]?.url,
        high: details.thumbnails[2]?.url,
        maxres: details.thumbnails[details.thumbnails.length - 1]?.url
      },
      category: details.category,
      tags: details.keywords || [],
      isLive: details.isLiveContent,
      isPrivate: details.isPrivate,
      ageRestricted: details.age_restricted,
      familySafe: !details.isFamilySafe,
      availableCountries: details.availableCountries,
      formats: {
        audio: audioFormats,
        video: videoFormats,
        total: formats.length
      },
      relatedVideos: relatedVideos,
      url: `https://www.youtube.com/watch?v=${details.videoId}`
    };

    res.json({
      success: true,
      message: 'Video information retrieved successfully',
      data: videoInfo,
      timestamp: new Date().toISOString(),
      api: 'Ntando-Mods-Pro v1.0'
    });

  } catch (error) {
    console.error('Info Error:', error);
    
    let errorMessage = 'Unable to get video information';
    let statusCode = 500;

    if (error.message.includes('Video unavailable')) {
      errorMessage = 'Video not found or unavailable';
      statusCode = 404;
    } else if (error.message.includes('private')) {
      errorMessage = 'Video is private';
      statusCode = 403;
    }

    res.status(statusCode).json({
      success: false,
      error: 'Info retrieval failed',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get video formats only
router.get('/:videoId/formats', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { type = 'all' } = req.query;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.getInfo(url);
    let formats = info.formats;

    // Filter by type if specified
    if (type === 'audio') {
      formats = ytdl.filterFormats(formats, 'audioonly');
    } else if (type === 'video') {
      formats = ytdl.filterFormats(formats, 'videoandaudio');
    }

    const formattedFormats = formats.map(fmt => ({
      itag: fmt.itag,
      type: fmt.hasVideo && fmt.hasAudio ? 'video' : fmt.hasAudio ? 'audio' : 'video-only',
      quality: fmt.qualityLabel || fmt.quality,
      container: fmt.container,
      size: fmt.contentLength,
      bitrate: fmt.bitrate,
      fps: fmt.fps,
      resolution: fmt.hasVideo ? `${fmt.width}x${fmt.height}` : null,
      audioBitrate: fmt.audioBitrate,
      mimeType: fmt.mimeType
    }));

    res.json({
      success: true,
      data: formattedFormats,
      count: formattedFormats.length,
      videoId: videoId
    });

  } catch (error) {
    console.error('Formats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get formats',
      message: error.message
    });
  }
});

module.exports = router;
