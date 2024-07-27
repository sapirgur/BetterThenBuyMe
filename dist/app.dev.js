"use strict";

var express = require('express');

var path = require('path');

var session = require('express-session');

var _require = require('./db'),
    connectToDB = _require.connectToDB,
    getDB = _require.getDB,
    getCategories = _require.getCategories,
    getBusinessesByCategory = _require.getBusinessesByCategory,
    getCategoryById = _require.getCategoryById,
    getTopReviews = _require.getTopReviews,
    getBusinessById = _require.getBusinessById;

var bodyParser = require('body-parser');

var app = express();
var port = 3001; // Use an available port

var db; // DB Connection 

connectToDB(function (err) {
  if (!err) {
    // Start the server
    app.listen(port, function () {
      console.log("Server is running at http://localhost:".concat(port));
    });
    db = getDB();
  } else {
    console.error("Failed to connect to the database:", err);
    process.exit(1); // Exit the application if the database connection fails
  }
}); // Set the view engine to EJS

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Serve static files (e.g., CSS) from the "public" directory

app.use(express["static"](path.join(__dirname, 'public'))); // Body-parser middleware

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json()); // Session middleware

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
})); // Middleware to pass session user to views

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
}); // Define routes

app.get('/', function _callee(req, res) {
  var topReviews, categories;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(getTopReviews());

        case 3:
          topReviews = _context.sent;
          _context.next = 6;
          return regeneratorRuntime.awrap(getCategories());

        case 6:
          categories = _context.sent;
          res.render('index', {
            topReviews: topReviews,
            categories: categories
          });
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error('Error fetching top reviews and categories:', _context.t0);
          res.status(500).send('Internal server error');

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
app.get('/login', function (req, res) {
  res.render('login');
}); // Updated login route

app.post('/login', function _callee2(req, res) {
  var _req$body, email, password, user, cart;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body = req.body, email = _req$body.email, password = _req$body.password;
          _context2.prev = 1;
          _context2.next = 4;
          return regeneratorRuntime.awrap(db.collection('users').findOne({
            email: email,
            password: password
          }));

        case 4:
          user = _context2.sent;

          if (!user) {
            _context2.next = 19;
            break;
          }

          req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
          }; // Retrieve the user's cart

          _context2.next = 9;
          return regeneratorRuntime.awrap(db.collection('cart').findOne({
            user_id: user._id
          }));

        case 9:
          cart = _context2.sent;

          if (cart) {
            _context2.next = 14;
            break;
          }

          // If no cart exists, create a new one
          cart = {
            user_id: user._id,
            items: [],
            created_at: new Date(),
            updated_at: new Date()
          };
          _context2.next = 14;
          return regeneratorRuntime.awrap(db.collection('cart').insertOne(cart));

        case 14:
          console.log(cart);
          req.session.cart = cart; // Save the cart in the session

          res.redirect('/');
          _context2.next = 20;
          break;

        case 19:
          res.send('Invalid email or password');

        case 20:
          _context2.next = 26;
          break;

        case 22:
          _context2.prev = 22;
          _context2.t0 = _context2["catch"](1);
          console.error('Login error:', _context2.t0);
          res.status(500).send('Internal server error');

        case 26:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 22]]);
}); // Route to add items to the cart

app.post('/add-to-cart', function _callee3(req, res) {
  var _req$body2, product_id, quantity, user_id, cart, result, itemIndex;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (req.session.user) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt("return", res.status(401).send('You need to log in first'));

        case 2:
          _req$body2 = req.body, product_id = _req$body2.product_id, quantity = _req$body2.quantity;
          user_id = req.session.user.id;
          _context3.prev = 4;
          _context3.next = 7;
          return regeneratorRuntime.awrap(db.collection('cart').findOne({
            user_id: ObjectId(user_id)
          }));

        case 7:
          cart = _context3.sent;

          if (cart) {
            _context3.next = 14;
            break;
          }

          // If no cart exists, create a new one
          cart = {
            user_id: ObjectId(user_id),
            items: [],
            created_at: new Date(),
            updated_at: new Date()
          };
          _context3.next = 12;
          return regeneratorRuntime.awrap(db.collection('cart').insertOne(cart));

        case 12:
          result = _context3.sent;
          cart._id = result.insertedId;

        case 14:
          // Add the item to the cart
          itemIndex = cart.items.findIndex(function (item) {
            return item.product_id === product_id;
          });

          if (itemIndex > -1) {
            // If the item already exists in the cart, update the quantity
            cart.items[itemIndex].quantity += quantity;
          } else {
            // Otherwise, add the new item to the cart
            cart.items.push({
              product_id: product_id,
              quantity: quantity
            });
          }

          cart.updated_at = new Date(); // Update the cart in the database

          _context3.next = 19;
          return regeneratorRuntime.awrap(db.collection('cart').updateOne({
            _id: ObjectId(cart._id)
          }, {
            $set: {
              items: cart.items,
              updated_at: cart.updated_at
            }
          }));

        case 19:
          req.session.cart = cart; // Update the cart in the session

          res.redirect('/cart'); // Redirect to the cart page or another appropriate page

          _context3.next = 27;
          break;

        case 23:
          _context3.prev = 23;
          _context3.t0 = _context3["catch"](4);
          console.error('Error adding item to cart:', _context3.t0);
          res.status(500).send('Internal server error');

        case 27:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[4, 23]]);
}); // Logout route

