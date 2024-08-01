const express = require('express');
const passport = require('passport');
const router = express.Router();
const { ObjectId, getManagers, getOrders, getReviews, getProducts, getLocations, getCouponByCode, getDB } = require('../db');

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


// Authentication routes
router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    function(req, res) {
        // Successful authentication, redirect home
        res.redirect('/');
    }
);

// Route to handle posting to Facebook
router.post('/postToFacebook', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    console.log('Session Data:', req.session);
    console.log('Page Access Token:', process.env.PAGE_ACCESS_TOKEN);

    if (!req.session.user || !req.session.user.name) {
        return res.status(401).send('User not authenticated');
    }

    // Page access token and page ID of the Facebook page that I want to post on
    const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;
    const pageId = '364777303391493';

    const userName = req.session.user.name;
    const message = req.body.message; // Gets the message from the request
    const messageWithName = `${message}\n- ${userName}`;
    try {
        console.log('Attempting to import node-fetch');
        const fetch = await import('node-fetch');

        // Make an asynchronous HTTP POST request to the Facebook Graph API to post a message
        const response = await fetch.default(`https://graph.facebook.com/${pageId}/feed?access_token=${pageAccessToken}`, {
            method: 'POST', // Specify that this request is a POST request
            headers: {
                'Content-Type': 'application/json' // Set the request headers to indicate that the request body is JSON
            },
            body: JSON.stringify({ message: messageWithName }) // Convert the message to a JSON string to include in the request body
        });

        console.log('Received response from Facebook API');

        if (!response.ok) { // Check if the response is not OK
            //throw new Error(`HTTP error! status: ${response.status}`);
            const errorData = await response.json(); // Get detailed error information
            throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json(); // Gets the JSON response from Facebook

        if (data.error) { // Check if there is an error
            console.error('Error from Facebook API:', data.error); // Log the error
            return res.status(500).send('Error posting to Facebook'); // Send a status code 500 with an error message
        }

        console.log('Post ID:', data.id);

        const lastReview = await req.db.collection('reviews')
            .find({}) // Retrieves all reviews
            .sort({ review_date: -1 }) // Sort by review_date in descending order
            .limit(1) // Limit to 1 document
            .toArray();

        const lastReviewId = lastReview.length > 0 ? lastReview[0].review_id : 0; // if the array isn't empty retrieve the 'review_id' from the most recent review else set the id to be 0

        // Proceed to save the review to the database
        const { review_id, user_id, comment, review_date } = req.body;
        const newReview = {
            review_id: lastReviewId + 1, // 'review_id' from the most recent review plus 1
            user_id: req.session.user.id, // Use logged-in user's ID
            product_id: null,
            rating: null,
            comment: messageWithName,
            review_date: new Date()
        };

        await req.db.collection('reviews').insertOne(newReview);

        // Send success response after saving review
        res.status(200).send('Posted to Facebook and saved review successfully');
    } catch (error) { // Catch any errors that may occur and log them
        console.error('Error caught in catch block:', error);
        res.status(500).send('Error posting to Facebook');
    }
});

// Function to get aggregated data
async function getAggregatedData() {
    const db = getDB();

    // Fetch product details
    const products = await db.collection('products').find().toArray();
    const productMap = {};
    products.forEach(product => {
        productMap[product._id.toString()] = product.name;
    });

    // Aggregate high rating reviews (4 and 5)
    const reviewsAggregation = await db.collection('reviews').aggregate([
        { $match: { rating: { $gte: 4 } } },
        { $group: { _id: "$product_id", count: { $sum: 1 } } }
    ]).toArray();

    // Aggregate orders per product
    const ordersAggregation = await db.collection('orders').aggregate([
        { $unwind: "$products" },
        { $group: { _id: "$products._id", count: { $sum: 1 } } }
    ]).toArray();

    // Replace product IDs with names
    reviewsAggregation.forEach(review => {
        review.product_name = productMap[review._id.toString()];
    });

    ordersAggregation.forEach(order => {
        order.product_name = productMap[order._id.toString()];
    });

    return { reviewsAggregation, ordersAggregation };
}

// Handler function for the route
const getAggregatedDataHandler = async (req, res) => {
    try {
        const aggregatedData = await getAggregatedData();
        res.json(aggregatedData);
    } catch (err) {
        res.status(500).send(err);
    }
};

// Define the route
router.get('/api/aggregated-data', getAggregatedDataHandler);

module.exports = router;
