import { got } from "got";
import { getDb, collectionsTableName, librariesTableName, collectionVideosTableName } from '../database.js';
const url = 'https://video.bunnycdn.com/library'
const db = getDb();

const getCollections = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const [rows] = await db.query(
            `SELECT guid, name, library_id, thumbnail_url, description
             FROM ${collectionsTableName} 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const [countResult] = await db.query(`SELECT COUNT(*) as totalCount FROM ${collectionsTableName}`);
        const totalCount = countResult[0].totalCount;
        res.json({
            success: true,
            message: "Collections fetched successfully.",
            data: rows,
            pagination: {
                currentPage: page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch collections.",
            error: { message: error.message }
        });
    }
}

const getCollection = async (req, res) => {
    try {
        const collectionName = req.params.id;
        const [collections] = await db.query(
            `SELECT guid, name, library_id, thumbnail_url, description
             FROM ${collectionsTableName}
             WHERE name = ?`,
            [collectionName]
        );
        if (!collections || collections.length === 0) {
            return res.status(409).json({
                success: false,
                message: `A collection named '${collectionName}' doesn't exist.`
            });
        }
        const collection = collections[0];
        const [videos] = await db.query(
            `SELECT v.guid, v.title, v.description, v.thumbnail_url
             FROM ${collectionVideosTableName} cv
             INNER JOIN videos v ON cv.video_guid = v.guid
             WHERE cv.collection_guid = ?`,
            [collection.guid]
        );
        res.json({
            success: true,
            message: "Collection fetched successfully.",
            data: {
                ...collection,
                videos: videos
            }
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch the collection.",
            error: { message: error.message }
        });
    }
};


const createCollection = async (req, res) => {
    try {
        const { collectionName, libraryName } = req.body;
        const [rows] = await db.query(`SELECT name FROM ${collectionsTableName} WHERE name = ?`, [collectionName]);
        if (rows && rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `A collection named '${collectionName}' already exists.`
            });
        }
        const [libraryRows] = await db.query(`SELECT id, api_key FROM ${librariesTableName} WHERE name = ?`, [libraryName]);
        if (!libraryRows || libraryRows.length === 0) {
            return res.status(409).json({
                success: false,
                message: `A library named '${libraryName}' doesn't exist.`
            });
        }
        const options = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: libraryRows[0].api_key
            },
            body: JSON.stringify({ name: collectionName })
        };
        const data = await got.post(`${url}/${libraryRows[0].id}/collections`, options).json();
        await db.query(`INSERT INTO ${collectionsTableName}(guid, name, library_id, description) VALUES(?, ?, ?, ?)`, [data.guid, collectionName, data.videoLibraryId, collectionName]);
        res.status(201).json({
            success: true,
            message: `Collection ${collectionName} created successfully`,
        });
    } catch (error) {
        console.error("Error creating collection:", error);
        res.status(500).json({
            message: "Failed to create collection",
            error: error.message
        });
    }
}

const updateCollection = async (req, res) => {
    try {
        const { currentName, newName } = req.body;
        if (!currentName || !newName) {
            return res.status(400).json({
                success: false,
                message: "Both currentName and newName are required."
            });
        }
        const [collectionRows] = await db.query(`SELECT guid, library_id FROM ${collectionsTableName} WHERE name = ?`, [currentName]);
        if (!collectionRows || collectionRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Collection named '${currentName}' not found.`
            });
        }
        const [libraryRows] = await db.query(`SELECT api_key FROM ${librariesTableName} WHERE id = ?`, [collectionRows[0].library_id]);
        if (!libraryRows || libraryRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Collection '${currentName}' isn't part of any library.`
            });
        }
        const options = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: libraryRows[0].api_key
            },
            body: JSON.stringify({ name: newName })
        };
        await got.post(`${url}/${collectionRows[0].library_id}/collections/${collectionRows[0].guid}`, options).json();
        const [updateResult] = await db.query(`UPDATE collections SET name = ? WHERE guid = ?`, [newName, collectionRows[0].guid]);
        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Collection named '${currentName}' not found in database.`
            });
        }
        res.json({
            success: true,
            message: `Collection name updated from '${currentName}' to '${newName}' successfully.`
        });
    } catch (error) {
        console.error("Error updating collection:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update collection",
            error: error.message
        });
    }
};

const deleteCollection = async (req, res) => {
    try {
        const collectionName = req.params.id;
        const [collectionRows] = await db.query(`SELECT guid, library_id FROM ${collectionsTableName} WHERE name = ?`, [collectionName]);
        if (!collectionRows || collectionRows.length === 0) {
            return res.status(409).json({
                success: false,
                message: `A collection named '${collectionName}' doesn't exist.`
            });
        }
        const [libraryRows] = await db.query(`SELECT api_key FROM ${librariesTableName} WHERE id = ?`, [collectionRows[0].library_id]);
        if (!libraryRows || libraryRows.length === 0) {
            return res.status(409).json({
                success: false,
                message: `Collection '${collectionName}' isn't part of any existing library.`
            });
        }
        const options = {
            headers: { accept: 'application/json', AccessKey: libraryRows[0].api_key },
        };
        await db.query(`DELETE FROM ${collectionsTableName} WHERE guid = ?`, [collectionRows[0].guid]);
        const [result] = await got.delete(`${url}/${collectionRows[0].library_id}/collections/${collectionRows[0].guid}`, options);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `No library named '${libraryName}' found in the database.`
            });
        }
        res.json({
            success: true,
            message: `Collection '${collectionName}' deleted successfully`
        });
    } catch (error) {
        console.error(`Error deleting '${collectionName}' collection:`, error);
        res.status(500).json({
            message: `Failed to delete '${collectionName}' collection`,
            error: error.message
        });
    }
};

export {
    getCollections,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection
};