const express = require('express');
const router = express.Router();
const { getDB, ObjectId } = require('../db');

let db;
(async () => {
    db = getDB();
})();

let user_id = null;

router.get('/', async (req, res) => {
    try {
        const topReviews = await db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
        const categories = await db.collection('categories').find().toArray();
        res.render('index', { topReviews, categories });
    } catch (err) {
        console.error('Error fetching top reviews and categories:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/login', (req, res) => {
    res.render('login', { errorMessage: '' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ email, password });
        if (user) {
            req.session.user = { id: user._id, name: user.name, email: user.email };
            user_id = user._id; // Set the user_id

            // Retrieve the user's cart
            let cart = await db.collection('cart').findOne({ user_id: user._id });
            if (!cart) {
                cart = {
                    user_id: user._id,
                    items: [],
                    quantity: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await db.collection('cart').insertOne(cart);
            }

            req.session.cart = cart;
            res.redirect('/');
        } else {
            res.render('login', { errorMessage: 'אימייל או סיסמה שגויים' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

router.get('/registration', (req, res) => {
    res.render('registration');
});

router.post('/register', async (req, res) => {
    const { id_number, first_name, last_name, email, password, street, street_number, city, phone_number } = req.body;
    try {
        const newUser = {
            id_number,
            name: `${first_name} ${last_name}`,
            email,
            password,
            address: [
                {
                    street,
                    "street-number": street_number,
                    city
                }
            ],
            phone_number,
            payment_methods: [],
            order_history: []
        };
        await db.collection('users').insertOne(newUser);
        req.session.user = { name: newUser.name, email: newUser.email };
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Internal server error');
    }
});

// Additional routes for other pages
router.get('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.order_history && user.order_history.length > 0) {
            const orderIds = user.order_history.map(id => new ObjectId(id));
            const orders = await db.collection('orders').find({
                _id: { $in: orderIds }
            }).toArray();

            orders.forEach(order => {
                order.short_id = order._id.toString().slice(0, 6);
            });

            user.order_history = orders;
        }

        const manager = await db.collection('managers').findOne({ user_id: user_id.toString() });

        let managerData = null;
        if (manager) {
            const collections = await db.collections();
            managerData = {};
            for (const collection of collections) {
                const name = collection.collectionName;
                managerData[name] = await db.collection(name).find().toArray();
            }
        }

        res.render('profile', { user, managerData });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).send('Internal server error');
    }
});

router.get('/aboutUs', (req, res) => {
    res.render('aboutUs');
});

router.get('/terms', (req, res) => {
    res.render('terms');
});

router.get('/whyGiveGifts', (req, res) => {
    res.render('whyGiveGifts');
});

router.get('/contactUs', async (req, res) => {
    try {
        const managers = await getManagers();
        res.render('contactUs', { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY, managers });
    } catch (error) {
        console.error('Failed to fetch managers:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
