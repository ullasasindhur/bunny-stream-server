import express, { json } from 'express';
import videosRoutes from './routes/videos.routes.js';
import { getDb } from './database.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const db = getDb();

app.use(cors());

app.use(json());

app.use('/videos', videosRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to Bunny Stream Server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
