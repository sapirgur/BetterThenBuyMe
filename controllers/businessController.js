const express = require('express');
const router = express.Router();
const { getCategories, getBusinessesByCategory, getCategoryById, getBusinessById } = require('../db');
const { getDB } = require('../db');
const db = getDB();

router.get('/shop', async (req, res) => {
    try {
        const categories = await getCategories();
        res.render('shop', { categories, businesses: [] });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/shop/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await getCategoryById(categoryId);
        const businesses = await getBusinessesByCategory(category.name);
        const categories = await getCategories();
        res.render('shop', { categories, businesses });
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/shop/item/:itemId', async (req, res) => {
    try {        
        const itemId = req.params.itemId;
        const business = await getBusinessById(itemId);
        res.render('itemDetail', { item: business });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
