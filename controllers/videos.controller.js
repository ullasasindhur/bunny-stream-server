import { got } from 'got';
import crypto from 'node:crypto';
import { getDb } from '../database.js';
import captions from '../constants/captions.js';
import { LIBRARY_API_KEY, LIBRARY_ID } from '../constants/common.js';
import { tables, videoStatus } from '../constants/db.js';
import { bunnyClient } from '../config/bunnyClient.js';
import { getVideoUploadTokens } from '../utils/video.js';

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
      SELECT *
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
    const response = await bunnyClient.get(`videos/${videoId}`);
    const { category, title, description } = rows[0] || {};

    res.json({
      success: true,
      message: 'Video fetched successfully.',
      data: { ...rows[0], ...response.body, category, title, description }
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
      SELECT guid, title, description, "thumbnailFileName", category, genres
      FROM ${tables.VIDEOS}
      WHERE genres @> $1::jsonb
      ORDER BY "createdAt" DESC
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
const createVideo = async (req, res) => {
  try {
    const { title, category, collectionId, thumbnailTime, description, tags, genres, status, expiryTime } =
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
      INSERT INTO ${tables.VIDEOS} ("guid", "title", "description", "tags", "category", "status", "genres", "expiryTime")
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
    `,
      [
        data.guid,
        title,
        description,
        JSON.stringify(tags || []),
        category,
        status,
        JSON.stringify(genres || []),
        expiryTime
      ]
    );

    // Generate tokens required to upload video
    const tokens = getVideoUploadTokens(data.guid);

    res.status(201).json({
      success: true,
      message: `Video ${title} created successfully`,
      data: {
        ...data,
        ...tokens
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
    const videoId = req.params.id;
    const { category, title, thumbnailFileName, description, tags, genres, status, version } = req.body;

    // Check if video exists
    const checkQuery = `SELECT guid FROM ${tables.VIDEOS} WHERE guid = $1`;
    const { rows: existingRows } = await db.query(checkQuery, [videoId]);

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
        "thumbnailFileName" = COALESCE($4, "thumbnailFileName"),
        "description" = COALESCE($5, "description"),
        "tags" = COALESCE($6, "tags"),
        "genres" = COALESCE($7, "genres"),
        "status" = COALESCE($8, "status"),
        "version" = COALESCE($9, "version"),
        "modifiedAt" = NOW()
      WHERE "guid" = $1
    `;

    await db.query(updateQuery, [
      videoId,
      category,
      title,
      thumbnailFileName,
      description,
      tags ? JSON.stringify(tags) : null,
      genres ? JSON.stringify(genres) : null,
      status,
      version
    ]);

    // Generate tokens required to upload video
    const tokens = getVideoUploadTokens(videoId);

    res.json({
      success: true,
      message: 'Video draft saved successfully.',
      data: { ...tokens }
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
    const videoId = req.params.id;

    const videoQuery = `
      SELECT guid
      FROM ${tables.VIDEOS}
      WHERE guid = $1
    `;

    const options = {
      headers: {
        accept: 'application/json',
        AccessKey: LIBRARY_API_KEY
      }
    };

    await got.delete(`${url}/${LIBRARY_ID}/videos/${videoId}`, options);

    const deleteQuery = `DELETE FROM ${tables.VIDEOS} WHERE guid = $1`;
    const { rowCount } = await db.query(deleteQuery, [videoId]);
    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No video found with given id.`
      });
    }
    
    res.json({
      success: true,
      message: `Video deleted successfully.`
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

const globalSearch = async (req, res) => {
  try {
    const queryParam = req.query.q;
    if (!queryParam) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required.'
      });
    }

    const searchQuery = `
    SELECT * FROM videos
    WHERE LOWER(title) LIKE LOWER($1)
       OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(tags) AS tag
           WHERE LOWER(tag) LIKE LOWER($1)
       );    
    `;
    const { rows } = await db.query(searchQuery, [`%${queryParam}%`]);

    res.json({
      success: true,
      message: 'Search results fetched successfully.',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search videos.',
      error: { message: error.message }
    });
  }
};

export {
  getVideos,
  getVideo,
  createVideo,
  updatevideo,
  deleteVideo,
  getCaptionsList,
  getVideosByGenre,
  globalSearch
};
