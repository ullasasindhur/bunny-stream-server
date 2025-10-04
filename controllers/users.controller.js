import { tables } from '../constants/db.js';
import { getDb } from '../database.js';

const db = getDb();

export const getUserMetadata = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT "continueWatching", "preferedGenres", "preferedLanguages", "isAdmin", "isModerator", "isUploader", personalised FROM users WHERE email = $1`,
      [userId]
    );
    if (!result?.rows[0]) {
      return res.status(404).json({
        success: false,
        message: `User not found.`
      });
    }
    res.json({
      success: true,
      data: { success: true, message: 'User profile fetched', data: result.rows[0] }
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Error fetching user profile: ' + error.message });
  }
};

export const searchUsers = async (req, res) => {
  const searchQuery = req.query.q;
  const limit = 10;
  try {
    const result = await db.query(
      `SELECT "id", "email", "name", "picture", "isAdmin", "isModerator", "isUploader" FROM users WHERE email LIKE '%' || $1 || '%' LIMIT $2`,
      [searchQuery, limit]
    );
    res.json({
      success: true,
      data: { success: true, message: 'User profile fetched', data: result.rows }
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Error fetching user profile: ' + error.message });
  }
};

export const setVideoProgress = async (req, res) => {
  const { guid, progressSeconds, title, thumbnailFileName } = req.body;
  const userId = req.user.id;
  try {
    const result = await db.query(`SELECT "continueWatching" FROM users WHERE email = $1`, [
      userId
    ]);

    let list = result.rows[0]?.continueWatching || [];

    // Remove old entry if exists
    list = list.filter(item => item.guid !== guid);

    // Add new entry at start
    list.unshift({
      guid,
      progressSeconds,
      title,
      thumbnailFileName
    });

    // Keep only last 50
    if (list.length > 50) {
      list = list.slice(0, 20);
    }

    // Update DB
    await db.query('UPDATE users SET "continueWatching" = $1 WHERE email = $2', [
      JSON.stringify(list),
      userId
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Progress update failed: ' + error.message });
  }
};

export const setRole = async (req, res) => {
  const { userId, role, value } = req.body;

  try {
    const updateQuery = `
      UPDATE ${tables.USERS}
      SET
        "${role}" = COALESCE($2, "${role}")
      WHERE "id" = $1
    `;

    const result = await db.query(updateQuery, [userId, value]);

    res.json({ success: true, data: result?.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'User update failed: ' + error.message });
  }
};
