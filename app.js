const express = require('express');
const path = require('path');
const { connectToDB , getDB }=require('./db');

const app = express();
const port = 3001; // Use an available port
let db;

//DB Connection 
connectToDB((err)=>{
    if(!err){
        // Start the server
        app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
            });

        db=getDB();
    }else{
        console.error("Failed to connect to the database: ", err);
        process.exit(1); //Exit the application if the database connecrtion fails
    }
});

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (e.g., CSS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
    res.render('index');
});

// Test route to check DB connection
app.get('/test-connection', async (req, res) => {
    try {
        const testCollection = db.collection('users');
        const documents = await testCollection.find({}).toArray();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching documents.' });
    }
});



