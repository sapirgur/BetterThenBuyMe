const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectToDB,getDB, getCategories, getBusinessesByCategory, getCategoryById,getTopReviews, getBusinessById } = require('./db');
const bodyParser = require('body-parser');

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

// Serve static files (e.g., CSS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ email, password }); // Ideally, password should be hashed and compared securely
        if (user) {
            req.session.user = { name: user.name, email: user.email };
            res.redirect('/');
        } else {
            res.send('Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
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


app.get('/profile', (req, res) => {
    res.render('profile');
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
