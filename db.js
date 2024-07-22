require('dotenv').config();

const { MongoClient } = require('mongodb');
const uri = process.env.mongoDB_URI;  
const dbName = 'BuyMe'; 

let db;

async function connectToDB(callback) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to database');
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

module.exports = { connectToDB, getDB };
