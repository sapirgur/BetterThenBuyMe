const express = require('express');
const path = require('path');

const app = express();
const port = 3001; // Use an available port

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (e.g., CSS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/brand', (req, res) => {
    res.render('brandPage');
});

app.get('/register', (req, res) => {
    res.render('registration'); // Render the registration.ejs view
});

app.get('/login', (req, res) => {
    res.render('login'); // Render the login.ejs view
});

app.get('/profile', (req, res) => {
    res.render('userProfile'); // Render the userProfile.ejs view
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

