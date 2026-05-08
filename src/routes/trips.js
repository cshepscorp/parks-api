import { Router } from 'express';
import prisma from '../db.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

// find a users trips
router.get('/', requireAuth, async (req, res) => {
    try {
        const trips = await prisma.trip.findMany({
            where: { userId: req.user.userId }
        });
        res.json(trips)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user trips' });
    }
});

// create a new trip
router.post('/', requireAuth, async (req, res) => {
    const tripName = req.body.name;
    const userId = req.user.userId;
    try {
        const trip = await prisma.trip.create({
            data: {
                name: tripName,
                userId
            }
        });
        res.status(201).json(trip);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user trips' });
    }
});

export default router;

