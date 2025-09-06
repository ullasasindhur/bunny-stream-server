import { got } from 'got';
import crypto from 'node:crypto';
import { getDb } from '../database.js';
import captions from '../constants/captions.js';
import {
  LIBRARY_API_KEY,
  LIBRARY_ID,
  PULLZONE_API_KEY,
  PULLZONE_URL
} from '../constants/common.js';
import { tables, videoStatus } from '../constants/db.js';

const db = getDb();
const url = 'https://video.bunnycdn.com/library';

const getVideos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const status = req.query.status || videoStatus.PUBLISHED;
    const offset = (page - 1) * limit;
    const table = status === videoStatus.PENDING ? tables.PENDING_VIDEOS : tables.PUBLISHED_VIDEOS;

    const videoQuery = `
      SELECT * FROM ${table}
      ORDER BY "createdAt" DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `SELECT COUNT(*) AS total_count FROM ${table}`;

    const { rows: videos } = await db.query(videoQuery, [limit, offset]);
    const { rows: countRows } = await db.query(countQuery);
    const totalCount = parseInt(countRows[0].total_count, 10);

    res.json({
      success: true,
      message: 'Videos fetched successfully.',
      data: videos,
      pagination: {
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch videos.',
      error: { message: error.message }
    });
  }
};

const getVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    const query = `
      SELECT guid, title, description, thumbnail_url, category, genres
      FROM ${tables.VIDEOS}
      WHERE guid = $1
    `;
    const { rows } = await db.query(query, [videoId]);

    if (rows.length === 0) {
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
    res.status(500).json({
      success: false,
      message: 'Unable to fetch the video.',
      error: { message: error.message }
    });
  }
};

const getVideosByGenre = async (req, res) => {
  try {
    const genre = req.query.genre;
    if (!genre) {
      return res.status(400).json({
        success: false,
        message: 'Genre is required in query parameter "id".'
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;

    const videoQuery = `
      SELECT guid, title, description, thumbnail_url, category, genres
      FROM ${tables.VIDEOS}
      WHERE genres @> $1::jsonb
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM ${tables.VIDEOS}
      WHERE genres @> $1::jsonb
    `;

    const { rows: videos } = await db.query(videoQuery, [JSON.stringify([genre]), limit, offset]);
    const { rows: countRows } = await db.query(countQuery, [JSON.stringify([genre])]);
    const totalCount = parseInt(countRows[0].total_count, 10);

    res.json({
      success: true,
      message: `Videos with genre '${genre}' fetched successfully.`,
      data: videos,
      pagination: {
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch videos by genre.',
      error: { message: error.message }
    });
  }
};

const getVideoURL = async (req, res) => {
  try {
    const videoId = req.params.id;

    const videoQuery = `
      SELECT guid
      FROM ${tables.VIDEOS}
      WHERE guid = $1
    `;
    const { rows: videoRows } = await db.query(videoQuery, [videoId]);
    if (videoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Video ${videoId} is not available.`
      });
    }

    const videoID = videoRows[0].guid;

    const expires = Math.floor(Date.now() / 1000) + 3600;
    const path = `/${videoID}/playlist.m3u8`;
    const hashableBase = PULLZONE_API_KEY + path + expires;
    let token = crypto.createHash('sha256').update(hashableBase).digest('base64');
    token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
    const playUrl = `https://${PULLZONE_URL}${path}?token=${token}&expires=${expires}`;

    res.json({
      success: true,
      message: 'Video URL fetched successfully.',
      playUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video URL.',
      error: { message: error.message }
    });
  }
};

