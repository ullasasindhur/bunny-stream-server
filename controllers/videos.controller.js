import { got } from 'got';
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
    console.log('libIDD ', LIBRARY_ID);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const status = req.query.status || videoStatus.PUBLISHED;
    const createdBy = req.query.userId || null;
    const offset = (page - 1) * limit;
    const table = status === videoStatus.PENDING ? tables.PENDING_VIDEOS : tables.PUBLISHED_VIDEOS;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const numericFields = ['views', 'totalWatchTime', 'averageWatchTime', 'engagementScore'];
    const allowedSortFields = [...numericFields, 'createdAt'];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`
      });
    }

    // --- Queries with optional createdBy filter ---
    const videoQuery = `
      SELECT *
      FROM ${table}
      WHERE ($3::UUID IS NULL OR "createdBy" = $3)
        ${numericFields.includes(sortBy) ? `AND "${sortBy}" > 0` : ''}
      ORDER BY "${sortBy}" ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM ${table}
      WHERE ($1::UUID IS NULL OR "createdBy" = $1)
        ${numericFields.includes(sortBy) ? `AND "${sortBy}" > 0` : ''}
    `;

    // --- Run queries ---
    const { rows: videos } = await db.query(videoQuery, [limit, offset, createdBy]);

    const { rows: countRows } = await db.query(countQuery, [createdBy]);
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
    let bunnyData = {};
    try {
      const response = await bunnyClient.get(`videos/${videoId}`);
      bunnyData = response.body;
    } catch (error) {
      console.log('Error fetching bunny video ', error);
    }
    const { category, title, description, status } = rows[0] || {};

    res.json({
      success: true,
      message: 'Video fetched successfully.',
      data: {
        ...rows[0],
        ...bunnyData,
        category,
        title,
        description,
        status
      }
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
    const genre = req.params.genre;
    if (!genre) {
      return res.status(400).json({
        success: false,
        message: 'Genre is required path parameter "genre".'
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;

    const videoQuery = `
      SELECT *
      FROM ${tables.PUBLISHED_VIDEOS}
      WHERE genres @> $1::jsonb
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM ${tables.PUBLISHED_VIDEOS}
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

