require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.mongoDB_URI;
const dbName = 'BuyMe';

let db;
let client;

async function connectToDB() {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to database');

        // indexes for filters
        await db.collection('businesses').createIndex({ name: "text", description: "text" });
        await db.collection('businesses').createIndex({ categories: 1 });
        await db.collection('businesses').createIndex({ price: 1 });
        await db.collection('businesses').createIndex({ geoRegion: 1 });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        throw error;
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
    try {
        const db = getDB();
        return await db.collection('categories').find().toArray();
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

// Fetch businesses by category name
async function getBusinessesByCategory(categoryName) {
    try {
        const db = getDB();
        return await db.collection('businesses').find({ categories: categoryName }).toArray();
    } catch (error) {
        console.error('Error fetching businesses by category:', error);
        throw error;
    }
}

// Fetch category by ID
async function getCategoryById(categoryId) {
    try {
        const db = getDB();
        return await db.collection('categories').findOne({ _id: ObjectId(categoryId) });
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        throw error;
    }
}

// Fetch top 5 highest-rated reviews
async function getTopReviews() {
    try {
        const db = getDB();
        return await db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
    } catch (error) {
        console.error('Error fetching top reviews:', error);
        throw error;
    }
}

// Fetch business by ID
async function getBusinessById(businessId) {
    try {
        const db = getDB();
        return await db.collection('businesses').findOne({ _id: ObjectId(businessId) });
    } catch (error) {
        console.error('Error fetching business by ID:', error);
        throw error;
    }
}

// Fetch product by ID
async function getProductById(productId) {
    try {
        const db = getDB();
        return await db.collection('products').findOne({ _id: ObjectId(productId) });
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        throw error;
    }
}

// Fetch coupon by name
async function getCouponByCode(couponCode) {
    try {
        const db = getDB();
        const currentDate = new Date();
        return await db.collection('coupons').findOne({
            coupon_name: { $regex: new RegExp('^' + couponCode + '$', 'i') },
            deadline_date: { $gte: currentDate }
        });
    } catch (error) {
        console.error('Error fetching coupon by code:', error);
        throw error;
    }
}

async function getLocations() {
    try {
        const db = getDB();
        return await db.collection('locations').find().toArray();
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
}

async function getManagers() {
    try {
        const db = getDB();
        return await db.collection('managers').find().toArray();
    } catch (error) {
        console.error('Error fetching managers:', error);
        throw error;
    }
}

// Fetch all orders
async function getOrders() {
    try {
        const db = getDB();
        return await db.collection('orders').find().toArray();
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

async function getCarts() {
    try {
        const db = getDB();
        return await db.collection('cart').find().toArray();
    } catch (error) {
        console.error('Error fetching carts:', error);
        throw error;
    }
}

async function getBusinesses() {
    try {
        const db = getDB();
        return await db.collection('businesses').find().toArray();
    } catch (error) {
        console.error('Error fetching businesses:', error);
        throw error;
    }
}

async function getReviews() {
    try {
        const db = getDB();
        return await db.collection('reviews').find().toArray();
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
}

async function getProducts() {
    try {
        const db = getDB();
        return await db.collection('products').find().toArray();
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

// Ensure client is closed on application termination
process.on('SIGINT', async () => {
    if (client) {
        await client.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
});

module.exports = { connectToDB, getDB, getCategories, getBusinessesByCategory, getCategoryById, getTopReviews, getBusinessById, getProductById, getCouponByCode, getLocations, getManagers, getOrders, getCarts, getBusinesses, getReviews, getProducts, ObjectId };
