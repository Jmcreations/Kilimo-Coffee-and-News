const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// POST /api/orders - Public customer coffee checkout
router.post('/', async (req, res) => {
  try {
    const { items, customer, deliveryMethod, preferredDeliveryDate, deliveryFee } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    if (!customer?.fullName || !customer?.phone || !customer?.county || !customer?.deliveryLocation) {
      return res.status(400).json({
        message: 'Customer full name, phone, county, and delivery location are required.'
      });
    }

    // Normalize items: clear roastLevel if Ground Coffee was selected
    const normalizedItems = items.map((item) => ({
      region: item.region,
      coffeeForm: item.coffeeForm,
      roastLevel: item.coffeeForm === 'Roasted Beans' ? item.roastLevel : null,
      packSize: item.packSize || '500g',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0
    }));

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const fee = Number(deliveryFee) || 0;

    const newOrder = new Order({
      items: normalizedItems,
      customer,
      deliveryMethod: deliveryMethod || 'Doorstep Delivery',
      preferredDeliveryDate: preferredDeliveryDate || '',
      subtotal,
      deliveryFee: fee,
      totalAmount: subtotal + fee
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ message: err.message || 'Failed to place coffee order.' });
  }
});

// GET /api/orders - View orders (Delivery riders & Admins)
router.get('/', verifyToken, authorizeRoles('delivery', 'admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .populate('assignedRider', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update delivery progress (Delivery riders & Admins)
router.patch('/:id/status', verifyToken, authorizeRoles('delivery', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.status = status;

    // Automatically assign the delivery rider when they claim/dispatch an order
    if (req.user.role === 'delivery' && !order.assignedRider) {
      order.assignedRider = req.user.id;
    }

    await order.save();
    const populated = await order.populate('assignedRider', 'name phone email');
    res.status(200).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update order status.' });
  }
});

// DELETE /api/orders/:id - Remove order (Admin only)
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({ message: 'Order deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete order.' });
  }
});

module.exports = router;
