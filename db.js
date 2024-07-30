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

         // indexes for filters
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

// Fetch top 5 highest-rated reviews
async function getTopReviews() {
    const db = getDB();
    return await db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
}

// Fetch business by ID
async function getBusinessById(businessId) {
    const db = getDB();
    return await db.collection('businesses').findOne({ _id: ObjectId.createFromHexString(businessId) });
}

async function getProductById(productId) {
    const db = getDB();
    return await db.collection('products').findOne({ _id: new ObjectId(productId) });
}

// Fetch coupon by name
async function getCouponByCode(couponCode) {
    const db = getDB();
    const currentDate = new Date();
    const coupon = await db.collection('coupons').findOne({
        coupon_name: { $regex: new RegExp('^' + couponCode + '$', 'i') },
        deadline_date: { $gte: currentDate }
    });
    return coupon;
}

async function getLocations() {
    const db = getDB();
    return await db.collection('locations').find().toArray();
}



module.exports = { connectToDB, getDB, getCategories, getBusinessesByCategory, getCategoryById, getTopReviews, getBusinessById, getProductById, getCouponByCode, getLocations };




