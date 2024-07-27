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
         await db.collection('businesses').createIndex({ geoRegion: 1 });

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
    return await db.collection('categories').findOne({ _id: ObjectId.createFromHexString(categoryId) }); // Use ObjectId.createFromHexString here
}

// Fetch user by ID
async function getUserById(userId) {
    const db = getDB(); // Replace with your function to get the database connection
    return await db.collection('users').findOne({ _id: ObjectId.createFromHexString(userId) });
}

async function getBusinessById(businessId) {
    try {
        const db = getDB();
        console.log(`Querying for business with ID: ${businessId}`);
        const business = await db.collection('businesses').findOne({ _id: new ObjectId(businessId) });
        console.log('Query result:', business);
        return business;
    } catch (err) {
        console.error('Error in getBusinessById:', err);
        throw err;
    }
}

// Add a new payment method
async function addPaymentMethod(userId, paymentMethod) {
    const db = getDB();

    // Find the user based on their id_number
    const user = await db.collection('users').findOne({ id_number: userId });
    if (!user) {
        throw new Error('User not found');
    }

    // Prepare the payment method data
    const newPaymentMethod = {
        card_number: paymentMethod.card_number, // No encryption
        card_type: paymentMethod.card_type,
        expiry_date: paymentMethod.expiry_date,
        billing_address: paymentMethod.billing_address
    };

    // Add the payment method to the user's document
    const updateResult = await db.collection('users').updateOne(
        { id_number: userId },
        { $push: { payment_methods: newPaymentMethod } }
    );

    return updateResult.modifiedCount > 0; // Return true if the update was successful
}

function encrypt(data) {
    // Implement encryption logic here
    return data; // Placeholder, replace with actual encryption
}

// Fetch top 5 highest-rated reviews
async function getTopReviews() {
    const db = getDB();
    return await db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
}

module.exports = { connectToDB, getDB, ObjectId , getCategories, getBusinessesByCategory, getCategoryById, getTopReviews,getBusinessById, addPaymentMethod, getUserById };