app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      return res.redirect('/'); // If there's an error, redirect to home
    }

    res.clearCookie('connect.sid'); // Clear the session cookie

    res.redirect('/'); // Redirect to the homepage
  });
});
app.get('/registration', function (req, res) {
  res.render('registration');
});
app.post('/register', function _callee4(req, res) {
  var _req$body3, id_number, first_name, last_name, email, password, street, street_number, city, phone_number, newUser;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _req$body3 = req.body, id_number = _req$body3.id_number, first_name = _req$body3.first_name, last_name = _req$body3.last_name, email = _req$body3.email, password = _req$body3.password, street = _req$body3.street, street_number = _req$body3.street_number, city = _req$body3.city, phone_number = _req$body3.phone_number;
          _context4.prev = 1;
          newUser = {
            id_number: id_number,
            name: "".concat(first_name, " ").concat(last_name),
            email: email,
            password: password,
            address: [{
              street: street,
              "street-number": street_number,
              city: city
            }],
            phone_number: phone_number,
            payment_methods: [],
            // Initialize with empty array
            order_history: [] // Initialize with empty array

          };
          _context4.next = 5;
          return regeneratorRuntime.awrap(db.collection('users').insertOne(newUser));

        case 5:
          req.session.user = {
            name: newUser.name,
            email: newUser.email
          };
          res.redirect('/');
          _context4.next = 13;
          break;

        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](1);
          console.error('Registration error:', _context4.t0);
          res.status(500).send('Internal server error');

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 9]]);
}); //routes for the shop feature

app.get('/shop', function _callee5(req, res) {
  var categories;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(getCategories());

        case 3:
          categories = _context5.sent;
          res.render('shop', {
            categories: categories,
            businesses: []
          });
          _context5.next = 11;
          break;

        case 7:
          _context5.prev = 7;
          _context5.t0 = _context5["catch"](0);
          console.error('Error fetching categories:', _context5.t0);
          res.status(500).send('Internal server error');

        case 11:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.get('/shop/:categoryId', function _callee6(req, res) {
  var categoryId, category, businesses, categories;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          categoryId = req.params.categoryId;
          _context6.next = 4;
          return regeneratorRuntime.awrap(getCategoryById(categoryId));

        case 4:
          category = _context6.sent;
          _context6.next = 7;
          return regeneratorRuntime.awrap(getBusinessesByCategory(category.name));

        case 7:
          businesses = _context6.sent;
          _context6.next = 10;
          return regeneratorRuntime.awrap(getCategories());

        case 10:
          categories = _context6.sent;
          res.render('shop', {
            categories: categories,
            businesses: businesses
          });
          _context6.next = 18;
          break;

        case 14:
          _context6.prev = 14;
          _context6.t0 = _context6["catch"](0);
          console.error('Error fetching businesses:', _context6.t0);
          res.status(500).send('Internal server error');

        case 18:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 14]]);
});
app.get('/shop/item/:itemId', function _callee7(req, res) {
  var itemId, Business;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          itemId = req.params.itemId;
          console.log(itemId);
          _context7.next = 5;
          return regeneratorRuntime.awrap(getBusinessById(itemId));

        case 5:
          Business = _context7.sent;
          console.log(Business);
          res.render('itemDetail', {
            item: Business
          });
          _context7.next = 14;
          break;

        case 10:
          _context7.prev = 10;
          _context7.t0 = _context7["catch"](0);
          console.error('Error fetching business:', _context7.t0);
          res.status(500).send('Internal Server Error');

        case 14:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 10]]);
}); // Route for the search bar feature

