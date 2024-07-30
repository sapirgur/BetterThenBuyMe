const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectToDB,getDB, getCategories, getBusinessesByCategory, getCategoryById,getTopReviews, getBusinessById, getProductById, getCouponByCode } = require('./db');
const cors = require('cors');  
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const app = express();
const port = 3001; // Use an available port
let db;

// DB Connection 
connectToDB((err) => {
    if (!err) {
        // Start the server
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });

        db = getDB();
    } else {
        console.error("Failed to connect to the database:", err);
        process.exit(1); // Exit the application if the database connection fails
    }
});

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve static files (e.g., CSS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS middleware
app.use(cors({
    origin: 'http://localhost:3001', // Adjust this to your frontend's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware to pass session user to views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Define routes
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


app.get('/login', (req, res) => {
    res.render('login', { errorMessage: '' });
});

let user_id = null; // Define user_id variable outside

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ email, password });
        if (user) {
            req.session.user = { id: user._id, name: user.name, email: user.email };
            user_id = user._id; // Set the user_id

            // Retrieve the user's cart
            let cart = await db.collection('cart').findOne({ user_id: user._id });
            console.log(cart);

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
            console.log(cart);

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

// Route to add an item with quantity to the cart
app.post('/add-item-to-cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    const { productId, quantity, price } = req.body;

    if (!productId || !quantity || isNaN(quantity) || quantity <= 0 || !price || isNaN(price) || price <= 0) {
        return res.status(400).send('Invalid product ID, quantity, or price');
    }

    if (user_id) {
        try {
            const product = await getProductById(productId);
            if (!product) {
                return res.status(404).send('Product not found');
            }

            let cart = await db.collection('cart').findOne({ user_id: user_id });
            if (cart) {
                const existingItem = cart.items.find(item => item._id.equals(product._id));
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.items.push({
                        _id: product._id,
                        product_name: product.name,
                        quantity: quantity,
                        price: price  // Ensure this uses the provided price
                    });
                }

                cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
                cart.updated_at = new Date();

                // Update the cart in the database
                await db.collection('cart').updateOne(
                    { _id: cart._id },
                    { $set: { items: cart.items, quantity: cart.quantity, updated_at: cart.updated_at } }
                );

                res.json({ success: true, cart });
            } else {
                // If no cart exists, create a new one
                cart = {
                    user_id: user_id,
                    items: [{
                        _id: product._id,
                        product_name: product.name,
                        quantity: quantity,
                        price: price
                    }],
                    quantity: quantity,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await db.collection('cart').insertOne(cart);
                res.json({ success: true, cart });
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            res.status(500).send('Internal server error');
        }
    } else {
        res.status(500).send('User ID not found');
    }
});




// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/'); // If there's an error, redirect to home
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/'); // Redirect to the homepage
    });
});

app.get('/registration', (req, res) => {
    res.render('registration');
});

