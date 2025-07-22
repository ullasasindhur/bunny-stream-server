import express, { json } from "express";
import { config } from "dotenv";
import libraryRoutes from "./routes/library.routes.js";
import collectionsRoutes from "./routes/collections.routes.js";
import videosRoutes from "./routes/videos.routes.js";

config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

app.use('/library', libraryRoutes);
app.use('/collections', collectionsRoutes);
app.use('/videos', videosRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Bunny Stream Server!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

