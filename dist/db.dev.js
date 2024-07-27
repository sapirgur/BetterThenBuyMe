"use strict";

require('dotenv').config();

var _require = require('mongodb'),
    MongoClient = _require.MongoClient,
    ObjectId = _require.ObjectId; // Ensure ObjectId is imported


var uri = process.env.mongoDB_URI;
var dbName = 'BuyMe';
var db;

function connectToDB(callback) {
  var client;
  return regeneratorRuntime.async(function connectToDB$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(client.connect());

        case 4:
          db = client.db(dbName);
          console.log('Connected to database'); // Create indexes for filters

          _context.next = 8;
          return regeneratorRuntime.awrap(db.collection('businesses').createIndex({
            name: "text",
            description: "text"
          }));

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(db.collection('businesses').createIndex({
            categories: 1
          }));

        case 10:
          _context.next = 12;
          return regeneratorRuntime.awrap(db.collection('businesses').createIndex({
            price: 1
          }));

        case 12:
          _context.next = 14;
          return regeneratorRuntime.awrap(db.collection('businesses').createIndex({
            geoRegion: 1
          }));

        case 14:
          callback(null);
          _context.next = 21;
          break;

        case 17:
          _context.prev = 17;
          _context.t0 = _context["catch"](1);
          console.error('Failed to connect to the database:', _context.t0);
          callback(_context.t0);

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 17]]);
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDB first.');
  }

  return db;
} // Fetch all categories


function getCategories() {
  var db;
  return regeneratorRuntime.async(function getCategories$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          db = getDB();
          _context2.next = 3;
          return regeneratorRuntime.awrap(db.collection('categories').find().toArray());

        case 3:
          return _context2.abrupt("return", _context2.sent);

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
} // Fetch businesses by category name


function getBusinessesByCategory(categoryName) {
  var db;
  return regeneratorRuntime.async(function getBusinessesByCategory$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          db = getDB();
          _context3.next = 3;
          return regeneratorRuntime.awrap(db.collection('businesses').find({
            categories: categoryName
          }).toArray());

        case 3:
          return _context3.abrupt("return", _context3.sent);

        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
} // Fetch category by ID


function getCategoryById(categoryId) {
  var db;
  return regeneratorRuntime.async(function getCategoryById$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          db = getDB();
          _context4.next = 3;
          return regeneratorRuntime.awrap(db.collection('categories').findOne({
            _id: ObjectId.createFromHexString(categoryId)
          }));

        case 3:
          return _context4.abrupt("return", _context4.sent);

        case 4:
        case "end":
          return _context4.stop();
      }
    }
  });
} // Fetch top 5 highest-rated reviews


function getTopReviews() {
  var db;
  return regeneratorRuntime.async(function getTopReviews$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          db = getDB();
          _context5.next = 3;
          return regeneratorRuntime.awrap(db.collection('reviews').find({
            rating: {
              $gte: 4
            }
          }).sort({
            rating: -1
          }).limit(5).toArray());

        case 3:
          return _context5.abrupt("return", _context5.sent);

        case 4:
        case "end":
          return _context5.stop();
      }
    }
  });
} // Fetch business by ID


function getBusinessById(businessId) {
  var db;
  return regeneratorRuntime.async(function getBusinessById$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          db = getDB();
          _context6.next = 3;
          return regeneratorRuntime.awrap(db.collection('businesses').findOne({
            _id: ObjectId.createFromHexString(businessId)
          }));

        case 3:
          return _context6.abrupt("return", _context6.sent);

        case 4:
        case "end":
          return _context6.stop();
      }
    }
  });
}

module.exports = {
  connectToDB: connectToDB,
  getDB: getDB,
  getCategories: getCategories,
  getBusinessesByCategory: getBusinessesByCategory,
  getCategoryById: getCategoryById,
  getTopReviews: getTopReviews,
  getBusinessById: getBusinessById
};