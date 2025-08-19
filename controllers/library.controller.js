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
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.API_KEY },
            searchParams: {
                page: req.query.page || 1,
                perPage: req.query.perPage || 1,
                search: req.query.search || '',
            }
        };
        const data = await got.get(url, options).json();
        res.json({
            success: true,
            message: "Libraries fetched successfully.",
            data
        });
    } catch (error) {
        console.error('Error fetching libraries:', error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch libraries.",
            error: { message: error.message }
        });
    }
}

const getLibrary = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.API_KEY },
        };
        const data = await got.get(`${url}/${req.params.id}`, options).json();
        res.json({
            success: true,
            message: "Library fetched successfully.",
            data
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
        const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE name = ?`, [name]);
        if (rows && rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `A library named '${name}' already exists.`
            });
        }
        const options = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: process.env.API_KEY
            },
            body: JSON.stringify({ Name: name, ReplicationRegions: JSON.parse(regions) })
        };
        const data = await got.post(url, options).json();
        const [newLibrary] = await db.query(`INSERT INTO ${tableName}(name, description, api_key, read_only_api_key, id) VALUES(?, ?, ?, ?, ?)`, [data.Name, data.Name, data.ApiKey, data.ReadOnlyApiKey, data.Id]);
        res.status(201).json({
            success: true,
            message: `Library '${name}' was created successfully.`,
            data
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
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.API_KEY },
        };
        await got.delete(`${url}/${req.params.id}`, options);
        res.json({
            success: true,
            message: "Library deleted successfully."
        });
    } catch (error) {
        console.error('Error deleting library:', error);
        res.status(500).json({
            success: false,
            message: "Unable to delete the library.",
            error: { message: error.message }
        });
    }
}
export {
    getLibraries,
    getLibrary,
    createLibrary,
    getReplicationRegions,
    deleteLibrary
};