import { got } from 'got';
import crypto from 'node:crypto';
import { getDb, videosTableName, librariesTableName } from '../database.js';
import captions from '../constants/captions.js';
import { LIBRARY_API_KEY, LIBRARY_ID } from '../constants/common.js';

const db = getDb();
const url = 'https://video.bunnycdn.com/library';

const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT guid, title, library_id, thumbnail_url 
             FROM ${videosTableName} 
             LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as totalCount FROM ${videosTableName}`);
    const totalCount = countResult[0].totalCount;

    res.json({
      success: true,
      message: 'Videos fetched successfully.',
      data: rows,
      pagination: {
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch videos.',
      error: { message: error.message }
    });
  }
};

const getVideo = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `SELECT guid, title, library_id, thumbnail_url 
             FROM ${videosTableName} 
             WHERE guid = ?`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: `A video doesn't exist.`
      });
    }
    res.json({
      success: true,
      message: 'Video fetched successfully.',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch the video.',
      error: { message: error.message }
    });
  }
};

const getVideoURL = async (req, res) => {
  try {
    const videoId = req.params.id;
    let [rows] = await db.query(`SELECT guid, library_id FROM ${videosTableName} WHERE guid = ?`, [
      videoId
    ]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Video ${videoId} not found in local DB`
      });
    }
    const { guid: videoID, library_id: libraryID } = rows[0];
    console.log('libraryID', libraryID);
    [rows] = await db.query(
      `SELECT pull_zone_security_key, pull_zone_url FROM ${librariesTableName} WHERE id = ?`,
      [libraryID]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Library not found for video ${videoTitle}`
      });
    }
    const { pull_zone_security_key: securityKey, pull_zone_url: pullZoneUrl } = rows[0];
    console.log('libraryID', rows[0]);
    if (!securityKey || !pullZoneUrl) {
      return res.status(500).json({
        success: false,
        message: 'Missing pull zone details for library'
      });
    }
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const path = `/${videoID}/playlist.m3u8`;
    const hashableBase = securityKey + path + expires;
    let token = crypto.createHash('sha256').update(hashableBase).digest('base64');
    token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
    const playUrl = `https://${pullZoneUrl}${path}?token=${token}&expires=${expires}`;

    res.json({
      success: true,
      message: 'Video URL fetched successfully',
      playUrl
    });
  } catch (error) {
    console.error('Error fetching video URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video URL',
      error: { message: error.message }
    });
  }
};

const getVideoThumbnailURL = async (req, res) => {
  try {
    const videoTitle = req.params.id;
    let [rows] = await db.query(`SELECT guid, library_id FROM ${videosTableName} WHERE title = ?`, [
      videoTitle
    ]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Video ${videoTitle} doesn't exist.`
      });
    }
    const { guid: videoID, library_id: libraryID } = rows[0];
    [rows] = await db.query(
      `SELECT pull_zone_security_key, pull_zone_url FROM ${librariesTableName} WHERE id = ?`,
      [libraryID]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Library not found for video ${videoTitle}`
      });
    }
    const { pull_zone_security_key: securityKey, pull_zone_url: pullZoneUrl } = rows[0];
    if (!securityKey || !pullZoneUrl) {
      return res.status(500).json({
        success: false,
        message: 'Missing pull zone details for library'
      });
    }
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const path = `/${videoID}/thumbnail.jpg`;
    const hashableBase = securityKey + path + expires;
    let token = crypto.createHash('sha256').update(hashableBase).digest('base64');
    token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
    const thumbnailUrl = `https://${pullZoneUrl}${path}?token=${token}&expires=${expires}`;
    res.json({
      success: true,
      message: 'Video thumbnail URL fetched successfully',
      thumbnailUrl
    });
  } catch (error) {
    console.error('Error fetching video thumbnail URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video thumbnail URL',
      error: { message: error.message }
    });
  }
};

const createVideo = async (req, res) => {
  try {
    const { title, description, collectionId, thumbnailTime } = req.body;
    let [rows] = await db.query(`SELECT * FROM ${videosTableName} WHERE title = ?`, [title]);
    if (rows && rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A video titled '${title}' already exists.`
      });
    }
    const options = {
      headers: {
        accept: 'application/json',
        AccessKey: LIBRARY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        collectionId: collectionId || '',
        thumbnailTime: thumbnailTime || 0
      })
    };
    // insert to bunny db
    const data = await got.post(`${url}/${LIBRARY_ID}/videos`, options).json();

    // insert to our db
    const insertQuery = `INSERT INTO ${videosTableName} (guid, library_id, title) VALUES (?, ?, ?)`;
    await db.query(insertQuery, [data.guid, LIBRARY_ID, title]);

    // Prepare tokens for video upload
    const expire = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    const raw = `${LIBRARY_ID}${LIBRARY_API_KEY}${expire}${data.guid}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');

    res.status(201).json({
      success: true,
      message: `Video ${title} created successfully`,
      data: {
        ...data,
        AuthorizationSignature: hash,
        AuthorizationExpire: expire
      }
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video',
      error: { message: error.message }
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const videoTitle = req.params.id;
    const [rows] = await db.query(
      `SELECT guid, library_id FROM ${videosTableName} WHERE title = ?`,
      [videoTitle]
    );
    if (!rows || rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: `A video named '${videoTitle}' doesn't exist.`
      });
    }
    const [libraryRows] = await db.query(`SELECT api_key FROM ${librariesTableName} WHERE id = ?`, [
      rows[0].library_id
    ]);
    if (!libraryRows || libraryRows.length === 0) {
      return res.status(409).json({
        success: false,
        message: `Video '${videoTitle}' isn't part of any existing library.`
      });
    }
    const options = {
      headers: {
        accept: 'application/json',
        AccessKey: libraryRows[0].api_key
      }
    };
    await got.delete(`${url}/${rows[0].library_id}/videos/${rows[0].guid}`, options);
    const [result] = await db.query(`DELETE FROM ${videosTableName} WHERE title = ?`, [videoTitle]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `No video named '${videoTitle}' found in the database.`
      });
    }
    res.json({
      success: true,
      message: `Video ${videoTitle} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to delete the video.',
      error: { message: error.message }
    });
  }
};

const getCaptionsList = (req, res) => {
  res.json({
    success: true,
    message: 'Captions list fetched successfully',
    data: captions
  });
};

export {
  getVideos,
  getVideo,
  createVideo,
  deleteVideo,
  getCaptionsList,
  getVideoURL,
  getVideoThumbnailURL
};
