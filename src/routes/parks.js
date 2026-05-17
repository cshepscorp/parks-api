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

router.get('/:id/osm-trails', async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    // Anchors (^ $) omitted — some Overpass instances reject them; plain alternation is sufficient.
    // Omit path/track — too noisy (fire roads, service roads); keep only footway/cycleway named ways.
    const query = `[out:json][timeout:25];
(
  relation["type"="route"]["route"~"hiking|mtb|bicycle|foot|horse"]["name"](around:20000,${lat},${lng});
  way["highway"~"footway|cycleway"]["name"](around:20000,${lat},${lng});
);
out tags;`;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'parks-trip-planner/1.0',
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error(`Overpass API ${response.status}:`, errText.substring(0, 400));
            return res.status(502).json({ error: 'OSM API error' });
        }
        const data = await response.json();
        // Overpass returns 200 but embeds a timeout/error message in remark
        if (data.remark && /timeout|error/i.test(data.remark)) {
            console.error('Overpass remark:', data.remark);
            return res.status(504).json({ error: 'OSM query timed out' });
        }

        const seen = new Set();
        const trails = [];

        // Relations first (full named routes), then individual ways
        const sorted = [...(data.elements || [])].sort((a, b) =>
            (a.type === 'relation' ? 0 : 1) - (b.type === 'relation' ? 0 : 1)
        );

        for (const el of sorted) {
            const name = el.tags?.name?.trim();
            if (!name) continue;
            const routeType = el.tags.route || el.tags.highway || 'path';
            const key = `${name}|${routeType}`;
            if (seen.has(key)) continue;
            seen.add(key);
            trails.push({
                id: `${el.type}_${el.id}`,
                name,
                routeType,
                surface: el.tags.surface || null,
                distance: el.tags.distance || el.tags['osmc:distance'] || null,
                difficulty: el.tags.sac_scale || el.tags['mtb:scale'] || null,
                description: el.tags.description || null,
                osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
            });
            if (trails.length >= 30) break;
        }

        res.json(trails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch OSM trail data' });
    }
});

router.get('/:id/campgrounds', async (req, res) => {
    const parkCode = req.params.id;
    const url = `https://developer.nps.gov/api/v1/campgrounds?parkCode=${parkCode}&limit=50&api_key=${NPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data.data || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campgrounds' });
    }
});

export default router;