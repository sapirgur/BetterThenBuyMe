const express = require('express');
const router = express.Router();
const { getDB, ObjectId } = require('../db');

let db;
(async () => {
    db = getDB();
})();

router.get('/shop', async (req, res) => {
    try {
        const categories = await db.collection('categories').find().toArray();
        res.render('shop', { categories, businesses: [] });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/shop/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await db.collection('categories').findOne({ _id: new ObjectId(categoryId) });
        const businesses = await db.collection('businesses').find({ categories: category.name }).toArray();
        const categories = await db.collection('categories').find().toArray();
        res.render('shop', { categories, businesses });
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/shop/item/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const Business = await db.collection('businesses').findOne({ _id: new ObjectId(itemId) });
        res.render('itemDetail', { item: Business });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/search', async (req, res) => {
    const { keywords, category, maxPrice, geoRegion } = req.query;

    try {
        const query = {};

        if (keywords) {
            query.$text = { $search: keywords };
        }

        if (category) {
            query.categories = category;
        }

        if (maxPrice) {
            query.price = { $lte: parseFloat(maxPrice) };
        }

        if (geoRegion) {
            switch (geoRegion) {
                case 'כל הארץ':
                    break;
                case 'מרכז הארץ':
                    query.geographical_location = { $in: ['ראשון לציון', 'פתח תקווה', 'נס ציונה', 'רחובות', 'הרצליה', 'נתניה', 'אור יהודה', 'חולון'] };
                    break;
                case 'דרום הארץ':
                    query.geographical_location = { $in: ['באר שבע'] };
                    break;
                case 'צפון הארץ':
                    query.geographical_location = { $in: ['קצרין', 'קיסריה', 'זכרון יעקב', 'מיני ישראל', 'שוני', 'טבריה'] };
                    break;
                case 'אזור ירושלים':
                    query.geographical_location = { $in: ['ירושלים', 'מודיעין'] };
                    break;
                default:
                    query.geographical_location = geoRegion;
            }
        }

        const businesses = await db.collection('businesses').find(query).toArray();
        const categories = await db.collection('categories').find().toArray();
        res.render('shop', { categories, businesses });
    } catch (err) {
        console.error('Error performing search:', err);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
