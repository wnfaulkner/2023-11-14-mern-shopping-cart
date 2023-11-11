// models/order.js

const mongoose = require('mongoose');
const orderSchema = require('./orderSchema');
const itemSchema = require('./itemSchema');

const lineItemSchema = new Schema({
  qty: { type: Number, default: 1 }, // Set qty to 1 when new item pushed into lineItems
  item: itemSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

lineItemSchema.virtual('extPrice').get(function () {
  return this.qty * this.item.price
})

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // An order belongs to a user  
  lineItems: [lineItemSchema], // Makes sense to embed an order's line items
  isPaid: { type: Boolean, default: false }, // A user's unpaid order is their "cart"
}, {
  timestamps: true
});

orderSchema.virtual('orderTotal').get(function () {
  return this.lineItems.reduce((total, item) => total + item.extPrice, 0);
});

orderSchema.virtual('totalQty').get(function () {
  return this.lineItems.reduce((total, item) => total + item.qty, 0);
});

orderSchema.virtual('orderId').get(function () {
  return this.id.slice(-6).toUpperCase();
});

module.exports = mongoose.model('order', orderSchema);