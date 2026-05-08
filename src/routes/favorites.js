import { Router } from 'express';
import prisma from '../db.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

// get a users faves
router.get('/', requireAuth, async (req, res) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user.userId },
            include: { park: true } // join the Park table and include the full park object in each favorite
        })
        res.json(favorites)
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users favorites' })
    }
});

// add a new fave park for a user
router.post('/', requireAuth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const park = await prisma.park.upsert({
            where: { npsId: req.body.npsId },
            update: { name: req.body.name, states: req.body.states },
            create: {
                npsId: req.body.npsId,
                name: req.body.name,
                states: req.body.states,
                lat: parseFloat(req.body.latitude),
                lng: parseFloat(req.body.longitude),
                description: req.body.description
            }
        });
        const favorite = await prisma.favorite.create({
            data: {
                userId,
                parkId: park.id
            }
        });
        res.status(201).json(favorite)
    } catch (error) {
        res.status(500).json({ error: 'Failed to add park to favorites' })
    }
})

export default router;