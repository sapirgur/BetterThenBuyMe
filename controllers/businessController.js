const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

let db;
(async () => {
    db = getDB();
})();

router.get('/api/businesses', async (req, res) => {
    try {
        const businesses = await db.collection('businesses').find().toArray();
        res.json(businesses);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