app.post('/register', async (req, res) => {
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

//routes for the shop feature
app.get('/shop', async (req, res) => {
    try {
        const categories = await getCategories();
        res.render('shop', { categories, businesses: [] });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Internal server error');
    }
});

app.get('/shop/:categoryId', async (req, res) => {
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
app.get('/shop/item/:itemId', async (req, res) => {
    try {        
        const itemId = req.params.itemId;
        console.log(itemId);
        const Business = await getBusinessById(itemId);
        console.log(Business);

        

        res.render('itemDetail', { item: Business });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for the search bar feature
app.get('/search', async (req, res) => {
    const { keywords, category, maxPrice, geoRegion } = req.query;
    console.log('Search Parameters:', req.query); // Log the search parameters

    try {
        const query = {};

        // Search for keywords in all indexed text fields
        if (keywords) {
            query.$text = { $search: keywords };
        }

        // Filter by category
        if (category) {
            query.categories = category;
        }

        // Filter by maximum price
        if (maxPrice) {
            query.price = { $lte: parseFloat(maxPrice) };
        }

        // Filter by geographical location
        if (geoRegion) {
            switch (geoRegion) {
                case 'כל הארץ':
                    // No additional filter needed, as we want to load all cards
                    break;
                case 'מרכז הארץ':
                    query.geographical_location = { $in: ['ראשון לציון', 'פתח תקווה', 'נס ציונה', 'רחובות', 'הרצליה', 'נתניה', 'אור יהודה','חולון'] };
                    break;
                case 'דרום הארץ':
                    query.geographical_location = { $in: ['באר שבע'] };
                    break;
                case 'צפון הארץ':
                    query.geographical_location = { $in: ['קצרין', 'קיסריה','זכרון יעקב','מיני ישראל', 'שוני','טבריה'] };
                    break;
                case 'אזור ירושלים':
                    query.geographical_location = { $in: ['ירושלים','מודיעין'] };
                    break;
                default:
                    query.geographical_location = geoRegion;
            }
        }

        console.log('Database Query:', query); // Log the query being sent to the database

        const businesses = await db.collection('businesses').find(query).toArray();
        console.log('Search Results:', businesses); // Log the search results
        
        const categories = await getCategories();
        
        res.render('shop', { categories, businesses });
    } catch (err) {
        console.error('Error performing search:', err);
        res.status(500).send('Internal server error');
    }
});


app.get('/CheckOut', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if the user is not authenticated
    }

    try {
        let cart = await db.collection('cart').findOne({ user_id: user_id });

        // Log the cart variable to ensure it's fetched correctly
        console.log('Cart:', cart);

        // Pass an empty array if the cart is null
        res.render('CheckOut', { cart: cart ? cart.items : [] });
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).send('Internal server error');
    }
});


app.post('/CheckOut', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized: No user session found');
    }

    const { ccName, ccNumber, ccExpiration, ccCvv } = req.body;

    if (!ccName || !ccNumber || !ccExpiration || !ccCvv) {
        return res.status(400).send('All fields are required');
    }

    try {
        // Add new payment method
        const newPaymentMethod = {
            card_name: ccName,
            card_number: ccNumber,
            card_type: "Visa",  // You might want to add a mechanism to determine the card type
            expiry_date: ccExpiration,
            cvv: ccCvv,
            billing_address: "123 Main St"  // You might want to include this in the form
        };

        await db.collection('users').updateOne(
            { _id: user_id },
            { $push: { payment_methods: newPaymentMethod } }
        );

        // Fetch the cart for the user
        const cart = await db.collection('cart').findOne({ user_id: user_id });

        if (!cart || cart.items.length === 0) {
            return res.status(400).send('Cart is empty');
        }

        // Generate a unique order ID

        // Create a new order
        const newOrder = {
            user_id: user_id,
            order_date: new Date(),
            status: "Processing",
            total_amount: cart.items.reduce((total, item) => total + (item.price * item.quantity), 0),
            payment_method_id: newPaymentMethod.card_number, // Assuming card_number is unique
            products: cart.items
        };

        const result = await db.collection('orders').insertOne(newOrder);

        // Fetch the inserted order using the insertedId
        const insertedOrder = await db.collection('orders').findOne({ _id: result.insertedId });
        // Add the order ID to the user's order history
        await db.collection('users').updateOne(
            { _id: user_id },
            { $push: { order_history: result.insertedId } }
        );

        // Clear the cart after checkout
        await db.collection('cart').updateOne(
            { user_id: user_id },
            { $set: { items: [] } }
        );

        console.log('New order added:', newOrder);
        res.redirect('/'); // Redirect to a success page or send a success message
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).send('Internal server error');
    }
});





// Route to fetch cart data (cart icon)
app.get('/cart-data', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        let cart = await db.collection('cart').findOne({ user_id: user_id });

        // Return cart items as JSON
        res.json(cart ? cart.items : []);
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/decrease-quantity', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    const { productId } = req.body;

    if (!productId) {
        return res.status(400).send('Invalid product ID');
    }

    try {
        let cart = await db.collection('cart').findOne({ user_id: user_id });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item._id.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).send('Item not found in cart');
        }

        cart.items[itemIndex].quantity -= 1;
        if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1); // Remove item if quantity is 0
        }

        cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        cart.total_price = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        cart.updated_at = new Date();

        await db.collection('cart').updateOne(
            { _id: cart._id },
            { $set: { items: cart.items, quantity: cart.quantity, total_price: cart.total_price, updated_at: cart.updated_at } }
        );

        res.json({ success: true, items: cart.items });
    } catch (error) {
        console.error('Error decreasing item quantity:', error);
        res.status(500).send('Internal server error');
    }
});




