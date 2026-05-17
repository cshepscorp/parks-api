import { response, Router } from "express";
import "dotenv/config";

const router = Router();
const NPS_API_KEY = process.env.NPS_API_KEY;
const BASE_URL = 'https://developer.nps.gov/api/v1/parks';

router.get('/', async (req, res) => {
    const keyword = req.query.q;
    const state = req.query.stateCode;

    const params = new URLSearchParams({
        limit: req.query.limit || 50,
        start: req.query.start || 0,
        api_key: NPS_API_KEY
    });

    if (keyword) params.append('q', keyword);
    if (state) params.append('stateCode', state);
    if (req.query.activities) params.append('activities', req.query.activities);

    // Append parkCode with literal commas — URLSearchParams encodes them as %2C which NPS rejects
    let url = `${BASE_URL}?${params.toString()}`;
    if (req.query.parkCodes) url += `&parkCode=${req.query.parkCodes}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch NPS parks data'});
    }

});

router.get('/:id', async (req, res) => {
    const parkCode = req.params.id;

    const url = `${BASE_URL}?parkCode=${parkCode}&api_key=${NPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: `could not locate park with code ${parkCode}`})
    }
});

router.get('/:id/alerts', async (req, res) => {
    const parkCode = req.params.id;
    const url = `https://developer.nps.gov/api/v1/alerts?parkCode=${parkCode}&limit=10&api_key=${NPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data.data || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

router.get('/:id/thingstodo', async (req, res) => {
    const parkCode = req.params.id;
    const url = `https://developer.nps.gov/api/v1/thingstodo?parkCode=${parkCode}&limit=50&api_key=${NPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data.data || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch things to do' });
    }
});

export default router;