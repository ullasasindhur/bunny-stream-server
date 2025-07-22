import { got } from 'got';
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
}


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
            message: "Library data fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching library data:", error);
        res.status(500).json({
            message: "Failed to fetch library data",
            error: error.message
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
            message: "Library item fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching library item:", error);
        res.status(500).json({
            message: "Failed to fetch library item",
            error: error.message
        });
    }
}

const createLibrary = async (req, res) => {
    try {
        const options = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: process.env.API_KEY
            },
            body: JSON.stringify({ Name: req.query.name, ReplicationRegions: JSON.parse(req.query.regions) })
        };
        const data = await got.post(url, options).json();
        res.status(201).json({
            message: "Library created successfully",
            data
        });
    } catch (error) {
        console.error("Error creating library:", error);
        res.status(500).json({
            message: "Failed to create library",
            error: error.message
        });
    }
}

const getReplicationRegions = (req, res) => {
    res.json({
        message: "Replication regions fetched successfully",
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
            message: "Library deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting library:", error);
        res.status(500).json({
            message: "Failed to delete library",
            error: error.message
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