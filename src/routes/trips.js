import { Router } from 'express';
import prisma from '../db.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

// find a users trips
router.get('/', requireAuth, async (req, res) => {
    try {
        const trips = await prisma.trip.findMany({
            where: { userId: req.user.userId },
            include: {
                tripParks: {
                    include: {
                        park: true
                    },
                    orderBy: {
                        stopOrder: 'asc'
                    }
                }
            }
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

// delete a trip
router.delete('/:id', requireAuth, async (req, res) => {
    const tripId = req.params.id;
    const userId = req.user.userId;
    try {
        // make sure trip belongs to this user
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, userId }
        });
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        // delete TripPark records first
        await prisma.tripPark.deleteMany({
            where: { tripId }
        });

        // then delete the trip
        await prisma.trip.delete({
            where: { id: tripId }
        });
        res.json({ message: 'Trip deleted' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trip' })
    }
});

// add park to a trip
router.post('/:tripId/parks', requireAuth, async (req, res) => {
    const { tripId } = req.params;
    const userId = req.user.userId;

    try {
        // make sure trip belongs to this user
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, userId }
        });
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        // upsert park
        const park = await prisma.park.upsert({
            where: { npsId: req.body.npsId },
            update: {
                name: req.body.name,
                states: req.body.states.split(','),
                imageUrl: req.body.imageUrl || null,
            },
            create: {
                npsId: req.body.npsId,
                name: req.body.name,
                states: req.body.states.split(','),
                lat: parseFloat(req.body.latitude),
                lng: parseFloat(req.body.longitude),
                description: req.body.description,
                imageUrl: req.body.imageUrl || null
            }
        });

        // check if park already in trip
        const existing = await prisma.tripPark.findFirst({
            where: { tripId, parkId: park.id }
        });

        if (existing) {
            return res.status(409).json({ error: 'Park already in trip' });
        }

        // get current stop count for order
        const stopCount = await prisma.tripPark.count({
            where: { tripId }
        });
        // create tripPark entry to link park to trip
        const tripPark = await prisma.tripPark.create({
            data: {
                tripId,
                parkId: park.id,
                stopOrder: stopCount + 1
            }
        });
        res.status(201).json(tripPark);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add park to trip' })
    }
});

// delete a park from a trip
router.delete('/:tripId/parks/:tripParkId', requireAuth, async (req, res) => {
    const { tripId, tripParkId } = req.params;
    const userId = req.user.userId;
    try {
        // verify trip belongs to user
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, userId }
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        await prisma.tripPark.delete({
            where: { id: tripParkId }
        });

        res.json({ message: 'Park removed from trip' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove park from trip' })
    }
});

export default router;

