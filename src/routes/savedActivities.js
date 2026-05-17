import { Router } from 'express';
import prisma from '../db.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

// get user's saved activities, optionally filtered by parkCode and/or type
router.get('/', requireAuth, async (req, res) => {
    try {
        const where = { userId: req.user.userId };
        if (req.query.parkCode) where.parkNpsId = req.query.parkCode;
        if (req.query.type) where.activityType = req.query.type;
        const activities = await prisma.savedActivity.findMany({ where });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve saved activities' });
    }
});

// save an activity
router.post('/', requireAuth, async (req, res) => {
    const { npsId, parkNpsId, parkName, title, imageUrl, url, activityType } = req.body;
    try {
        const activity = await prisma.savedActivity.create({
            data: {
                userId: req.user.userId,
                npsId,
                parkNpsId,
                parkName: parkName || null,
                title,
                imageUrl: imageUrl || null,
                url: url || null,
                activityType: activityType || 'trail',
            },
        });
        res.status(201).json(activity);
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ error: 'Activity already saved' });
        res.status(500).json({ error: 'Failed to save activity' });
    }
});

// remove a saved activity
router.delete('/:npsId', requireAuth, async (req, res) => {
    try {
        await prisma.savedActivity.deleteMany({
            where: { userId: req.user.userId, npsId: req.params.npsId },
        });
        res.json({ message: 'Activity removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove saved activity' });
    }
});

export default router;
