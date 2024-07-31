const express = require('express');
const router = express.Router();
const { ObjectId, getManagers, getOrders, getReviews, getProducts, getLocations, getCouponByCode } = require('../db');

let user_id = null;

router.get('/', async (req, res) => {
    try {
        const topReviews = await req.db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
        const categories = await req.db.collection('categories').find().toArray();
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
        const user = await req.db.collection('users').findOne({ email, password });
        if (user) {
            req.session.user = { id: user._id, name: user.name, email: user.email };
            user_id = user._id;

            let cart = await req.db.collection('cart').findOne({ user_id: user._id });
            if (!cart) {
                cart = {
                    user_id: user._id,
                    items: [],
                    quantity: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await req.db.collection('cart').insertOne(cart);
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
        await req.db.collection('users').insertOne(newUser);
        req.session.user = { name: newUser.name, email: newUser.email };
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
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
        const managers = await getManagers(req.db);
        res.render('contactUs', { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY, managers });
    } catch (error) {
        console.error('Failed to fetch managers:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = await req.db.collection('users').findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.order_history && user.order_history.length > 0) {
            const orderIds = user.order_history.map(id => new ObjectId(id));
            const orders = await req.db.collection('orders').find({
                _id: { $in: orderIds }
            }).toArray();

            orders.forEach(order => {
                order.short_id = order._id.toString().slice(0, 6);
            });

            user.order_history = orders;
        }

        const manager = await req.db.collection('managers').findOne({ user_id: user_id.toString() });

        let managerData = null;
        if (manager) {
            const collections = await req.db.collections();
            managerData = {};
            for (const collection of collections) {
                const name = collection.collectionName;
                managerData[name] = await req.db.collection(name).find().toArray();
            }
        }

        res.render('profile', { user, managerData });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).send('Internal server error');
    }
});

router.post('/updateProfile', async (req, res) => {
    try {
        const { idNumber, name, email, password, address, phoneNumber } = req.body;

        const formattedAddress = address.map(addr => ({
            street: addr.street,
            street_number: addr.street_number,
            city: addr.city
        }));

        await req.db.collection('users').updateOne({ id_number: idNumber }, {
            $set: {
                name,
                email,
                password,
                address: formattedAddress,
                phone_number: phoneNumber
            }
        });

        res.send({ success: true });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).send('Internal server error');
    }
});

router.post('/deleteProfile', async (req, res) => {
    try {
        const { idNumber } = req.body;

        await req.db.collection('users').deleteOne({ _id: user_ids });

        req.session.destroy();
        res.send({ success: true });
    } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).send('Internal server error');
    }
});

router.get('/api/orders', async (req, res) => {
    try {
        const orders = await getOrders(req.db);
        res.json(orders);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/api/locations', async (req, res) => {
    try {
        const locations = await getLocations(req.db);
        res.json(locations);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await getReviews(req.db);
        res.json(reviews);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/api/products', async (req, res) => {
    try {
        const products = await getProducts(req.db);
        res.json(products);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.post('/verify-coupon', async (req, res) => {
    const { couponCode } = req.body;
    try {
        const coupon = await getCouponByCode(req.db, couponCode);

        if (coupon) {
            res.json({ valid: true, discountPercentage: coupon.percentage });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Error verifying coupon:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add these routes to the existing userController.js

// GET /CheckOut
router.get('/CheckOut', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user_id = req.session.user.id;  // Retrieve user ID from session

    try {
        let cart = await req.db.collection('cart').findOne({ user_id: user_id });
        res.render('CheckOut', { cart: cart ? cart.items : [] });
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).send('Internal server error');
    }
});

// POST /CheckOut
router.post('/CheckOut', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized: No user session found');
    }

    const { ccName, ccNumber, ccExpiration, ccCvv } = req.body;
    const user_id = req.session.user.id;  // Retrieve user ID from session

    console.log('User ID:', user_id, 'Type:', typeof user_id);
    console.log('Credit Card Details:', { ccName, ccNumber, ccExpiration, ccCvv });

    if (!ccName || !ccNumber || !ccExpiration || !ccCvv) {
        return res.status(400).send('All fields are required');
    }

    try {
        // Verify the user document exists
        const user = await req.db.collection('users').findOne({ _id: new ObjectId(user_id) });
        if (!user) {
            console.log('User document not found');
            return res.status(404).send('User not found');
        }

        const newPaymentMethod = {
            card_name: ccName,
            card_number: ccNumber,
            card_type: "Visa",
            expiry_date: ccExpiration,
            cvv: ccCvv,
            billing_address: "123 Main St"
        };

        // Add payment method
        const paymentUpdateResult = await req.db.collection('users').updateOne(
            { _id: new ObjectId(user_id) },
            { $push: { payment_methods: newPaymentMethod } }
        );
        //console.log('Payment Update Result:', paymentUpdateResult);

        // Fetch cart
        const cart = await req.db.collection('cart').findOne({ user_id: user_id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).send('Cart is empty');
        }

        // Create new order
        const newOrder = {
            user_id: user_id,
            order_date: new Date(),
            status: "Processing",
            total_amount: cart.items.reduce((total, item) => total + (item.price * item.quantity), 0),
            payment_method_id: newPaymentMethod.card_number,
            products: cart.items
        };

        const orderInsertResult = await req.db.collection('orders').insertOne(newOrder);
        //console.log('Order Insert Result:', orderInsertResult);

        // Update user order history
        const orderHistoryUpdateResult = await req.db.collection('users').updateOne(
            { _id: new ObjectId(user_id) },
            { $push: { order_history: orderInsertResult.insertedId } }
        );
        //console.log('Order History Update Result:', orderHistoryUpdateResult);

        // Clear cart
        await req.db.collection('cart').updateOne(
            { user_id: user_id },
            { $set: { items: [] } }
        );

        res.redirect('/');
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).send('Internal server error');
    }
});


module.exports = router;
