const mongoose = require('mongoose');

const COFFEE_REGIONS = [
  'Kirinyaga',
  'Nyeri',
  'Muranga',
  'Kiambu',
  'Kericho',
  'Nandi',
  'Machakos'
];

const orderItemSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      enum: COFFEE_REGIONS,
      required: true
    },
    coffeeForm: {
      type: String,
      enum: ['Roasted Beans', 'Ground Coffee'],
      required: true
    },
    roastLevel: {
      type: String,
      enum: ['Medium Roast', 'Dark Roast', null],
      default: null,
      validate: {
        validator: function (value) {
          if (this.coffeeForm === 'Roasted Beans') {
            return value === 'Medium Roast' || value === 'Dark Roast';
          }
          return true;
        },
        message: 'Roasted Beans must specify either Medium Roast or Dark Roast.'
      }
    },
    packSize: {
      type: String,
      enum: ['250g', '500g', '1kg'],
      default: '500g'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, 'Order must contain at least one coffee item.']
    },
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      mapsUrl: { type: String, default: '' },
      county: { type: String, required: true, trim: true },
      deliveryLocation: { type: String, required: true, trim: true },
      deliveryNotes: { type: String, trim: true, default: '' }
    },
    deliveryMethod: {
      type: String,
      enum: ['Doorstep Delivery', 'Pickup Station'],
      default: 'Doorstep Delivery'
    },

    deliveredAt: { type: Date, default: null },
    reviewEmailSent: { type: Boolean, default: false },

    preferredDeliveryDate: {
      type: String,
      trim: true,
      default: ''
    },
    currency: {
      type: String,
      default: 'KES'
    },
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

orderSchema.pre('validate', function () {
  if (!this.orderNumber) {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `KCN-${new Date().getFullYear()}-${randomCode}`;
  }
});

orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
