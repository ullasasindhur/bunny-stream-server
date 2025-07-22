import { got } from "got";
const url = 'https://video.bunnycdn.com/library'

const getCollections = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.LIBRARY_API_KEY },
            searchParams: {
                page: req.query.page || 1,
                itemsPerPage: req.query.itemsPerPage || 10,
                search: req.query.search || '',
                orderBy: req.query.orderBy || 'date',
                includeThumbnails: req.query.includeThumbnails || false
            }
        };
        console.log(req.query.libraryId)
        const data = await got.get(`${url}/${req.query.libraryId}/collections`, options).json();
        res.json({
            message: "Collections fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching collections:", error);
        res.status(500).json({
            message: "Failed to fetch collections",
            error: error.message
        });
    }
}

const getCollectionById = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.LIBRARY_API_KEY },
            searchParams: {
                includeThumbnails: req.query.includeThumbnails || false
            }
        };
        const data = await got.get(`${url}/${req.query.libraryId}/collections/${req.params.id}`, options).json();
        res.json({
            message: "Collection fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching collection:", error);
        res.status(500).json({
            message: "Failed to fetch collection",
            error: error.message
        });
    }
};

const createCollection = async (req, res) => {
    try {
        const options = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: process.env.LIBRARY_API_KEY
            },
            body: JSON.stringify({ name: req.body.name })
        };
        const data = await got.post(`${url}/${req.query.libraryId}/collections`, options).json();
        res.status(201).json({
            message: "Collection created successfully",
            data
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
        const options = {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                AccessKey: process.env.LIBRARY_API_KEY
            },
            body: JSON.stringify({ name: req.body.name })
        };
        const data = await got.post(`${url}/${req.body.libraryId}/collections/${req.params.id}`, options).json();
        res.json({
            message: "Collection updated successfully",
            data
        });
    } catch (error) {
        console.error("Error updating collection:", error);
        res.status(500).json({
            message: "Failed to update collection",
            error: error.message
        });
    }
};

const deleteCollection = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.LIBRARY_API_KEY },
        };
        await got.delete(`${url}/${req.body.libraryId}/collections/${req.params.id}`, options);
        res.json({
            message: "Collection deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting collection:", error);
        res.status(500).json({
            message: "Failed to delete collection",
            error: error.message
        });
    }
};

export {
    getCollections,
    getCollectionById,
    createCollection,
    updateCollection,
    deleteCollection
};