app.get('/search', function _callee8(req, res) {
  var _req$query, keywords, category, maxPrice, geoRegion, query, businesses, categories;

  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _req$query = req.query, keywords = _req$query.keywords, category = _req$query.category, maxPrice = _req$query.maxPrice, geoRegion = _req$query.geoRegion;
          console.log('Search Parameters:', req.query); // Log the search parameters

          _context8.prev = 2;
          query = {}; // Search for keywords in all indexed text fields

          if (keywords) {
            query.$text = {
              $search: keywords
            };
          } // Filter by category


          if (category) {
            query.categories = category;
          } // Filter by maximum price


          if (maxPrice) {
            query.price = {
              $lte: parseFloat(maxPrice)
            };
          } // Filter by geographical location


          if (!geoRegion) {
            _context8.next = 21;
            break;
          }

          _context8.t0 = geoRegion;
          _context8.next = _context8.t0 === 'כל הארץ' ? 11 : _context8.t0 === 'מרכז הארץ' ? 12 : _context8.t0 === 'דרום הארץ' ? 14 : _context8.t0 === 'צפון הארץ' ? 16 : _context8.t0 === 'אזור ירושלים' ? 18 : 20;
          break;

        case 11:
          return _context8.abrupt("break", 21);

        case 12:
          query.geographical_location = {
            $in: ['ראשון לציון', 'פתח תקווה', 'נס ציונה', 'רחובות', 'הרצליה', 'נתניה', 'אור יהודה', 'חולון']
          };
          return _context8.abrupt("break", 21);

        case 14:
          query.geographical_location = {
            $in: ['באר שבע']
          };
          return _context8.abrupt("break", 21);

        case 16:
          query.geographical_location = {
            $in: ['קצרין', 'קיסריה', 'זכרון יעקב', 'מיני ישראל', 'שוני', 'טבריה']
          };
          return _context8.abrupt("break", 21);

        case 18:
          query.geographical_location = {
            $in: ['ירושלים', 'מודיעין']
          };
          return _context8.abrupt("break", 21);

        case 20:
          query.geographical_location = geoRegion;

        case 21:
          console.log('Database Query:', query); // Log the query being sent to the database

          _context8.next = 24;
          return regeneratorRuntime.awrap(db.collection('businesses').find(query).toArray());

        case 24:
          businesses = _context8.sent;
          console.log('Search Results:', businesses); // Log the search results

          _context8.next = 28;
          return regeneratorRuntime.awrap(getCategories());

        case 28:
          categories = _context8.sent;
          res.render('shop', {
            categories: categories,
            businesses: businesses
          });
          _context8.next = 36;
          break;

        case 32:
          _context8.prev = 32;
          _context8.t1 = _context8["catch"](2);
          console.error('Error performing search:', _context8.t1);
          res.status(500).send('Internal server error');

        case 36:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[2, 32]]);
});
app.get('/aboutUs', function (req, res) {
  res.render('aboutUs');
});
app.get('/terms', function (req, res) {
  res.render('terms');
});
app.get('/whyGiveGifts', function (req, res) {
  res.render('whyGiveGifts');
});
app.get('/contact', function (req, res) {
  res.render('contactUs');
});
app.get('/profile', function (req, res) {
  res.render('profile');
}); // Test route to check DB connection

app.get('/test-connection', function _callee9(req, res) {
  var testCollection, documents;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;

          if (db) {
            _context9.next = 3;
            break;
          }

          return _context9.abrupt("return", res.status(500).json({
            error: 'Database not initialized'
          }));

        case 3:
          testCollection = db.collection('users');

          if (testCollection) {
            console.log('Collection reference obtained');
          }

          console.log(testCollection);
          _context9.next = 8;
          return regeneratorRuntime.awrap(testCollection.find({}).toArray());

        case 8:
          documents = _context9.sent;
          console.log('Documents fetched:', documents);
          res.json(documents);
          _context9.next = 17;
          break;

        case 13:
          _context9.prev = 13;
          _context9.t0 = _context9["catch"](0);
          console.error('Error fetching documents:', _context9.t0);
          res.status(500).json({
            error: 'An error occurred while fetching documents.'
          });

        case 17:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 13]]);
});
module.exports = app;