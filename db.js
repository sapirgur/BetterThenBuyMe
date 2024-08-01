require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.mongoDB_URI;
const dbName = 'BuyMe';

let db;
let client;

async function connectToDB() {
    client = new MongoClient(uri);
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

// Helper function to safely convert to ObjectId
// Helper function to safely convert to ObjectId
function toObjectId(id) {
    if (!ObjectId.isValid(id) || typeof id !== 'string' || id.length !== 24) {
        console.error(`Invalid ObjectId format: ${id}`);
        throw new Error('Invalid ObjectId format');
    }
    return new ObjectId(id);
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
    return await db.collection('categories').findOne({ _id: toObjectId(categoryId) });
}

// Fetch top 5 highest-rated reviews
async function getTopReviews() {
    const db = getDB();
    return await db.collection('reviews').find({ rating: { $gte: 4 } }).sort({ rating: -1 }).limit(5).toArray();
}

// Fetch business by ID
async function getBusinessById(businessId) {
    const db = getDB();
    return await db.collection('businesses').findOne({ _id: toObjectId(businessId) });
}

// Fetch product by ID
async function getProductById(productId) {
    const db = getDB();
      console.log(`ProductId in getProductById: ${productId}, Type: ${typeof productId}`);
    return await db.collection('products').findOne({ _id: productId });
}

// Fetch coupon by name
//async function getCouponByCode(couponCode) {
  //  const db = getDB();
    //const currentDate = new Date();
    //return await db.collection('coupons').findOne({
      //  coupon_name: { $regex: new RegExp('^' + couponCode + '$', 'i') },
        //deadline_date: { $gte: currentDate }
    //});
//}

async function getCouponByCode(db, couponCode) {
    try {
        const coupon = await db.collection('coupons').findOne({
            coupon_name: couponCode,
            deadline_date: { $gte: new Date() } // Check for valid expiry date
        });
        return coupon;
    } catch (error) {
        console.error('Error retrieving coupon:', error);
        throw error;
    }
}

async function getLocations() {
    const db = getDB();
    return await db.collection('locations').find().toArray();
}

async function getManagers() {
    const db = getDB();
    return await db.collection('managers').find().toArray();
}

// Fetch all orders
async function getOrders() {
    const db = getDB();
    return await db.collection('orders').find().toArray();
}

async function getCarts() {
    const db = getDB();
    return await db.collection('cart').find().toArray();
}

async function getBusinesses() {
    const db = getDB();
    return await db.collection('businesses').find().toArray();
}

async function getReviews() {
    const db = getDB();
    return await db.collection('reviews').find().toArray();
}

async function getProducts() {
    const db = getDB();
    return await db.collection('products').find().toArray();
}

// Ensure client is closed on application termination
process.on('SIGINT', async () => {
    if (client) {
        await client.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
});

module.exports = { connectToDB, getDB, getCategories, getBusinessesByCategory, getCategoryById, getTopReviews, getBusinessById, getProductById, getCouponByCode, getLocations, getManagers, getOrders, getCarts, getBusinesses, getReviews, getProducts, ObjectId ,toObjectId};
