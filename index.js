import express, { json } from "express";
import { config } from "dotenv";
import libraryRoutes from "./routes/library.routes.js";

config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

app.use('/library', libraryRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Bunny Stream Server!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

