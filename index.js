import express, { json } from 'express';
import videosRoutes from './routes/videos.routes.js';
import { startCronJobs } from './utils/cronJobs.js';
import authRoutes from './routes/auth.routes.js';
import moderatorRoutes from './routes/moderator.routes.js';
import usersRoutes from './routes/users.routes.js';
import cors from 'cors';
import { CLIENT_URL, PORT } from './constants/common.js';
import passport from 'passport';

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);
app.use(json());
app.use(passport.initialize());

app.use('/videos', videosRoutes);
app.use('/auth', authRoutes);
app.use('/moderator', moderatorRoutes);
app.use('/users', usersRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to Bunny Stream Server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