const getVideosByDashboardView = async (req, res) => {
  try {
    const dashboardView = req.params.dashboardView;
    if (!dashboardView) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard view is required path parameter "dashboardView".'
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;

    const videoQuery = `
      SELECT *
      FROM ${tables.PUBLISHED_VIDEOS}
      WHERE "dashboardView" @> $1::jsonb
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM ${tables.PUBLISHED_VIDEOS}
      WHERE "dashboardView" @> $1::jsonb
    `;

    const { rows: videos } = await db.query(videoQuery, [
      JSON.stringify([dashboardView]),
      limit,
      offset
    ]);
    const { rows: countRows } = await db.query(countQuery, [JSON.stringify([dashboardView])]);
    const totalCount = parseInt(countRows[0].total_count, 10);

    res.json({
      success: true,
      message: `Videos with dashboardView '${dashboardView}' fetched successfully.`,
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
    const {
      title,
      category,
      collectionId,
      thumbnailTime,
      description,
      tags,
      genres,
      directors,
      producers,
      cast,
      languages,
      studio,
      status,
      createdBy
    } = req.body;

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
      INSERT INTO ${tables.VIDEOS} ("guid", "title", "description", "tags", "category", "status", "genres", "directors", "producers", "cast", "studio", "languages", "createdBy") 
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `,
      [
        data.guid,
        title,
        description,
        JSON.stringify(tags || []),
        category,
        status,
        JSON.stringify(genres || []),
        JSON.stringify(directors || []),
        JSON.stringify(producers || []),
        JSON.stringify(cast || []),
        studio,
        JSON.stringify(languages || []),
        createdBy
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
    const {
      category,
      title,
      thumbnailFileName,
      thumbnailStoragePath,
      description,
      tags,
      genres,
      directors,
      producers,
      cast,
      languages,
      studio,
      status,
      dashboardView,
      version
    } = req.body;

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
        "thumbnailStoragePath" = COALESCE($5, "thumbnailStoragePath"),
        "description" = COALESCE($6, "description"),
        "tags" = COALESCE($7, "tags"),
        "genres" = COALESCE($8, "genres"),
        "status" = COALESCE($9, "status"),
        "version" = COALESCE($10, "version"),
        "directors" = COALESCE($11, "directors"),
        "producers" = COALESCE($12, "producers"),
        "cast" = COALESCE($13, "cast"),
        "languages" = COALESCE($14, "languages"),
        "studio" = COALESCE($15, "studio"),
        "dashboardView" = COALESCE($16, "dashboardView"),
        "modifiedAt" = NOW()
      WHERE "guid" = $1
    `;

    await db.query(updateQuery, [
      videoId,
      category,
      title,
      thumbnailFileName,
      thumbnailStoragePath,
      description,
      tags ? JSON.stringify(tags) : null,
      genres ? JSON.stringify(genres) : null,
      status,
      version,
      directors ? JSON.stringify(directors) : null,
      producers ? JSON.stringify(producers) : null,
      cast ? JSON.stringify(cast) : null,
      languages ? JSON.stringify(languages) : null,
      studio,
      dashboardView
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
      message: 'Failed to update video.',
      error: { message: error.message }
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    const options = {
      headers: {
        accept: 'application/json',
        AccessKey: LIBRARY_API_KEY
      }
    };

    try {
      await got.delete(`${url}/${LIBRARY_ID}/videos/${videoId}`, options);
    } catch {}

    try {
      const videoQuery = `
        SELECT "thumbnailStoragePath"
        FROM ${tables.VIDEOS}
        WHERE guid = $1
      `;
      const { rows: videos } = await db.query(videoQuery, [videoId]);
      const thumbnailStoragePath = videos?.[0]?.thumbnailStoragePath;

      await got.delete(thumbnailStoragePath, {
        headers: {
          AccessKey: 'b0e13b54-e0a9-4f34-831a151fcbd0-c1e3-42cd'
        }
      });
    } catch {}

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
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 50, 1);
    const offset = (page - 1) * limit;

    if (!queryParam) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required.'
      });
    }

    const searchQuery = `
    SELECT * FROM ${tables.VIDEOS}
    WHERE LOWER(title) LIKE LOWER($1)
       OR LOWER("studio") LIKE LOWER($1)
       OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text("cast") AS a(actor_element)
           WHERE LOWER(a.actor_element) LIKE LOWER($1)
       )
       OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text("directors") AS d(director_element)
           WHERE LOWER(d.director_element) LIKE LOWER($1)
       )
       OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text("producers") AS p(producer_element)
           WHERE LOWER(p.producer_element) LIKE LOWER($1)
       )
       OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(tags) AS tag
           WHERE LOWER(tag) LIKE LOWER($1)
       )
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3    ;
    `;
    const { rows } = await db.query(searchQuery, [`%${queryParam}%`, limit, offset]);

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

const updateStats = async (req, res) => {
  try {
    const videoId = req.params.id;
    const videoDetails = await got.get(`${url}/${LIBRARY_ID}/videos/${videoId}`, {
      headers: {
        accept: 'application/json',
        AccessKey: LIBRARY_API_KEY
      }
    });

    const stats = await got.get(`${url}/${LIBRARY_ID}/statistics?videoGuid=${videoId}`, {
      headers: {
        accept: 'application/json',
        AccessKey: LIBRARY_API_KEY
      }
    });
    const { views, totalWatchTime, averageWatchTime } = JSON.parse(videoDetails.body) || {};
    const { engagementScore } = JSON.parse(stats.body) || {};
    const updateQuery = `
        UPDATE ${tables.VIDEOS}
        SET
          "views" = 
                    CASE 
                      WHEN $2 > 0 THEN $2 
                      ELSE "views" 
                    END,
          "totalWatchTime" = 
                    CASE 
                      WHEN $3 > 0 THEN $3 
                      ELSE "totalWatchTime" 
                    END,
          "averageWatchTime" = 
                    CASE 
                      WHEN $4 > 0 THEN $4 
                      ELSE "averageWatchTime" 
                    END,
          "engagementScore" = 
                    CASE 
                      WHEN $5 > 0 THEN $5 
                      ELSE "engagementScore" 
                    END
        WHERE "guid" = $1
    `;

    await db.query(updateQuery, [
      videoId,
      views,
      totalWatchTime,
      averageWatchTime,
      engagementScore
    ]);
    res.json({
      success: true,
      message: 'Video stats updated successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update video stats.',
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
  globalSearch,
  updateStats,
  getVideosByDashboardView
};
