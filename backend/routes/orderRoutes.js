const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sendOrderStatusEmail } = require('../services/emailService');

// POST /api/orders - Public customer coffee checkout
router.post('/', async (req, res) => {
  try {
    const { items, customer, deliveryMethod, preferredDeliveryDate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    if (!customer?.fullName || !customer?.phone || !customer?.county || !customer?.deliveryLocation) {
      return res.status(400).json({
        message: 'Customer full name, phone, county, and delivery location are required.'
      });
    }

    const resolvedDeliveryMethod =
      deliveryMethod || customer.deliveryMethod || 'Doorstep Delivery';

    const normalizedItems = items.map((item) => {
      const resolvedCoffeeForm =
        item.coffeeForm ||
        (item.grind === 'Unroasted Green Beans' ? 'Green Beans' : 'Roasted Beans');

      const resolvedRoast = item.roastLevel || item.grind || null;

      return {
        region: item.region || item.name || 'Kenyan Highland Lot',
        coffeeForm: resolvedCoffeeForm,
        roastLevel: resolvedCoffeeForm === 'Roasted Beans' ? resolvedRoast : null,
        packSize: item.packSize || item.size || '500g',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice ?? item.price) || 0
      };
    });

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const fee = resolvedDeliveryMethod === 'Pickup Station' ? 150 : 350;

    const lat = typeof customer.latitude === 'number' ? customer.latitude : null;
    const lng = typeof customer.longitude === 'number' ? customer.longitude : null;
    const mapsUrl =
      customer.mapsUrl ||
      (lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : '');

    const normalizedCustomer = {
      fullName: customer.fullName.trim(),
      phone: customer.phone.trim(),
      email: (customer.email || '').trim(),
      county: customer.county.trim(),
      deliveryLocation: customer.deliveryLocation.trim(),
      notes: (customer.notes || '').trim(),
      latitude: lat,
      longitude: lng,
      mapsUrl
    };

    const newOrder = new Order({
      items: normalizedItems,
      customer: normalizedCustomer,
      deliveryMethod: resolvedDeliveryMethod,
      preferredDeliveryDate: preferredDeliveryDate || '',
      subtotal,
      deliveryFee: fee,
      totalAmount: subtotal + fee
    });

    const savedOrder = await newOrder.save();
    const orderNumber =
      savedOrder.orderNumber || `KLM-${savedOrder._id.toString().slice(-6).toUpperCase()}`;

    // Send "Order Confirmed" email immediately (non-blocking)
    sendOrderStatusEmail(savedOrder, 'Confirmed');

    res.status(201).json({
      ...savedOrder.toObject(),
      orderNumber,
      order: savedOrder
    });
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

// PATCH /api/orders/:id/status - Update delivery progress & trigger customer email
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

    const previousStatus = order.status;
    order.status = status;

    if (req.user.role === 'delivery' && !order.assignedRider) {
      order.assignedRider = req.user.id;
    }

    // Stamp deliveredAt so the 2-hour review cron knows when to follow up
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      order.deliveredAt = new Date();
      order.reviewEmailSent = false;
    }

    await order.save();
    const populated = await order.populate('assignedRider', 'name phone email');

    // Notify the customer whenever the status advances
    if (status && status !== previousStatus) {
      sendOrderStatusEmail(populated, status);
    }

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
