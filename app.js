
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { connectToDB, getDB } = require('./db');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

let db;

async function startServer() {
    try {
        await connectToDB();
        db = getDB();
        console.log('Database connected successfully');

        // Middleware to pass the database to the controllers
        app.use((req, res, next) => {
            req.db = db;
            next();
        });

        // Import controllers
        const userController = require('./controllers/userController');
        const productController = require('./controllers/productController');
        const businessController = require('./controllers/businessController');
        const weatherController = require('./controllers/weatherController');

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
            origin: 'http://localhost:3001',
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

        // Use controllers
        app.use('/', userController);
        app.use('/', productController);
        app.use('/', businessController);
        app.use('/', weatherController);

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }


    app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

}

startServer();

module.exports = app;





