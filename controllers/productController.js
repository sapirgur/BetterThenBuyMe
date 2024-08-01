const express = require('express');
const router = express.Router();
const { ObjectId, getProductById,toObjectId } = require('../db');

router.get('/shop', async (req, res) => {
    try {
        const categories = await req.db.collection('categories').find().toArray();
        res.render('shop', { categories, businesses: [] });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/shop/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await req.db.collection('categories').findOne({ _id: new ObjectId(categoryId) });
        const businesses = await req.db.collection('businesses').find({ categories: category.name }).toArray();
        const categories = await req.db.collection('categories').find().toArray();
        res.render('shop', { categories, businesses });
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/shop/item/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const Business = await req.db.collection('businesses').findOne({ _id: new ObjectId(itemId) });
        res.render('itemDetail', { item: Business });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/search', async (req, res) => {
    const { keywords, category, maxPrice, geoRegion } = req.query;

    try {
        const query = {};

        // Search by keywords
        if (keywords) {
            query.$text = { $search: keywords };
        }

        // Filter by category
        if (category) {
            query.categories = category;
        }

        // Filter by maximum price
        if (maxPrice) {
            query.price = { $lte: parseFloat(maxPrice) };
        }

        // Filter by geographical location
        if (geoRegion) {
            switch (geoRegion) {
                case 'כל הארץ':
                    break;
                case 'מרכז הארץ':
                    query.geographical_location = {
                        $in: [
                            'ראשון לציון',
                            'פתח תקווה',
                            'נס ציונה',
                            'רחובות',
                            'הרצליה',
                            'נתניה',
                            'אור יהודה',
                            'חולון',
                        ],
                    };
                    break;
                case 'דרום הארץ':
                    query.geographical_location = { $in: ['באר שבע'] };
                    break;
                case 'צפון הארץ':
                    query.geographical_location = {
                        $in: [
                            'קצרין',
                            'קיסריה',
                            'זכרון יעקב',
                            'מיני ישראל',
                            'שוני',
                            'טבריה',
                        ],
                    };
                    break;
                case 'אזור ירושלים':
                    query.geographical_location = { $in: ['ירושלים', 'מודיעין'] };
                    break;
                default:
                    query.geographical_location = geoRegion;
            }
        }

        const businesses = await req.db.collection('businesses').find(query).toArray();
        const categories = await req.db.collection('categories').find().toArray();

        // Check if no businesses were found
        if (businesses.length === 0) {
            res.render('shop', {
                categories,
                businesses,
                message: 'מצטערים, לא מצאנו תוצאות המתאימות לחיפוש שלך. תוכל לעיין בקטגוריות שלנו.',
            });
        } else {
            res.render('shop', { categories, businesses, message: null });
        }
    } catch (err) {
        console.error('Error performing search:', err);
        res.status(500).send('Internal server error');
    }
});


router.post('/add-item-to-cart', async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    let { productId, quantity, price } = req.body;
    const user_id = req.session.user.id;

    console.log(`Received productId: ${productId}, Type: ${typeof productId}`);
    console.log(`productId keys: ${Object.keys(productId)}`);
    console.log(`productId toString: ${productId.toString()}`);

    try {
        // Ensure productId is a string
        if (typeof productId !== 'string') {
            throw new Error('Product ID must be a string');
        }

        // Validate ObjectId
        const validProductId = toObjectId(productId);
        
        if (!quantity || isNaN(quantity) || quantity <= 0 || !price || isNaN(price) || price <= 0) {
            return res.status(400).send('Invalid quantity or price');
        }

        const product = await getProductById(validProductId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        let cart = await req.db.collection('cart').findOne({ user_id: user_id });
        if (cart) {
            const existingItem = cart.items.find(item => item._id.equals(product._id));
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    _id: product._id,
                    product_name: product.name,
                    quantity: quantity,
                    price: price
                });
            }

            cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
            cart.updated_at = new Date();

            await req.db.collection('cart').updateOne(
                { _id: cart._id },
                { $set: { items: cart.items, quantity: cart.quantity, updated_at: cart.updated_at } }
            );

            res.json({ success: true, cart });
        } else {
            cart = {
                user_id: user_id,
                items: [{
                    _id: product._id,
                    product_name: product.name,
                    quantity: quantity,
                    price: price
                }],
                quantity: quantity,
                created_at: new Date(),
                updated_at: new Date()
            };
            await req.db.collection('cart').insertOne(cart);
            res.json({ success: true, cart });
        }
    } catch (error) {
        console.error('Error adding item to cart:', error);
        next(error);  // Pass the error to the error-handling middleware
    }
});

// New route for fetching cart data
router.get('/cart-data', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user_id = req.session.user.id;  // Retrieve user ID from session

    try {
        let cart = await req.db.collection('cart').findOne({ user_id: user_id });

        // Return cart items as JSON
        res.json(cart ? cart.items : []);
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/decrease-quantity', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    const { productId } = req.body;
    const user_id = req.session.user.id;  // Retrieve user ID from session

    if (!productId) {
        return res.status(400).send('Invalid product ID');
    }

    try {
        let cart = await req.db.collection('cart').findOne({ user_id: user_id });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item._id.equals(toObjectId(productId)));
        if (itemIndex === -1) {
            return res.status(404).send('Item not found in cart');
        }

        cart.items[itemIndex].quantity -= 1;
        if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1); // Remove item if quantity is 0
        }

        cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        cart.total_price = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        cart.updated_at = new Date();

        await req.db.collection('cart').updateOne(
            { _id: cart._id },
            { $set: { items: cart.items, quantity: cart.quantity, total_price: cart.total_price, updated_at: cart.updated_at } }
        );

        res.json({ success: true, items: cart.items });
    } catch (error) {
        console.error('Error decreasing item quantity:', error);
        res.status(500).send('Internal server error');
    }
});

router.post('/increase-quantity', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    const { productId } = req.body;
    const user_id = req.session.user.id;  // Retrieve user ID from session

    if (!productId) {
        return res.status(400).send('Invalid product ID');
    }

    try {
        let cart = await req.db.collection('cart').findOne({ user_id: user_id });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item._id.equals(toObjectId(productId)));
        if (itemIndex === -1) {
            return res.status(404).send('Item not found in cart');
        }

        cart.items[itemIndex].quantity += 1;

        cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        cart.total_price = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        cart.updated_at = new Date();

        await req.db.collection('cart').updateOne(
            { _id: cart._id },
            { $set: { items: cart.items, quantity: cart.quantity, total_price: cart.total_price, updated_at: cart.updated_at } }
        );

        res.json({ success: true, items: cart.items });
    } catch (error) {
        console.error('Error increasing item quantity:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;






