const { MongoClient } = require('mongodb');

let dbConnection;

// My MongoDB connection URL
const url = "mongodb+srv://sapir8220:Aa123456@buymeproject.d6fiunn.mongodb.net/?retryWrites=true&w=majority&appName=BuyMeProject";

module.exports = {
    connectToDB: (callbackFunc) => {
        // Connect to the MongoDB server
        MongoClient.connect(url)
            .then((client) => {
                dbConnection = client.db(); // Gets the database connection
                console.log("Successfully connected to MongoDB Atlas");
                return callbackFunc();
            })
            .catch((err) => {
                console.error("Failed to connect to MongoDB Atlas", err);
                return callbackFunc(err);
            });
    },
    getDB: () => dbConnection // Function to get the database connection
};
