const express = require('express');
const router = express.Router();
const { getProductById } = require('../db');
const { getDB } = require('../db');
const db = getDB();
const { ObjectId } = require('mongodb');

router.post('/add-item-to-cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You need to log in first');
    }

    const { productId, quantity, price } = req.body;

    if (!productId || !quantity || isNaN(quantity) || quantity <= 0 || !price || isNaN(price) || price <= 0) {
        return res.status(400).send('Invalid product ID, quantity, or price');
    }

    if (req.session.user) {
        try {
            const product = await getProductById(productId);
            if (!product) {
                return res.status(404).send('Product not found');
            }

            let cart = await db.collection('cart').findOne({ user_id: req.session.user.id });
            if (cart) {
                const existingItem = cart.items.find(item => item._id.equals(product._id));
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.items.push({
                        _id: product._id,
                        product_name: product.name,
                        quantity: quantity,
                        price: price  // Ensure this uses the provided price
                    });
                }

                cart.quantity = cart.items.reduce((total, item) => total + item.quantity, 0);
                cart.updated_at = new Date();

                // Update the cart in the database
                await db.collection('cart').updateOne(
                    { _id: cart._id },
                    { $set: { items: cart.items, quantity: cart.quantity, updated_at: cart.updated_at } }
                );

                res.json({ success: true, cart });
            } else {
                // If no cart exists, create a new one
                cart = {
                    user_id: req.session.user.id,
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
                await db.collection('cart').insertOne(cart);
                res.json({ success: true, cart });
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            res.status(500).send('Internal server error');
        }
    } else {
        res.status(500).send('User ID not found');
    }
});

module.exports = router;
