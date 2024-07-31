const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const db = getDB();
const { ObjectId } = require('mongodb');

let user_id = null;

app.get('/', async (req, res) => {
    try {
        const topReviews = await getTopReviews();
        const categories = await getCategories();
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
                // If no cart exists, create a new one
                cart = {
                    user_id: user._id,
                    items: [],
                    quantity: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await db.collection('cart').insertOne(cart);
            }

            req.session.cart = cart; // Save the cart in the session
            res.redirect('/');
        } else {
            res.render('login', { errorMessage: 'אימייל או סיסמה שגויים' }); // הצגת הודעת שגיאה
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/'); // If there's an error, redirect to home
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/'); // Redirect to the homepage
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
            payment_methods: [], // Initialize with empty array
            order_history: []    // Initialize with empty array
        };
        await db.collection('users').insertOne(newUser);
        req.session.user = { name: newUser.name, email: newUser.email };
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
