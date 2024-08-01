const express = require('express');
const router = express.Router();

router.get('/api/businesses', async (req, res) => {
    try {
        const businesses = await req.db.collection('businesses').find().toArray();
        res.json(businesses);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
