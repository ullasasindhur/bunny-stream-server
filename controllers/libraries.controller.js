import { got } from 'got';
import getDb from '../database.js';
const url = 'https://api.bunny.net/videolibrary'
const replicationRegions = {
    "Frankfurt": "DE",
    "London": "UK",
    "Stockholm": "SE",
    "Los Angeles": "LA",
    "New York": "NY",
    "Singapore": "SG",
    "Sydney": "SYD",
    "Sao Paulo": "BR",
    "Johannesburg": "JH"
};
const db = getDb();
const tableName = 'libraries';

const getLibraries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            `SELECT id, name, description, pull_zone_url, pull_zone_id 
             FROM ${tableName} 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const [countResult] = await db.query(`SELECT COUNT(*) as totalCount FROM ${tableName}`);
        const totalCount = countResult[0].totalCount;

        res.json({
            success: true,
            message: "Libraries fetched successfully.",
            data: rows,
            pagination: {
                currentPage: page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching libraries:', error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch libraries.",
            error: { message: error.message }
        });
    }
};

const getLibrary = async (req, res) => {
    try {
        const libraryName = req.params.id;
        const [rows] = await db.query(`SELECT id, name, description, pull_zone_url, pull_zone_id FROM ${tableName} WHERE name = ?`, [libraryName]);
        if (!rows || rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: `A library named '${libraryName}' doesn't exist.`
            });
        }
        res.json({
            success: true,
            message: "Library fetched successfully.",
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching library:', error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch the library.",
            error: { message: error.message }
        });
    }
}

const createLibrary = async (req, res) => {
    try {
        const { name, regions } = req.query;
        const [rows] = await db.query(`SELECT name FROM ${tableName} WHERE name = ?`, [name]);
        if (rows && rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `A library named '${name}' already exists.`
            });
        }
        const libraryOptions = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: process.env.API_KEY
            },
            body: JSON.stringify({ Name: name, ReplicationRegions: JSON.parse(regions) })
        };
        const libraryData = await got.post(url, libraryOptions).json();
        const pullZoneOptions = {
            headers: {
                accept: 'application/json',
                AccessKey: process.env.API_KEY
            },
        };
        const pullZoneData = await got.get(`https://api.bunny.net/pullzone/${libraryData.PullZoneId}?includeCertificate=false`, pullZoneOptions).json();
        await db.query(`INSERT INTO ${tableName}(name, description, api_key, read_only_api_key, id, pull_zone_id, pull_zone_url, pull_zone_security_key) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, [libraryData.Name, libraryData.Name, libraryData.ApiKey, libraryData.ReadOnlyApiKey, libraryData.Id, pullZoneData.Id, pullZoneData.Hostnames[0].Value, pullZoneData.ZoneSecurityKey]);
        res.status(201).json({
            success: true,
            message: `Library '${name}' was created successfully.`
        });
    } catch (error) {
        console.error('Error creating library:', error);
        res.status(500).json({
            success: false,
            message: "Unable to create the library.",
            error: { message: error.message }
        });
    }
}

const getReplicationRegions = (req, res) => {
    res.json({
        success: true,
        message: "Replication regions fetched successfully.",
        data: replicationRegions
    });
}

const deleteLibrary = async (req, res) => {
    try {
        const libraryName = req.params.id;
        const [rows] = await db.query(`SELECT id FROM ${tableName} WHERE name = ?`, [libraryName]);
        if (!rows || rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: `A library named '${libraryName}' doesn't exist.`
            });
        }
        const options = {
            headers: {
                accept: 'application/json',
                AccessKey: process.env.API_KEY
            },
        };
        await got.delete(`${url}/${rows[0].id}`, options);
        const [result] = await db.query(
            `DELETE FROM ${tableName} WHERE name = ?`,
            [libraryName]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `No library named '${libraryName}' found in the database.`
            });
        }
        res.json({
            success: true,
            message: `Library ${libraryName} deleted successfully.`
        });
    } catch (error) {
        console.error('Error deleting library:', error);
        res.status(500).json({
            success: false,
            message: "Unable to delete the library.",
            error: { message: error.message }
        });
    }
};

export {
    getLibraries,
    getLibrary,
    createLibrary,
    getReplicationRegions,
    deleteLibrary
};