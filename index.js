import express, { json } from "express";
import librariesRoutes from "./routes/libraries.routes.js";
import collectionsRoutes from "./routes/collections.routes.js";
import videosRoutes from "./routes/videos.routes.js";
import getDb from './database.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const db = getDb();

app.use(cors());

app.use(json());

app.use('/libraries', librariesRoutes);
app.use('/collections', collectionsRoutes);
app.use('/videos', videosRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Bunny Stream Server!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