const getVideoThumbnailURL = async (req, res) => {
  try {
    const videoTitle = req.params.id;

    const videoQuery = `
      SELECT guid
      FROM ${tables.VIDEOS}
      WHERE title = $1
    `;
    const { rows: videoRows } = await db.query(videoQuery, [videoTitle]);
    if (videoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Video ${videoTitle} doesn't exist.`
      });
    }

    const videoID = videoRows[0].guid;

    const expires = Math.floor(Date.now() / 1000) + 3600;
    const path = `/${videoID}/thumbnail.jpg`;
    const hashableBase = PULLZONE_API_KEY + path + expires;
    let token = crypto.createHash('sha256').update(hashableBase).digest('base64');
    token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
    const thumbnailUrl = `https://${PULLZONE_URL}${path}?token=${token}&expires=${expires}`;

    res.json({
      success: true,
      message: 'Video thumbnail URL fetched successfully',
      thumbnailUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video thumbnail URL',
      error: { message: error.message }
    });
  }
};

const createVideo = async (req, res) => {
  try {
    const { title, category, collectionId, thumbnailTime, description, tags, genres, status } =
      req.body;

    // Create virtual video
    const data = await got
      .post(`${url}/${LIBRARY_ID}/videos`, {
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
      })
      .json();

    // Add record in db
    await db.query(
      `
      INSERT INTO ${tables.VIDEOS} ("guid", "title", "description", "tags", "category", "status", "genres")
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
    `,
      [
        data.guid,
        title,
        description,
        JSON.stringify(tags || []),
        category,
        status,
        JSON.stringify(genres || [])
      ]
    );

    // Generate tokens required to upload video
    const expire = Math.floor(Date.now() / 1000) + 600;
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
    res.status(500).json({
      success: false,
      message: `Failed to create video ${req.body.title}.`,
      error: { message: error.message }
    });
  }
};

const updatevideo = async (req, res) => {
  try {
    const { guid, category, title, thumbnailUrl, description, tags, genres, status } = req.body;

    if (!guid) {
      return res.status(400).json({
        success: false,
        message: 'Video GUID is required.'
      });
    }

    // Check if video exists
    const checkQuery = `SELECT guid FROM ${tables.VIDEOS} WHERE guid = $1`;
    const { rows: existingRows } = await db.query(checkQuery, [guid]);

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Update video draft
    const updateQuery = `
      UPDATE ${tables.VIDEOS}
      SET
        "category" = COALESCE($2, "category"),
        "title" = COALESCE($3, "title"),
        "thumbnailUrl" = COALESCE($4, "thumbnailUrl"),
        "description" = COALESCE($5, "description"),
        "tags" = COALESCE($6, "tags"),
        "genres" = COALESCE($7, "genres"),
        "status" = COALESCE($8, "status"),
        "modifiedAt" = NOW()
      WHERE "guid" = $1
    `;

    await db.query(updateQuery, [
      guid,
      category,
      title,
      thumbnailUrl,
      description,
      tags ? JSON.stringify(tags) : null,
      genres ? JSON.stringify(genres) : null,
      status
    ]);

    res.json({
      success: true,
      message: 'Video draft saved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save video draft.',
      error: { message: error.message }
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const videoTitle = req.params.id;

    const videoQuery = `
      SELECT guid
      FROM ${tables.VIDEOS}
      WHERE title = $1
    `;
    const { rows: videoRows } = await db.query(videoQuery, [videoTitle]);
    if (videoRows.length === 0) {
      return res.status(409).json({
        success: false,
        message: `A video named '${videoTitle}' doesn't exist.`
      });
    }

    const options = {
      headers: {
        accept: 'application/json',
        AccessKey: LIBRARY_API_KEY
      }
    };

    await got.delete(`${url}/${LIBRARY_ID}/videos/${videoRows[0].guid}`, options);

    const deleteQuery = `DELETE FROM ${tables.VIDEOS} WHERE title = $1`;
    const { rowCount } = await db.query(deleteQuery, [videoTitle]);
    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No video named '${videoTitle}' exists.`
      });
    }

    res.json({
      success: true,
      message: `Video ${videoTitle} deleted successfully.`
    });
  } catch (error) {
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
  updatevideo,
  deleteVideo,
  getCaptionsList,
  getVideoURL,
  getVideoThumbnailURL,
  getVideosByGenre
};
