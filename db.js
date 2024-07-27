require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb'); // Ensure ObjectId is imported
const uri = process.env.mongoDB_URI;  
const dbName = 'BuyMe'; 

let db;

async function connectToDB(callback) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to database');

        // Create indexes for filters
        await db.collection('businesses').createIndex({ name: "text", description: "text" });
        await db.collection('businesses').createIndex({ categories: 1 });
        await db.collection('businesses').createIndex({ price: 1 });
        await db.collection('businesses').createIndex({ geographical_location: 1 });

        callback(null);
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        callback(error);
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDB first.');
    }
    return db;
}

// Fetch all categories
async function getCategories() {
    const db = getDB();
    return await db.collection('categories').find().toArray();
}

// Fetch businesses by category name
async function getBusinessesByCategory(categoryName) {
    const db = getDB();
    return await db.collection('businesses').find({ categories: categoryName }).toArray();
}

// Fetch category by ID
async function getCategoryById(categoryId) {
    const db = getDB();
    return await db.collection('categories').findOne({ _id: new ObjectId(categoryId) }); // Use ObjectId.createFromHexString here
}

// Fetch top 5 highest-rated reviews
async function getTopReviews() {
    const db = getDB();
    return await db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
}

module.exports = { connectToDB, getDB, getCategories, getBusinessesByCategory, getCategoryById, getTopReviews };
