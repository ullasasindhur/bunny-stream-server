import { getDb } from '../database.js';
import { tables } from '../constants/db.js';
const db = getDb();

const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewQuery = `SELECT * FROM ${tables.VIDEO_REVIEWS} WHERE video_id = $1`;
    const { rowCount, rows } = await db.query(reviewQuery, [id]);
    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found with the given video ID.'
      });
    }
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch the review.',
      error: { message: error.message }
    });
  }
};

const addDetails = async (req, res) => {
  try {
    const { video_id, user_id, action, value } = req.body;

    if (!video_id || !user_id || !action || !value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: video_id, user_id, action, or value.'
      });
    }

    const insertQuery = `
      INSERT INTO ${tables.VIDEO_REVIEWS} (video_id, user_id, action, value)
      VALUES ($1, $2, $3, $4);
    `;

    await db.query(insertQuery, [video_id, user_id, action, value]);

    res.status(201).json({
      success: true,
      message: 'Review added successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to add the review.',
      error: { message: error.message }
    });
  }
};

export { getDetails, addDetails };
