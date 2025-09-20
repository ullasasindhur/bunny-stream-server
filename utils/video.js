import crypto from 'node:crypto';
import { LIBRARY_API_KEY, LIBRARY_ID } from "../constants/common.js";

export const getVideoUploadTokens = (guid) => {
    const expire = Math.floor(Date.now() / 1000) + 600;
    const raw = `${LIBRARY_ID}${LIBRARY_API_KEY}${expire}${guid}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return {
        AuthorizationSignature: hash,
        AuthorizationExpire: expire
    }
}

// const getVideoURL = async (req, res) => {
//   try {
//     const videoId = req.params.id;

//     const videoQuery = `
//       SELECT guid
//       FROM ${tables.VIDEOS}
//       WHERE guid = $1
//     `;
//     const { rows: videoRows } = await db.query(videoQuery, [videoId]);
//     if (videoRows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `Video ${videoId} is not available.`
//       });
//     }

//     const videoID = videoRows[0].guid;

//     const expires = Math.floor(Date.now() / 1000) + 3600;
//     const path = `/${videoID}/playlist.m3u8`;
//     const hashableBase = PULLZONE_API_KEY + path + expires;
//     let token = crypto.createHash('sha256').update(hashableBase).digest('base64');
//     token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
//     const playUrl = `https://${PULLZONE_URL}${path}?token=${token}&expires=${expires}`;

//     res.json({
//       success: true,
//       message: 'Video URL fetched successfully.',
//       playUrl
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch video URL.',
//       error: { message: error.message }
//     });
//   }
// };

// const getVideoThumbnailURL = async (req, res) => {
//   try {
//     const videoTitle = req.params.id;

//     const videoQuery = `
//       SELECT guid
//       FROM ${tables.VIDEOS}
//       WHERE title = $1
//     `;
//     const { rows: videoRows } = await db.query(videoQuery, [videoTitle]);
//     if (videoRows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `Video ${videoTitle} doesn't exist.`
//       });
//     }

//     const videoID = videoRows[0].guid;

//     const expires = Math.floor(Date.now() / 1000) + 3600;
//     const path = `/${videoID}/thumbnail.jpg`;
//     const hashableBase = PULLZONE_API_KEY + path + expires;
//     let token = crypto.createHash('sha256').update(hashableBase).digest('base64');
//     token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
//     const thumbnailUrl = `https://${PULLZONE_URL}${path}?token=${token}&expires=${expires}`;

//     res.json({
//       success: true,
//       message: 'Video thumbnail URL fetched successfully',
//       thumbnailUrl
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch video thumbnail URL',
//       error: { message: error.message }
//     });
//   }
// };

