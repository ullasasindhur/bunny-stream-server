import express, { json } from 'express';
import videosRoutes from './routes/videos.routes.js';
import authRoutes from './routes/auth.routes.js';
import moderatorRoutes from './routes/moderator.routes.js';
import { getDb } from './database.js';
import cors from 'cors';
import { PORT } from './constants/common.js';
import passport from 'passport';

const app = express();
const db = getDb();

app.use(
  cors({
    credentials: true
  })
);
app.use(json());
app.use(passport.initialize());

app.use('/videos', videosRoutes);
app.use('/auth', authRoutes);
app.use('/moderator', moderatorRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to Bunny Stream Server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
