import cron from 'node-cron';
import { getDb } from '../database.js';
import { tables } from '../constants/db.js';
import got from 'got';
const db = getDb();
import { BASE_URL } from '../constants/common.js';

const deleteExpiredVideos = async () => {
  try {
    const now = new Date();
    const query = `
      SELECT guid FROM ${tables.VIDEOS}
      WHERE "expiryTime" <= $1
    `;
    const { rows: expiredVideos } = await db.query(query, [now]);
    console.log(
      `[${now.toISOString()}] Starting deletion of ${expiredVideos.length} expired videos.`
    );

    for (const video of expiredVideos) {
      const { guid } = video;
      try {
        const deleteUrl = `${BASE_URL}/videos/${guid}`;
        await got.delete(deleteUrl).json();
        console.log(
          `[${new Date().toISOString()}] Successfully deleted video with GUID: ${guid}.)}`
        );
      } catch (deleteError) {
        const errorDetails = deleteError.response ? deleteError.response.body : deleteError.message;
        console.error(
          `[${new Date().toISOString()}] Failed to delete video with GUID: ${guid}. Error: ${JSON.stringify(errorDetails)}`
        );
      }
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in deleteExpiredVideos cron job: ${error.message}`
    );
  }
};

const startCronJobs = () => {
  cron.schedule(
    '0 0 * * *',
    () => {
      deleteExpiredVideos();
    },
    {
      scheduled: true,
      timezone: 'UTC'
    }
  );
};

export { startCronJobs };
