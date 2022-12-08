const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const itemSchema = require('./itemSchema');

const lineItemSchema = new Schema({
  qty: { type: Number, default: 1 },
  item: itemSchema
});

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lineItems: [lineItemSchema],
  isPaid: { type: Boolean, default: false } 
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);