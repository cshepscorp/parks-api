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
        api_key: NPS_API_KEY
    });

    if (keyword) params.append('q', keyword);
    if (state) params.append('stateCode', state);

    const url = `${BASE_URL}?${params.toString()}`;
    console.log('url for search', url)
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
})

export default router;