app.post('/increase-quantity', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    const { productId } = req.body;

    if (!productId) {
        return res.status(400).send('Invalid product ID');
    }

    try {
        let cart = await db.collection('cart').findOne({ user_id: user_id });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item._id.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).send('Item not found in cart');
        }

        cart.items[itemIndex].quantity += 1;

        cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        cart.total_price = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        cart.updated_at = new Date();

        await db.collection('cart').updateOne(
            { _id: cart._id },
            { $set: { items: cart.items, quantity: cart.quantity, total_price: cart.total_price, updated_at: cart.updated_at } }
        );

        res.json({ success: true, items: cart.items });
    } catch (error) {
        console.error('Error increasing item quantity:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/verify-coupon', async (req, res) => {
    const { couponCode } = req.body;
    console.log('Received coupon code:', couponCode);

    try {
        const coupon = await getCouponByCode(couponCode);
        console.log('Coupon found:', coupon);

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



app.get('/aboutUs', (req, res) => {
    res.render('aboutUs');
});

app.get('/terms', (req, res) => {
    res.render('terms');
});

app.get('/whyGiveGifts', (req, res) => {
    res.render('whyGiveGifts');
});

app.get('/contact', (req, res) => {
    res.render('contactUs');
});


app.get('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(404).send('User not found');
        }

        console.log('User data:', user);

        if (user.order_history && user.order_history.length > 0) {
            const orderIds = user.order_history.map(id => new ObjectId(id));
            const orders = await db.collection('orders').find({
                _id: { $in: orderIds }
            }).toArray();

             // Shorten the order IDs for user-friendliness
             orders.forEach(order => {
                order.short_id = order._id.toString().slice(0, 6); 
                console.log('Order ID:', order._id, 'Short ID:', order.short_id); // debugs
            });
    
            user.order_history = orders;
        }


        res.render('profile', { user });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/updateProfile', async (req, res) => {
    try {
        const { idNumber, name, email, password, address, phoneNumber } = req.body;

        console.log('Update Data:', req.body); // Log the entire update data

        // Ensure the address is an array of objects
        const formattedAddress = address.map(addr => ({
            street: addr.street,
            street_number: addr.street_number,
            city: addr.city
        }));

        await db.collection('users').updateOne({ id_number: idNumber }, {
            $set: {
                name,
                email,
                password,
                address: formattedAddress, // Store the formatted address
                phone_number: phoneNumber
            }
        });

        res.send({ success: true });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).send('Internal server error');
    }
});


app.post('/deleteProfile', async (req, res) => {
    try {
        const { idNumber } = req.body;

        await db.collection('users').deleteOne({  _id: user_ids });

        req.session.destroy();
        res.send({ success: true });
    } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).send('Internal server error');
    }
});


// Test route to check DB connection
app.get('/test-connection', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        const testCollection = db.collection('users');
        if (testCollection) {
            console.log('Collection reference obtained');
        }
        console.log(testCollection);
        const documents = await testCollection.find({}).toArray();
        console.log('Documents fetched:', documents);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'An error occurred while fetching documents.' });
    }
});

module.exports = app;
