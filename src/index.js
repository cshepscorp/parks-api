import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import parksRouter from './routes/parks.js';
import tripsRouter from './routes/trips.js';
import favoritesRouter from './routes/favorites.js';
import prisma from './db.js'
import requireAuth from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
// we're storing the JWT in an HttpOnly cookie. When a browser makes a cross-origin request, it strips cookies by default as a security measure. credentials: true tells the browser "yes, include cookies on cross-origin requests to this server." Without it, your React frontend would never send the auth cookie to Express, and every request would look unauthenticated.
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // middleware that reads those express bytes, parses them into a JavaScript object, and puts it on req.body
app.use(cookieParser());
app.use(passport.initialize());
app.use('/auth', authRouter);
app.use('/api/parks', parksRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/favorites', favoritesRouter);

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// protected test route
app.get('/protected', requireAuth, (req, res) => {
  res.json({message: 'you are authenticated', user: req.user});
});

app.get('/health/db', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', database: 'connected'});
    } catch (error) {
        res.status(500).json( {status: 'error', database: 'disconnected'})
    }
});

// start server
// tell Node.js to open a network socket on that port and start accepting incoming HTTP connections
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});