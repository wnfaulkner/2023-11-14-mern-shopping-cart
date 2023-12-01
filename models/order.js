// models/order.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const itemSchema = require('./itemSchema');

// const orderSchema = require('./orderSchema');

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
  timestamps: true,
  toJSON: { virtuals: true }
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

// statics are callable on the model, not an instance (document)
orderSchema.statics.getCart = function(userId) {
  // 'this' is bound to the model (don't use an arrow function)
  // return the promise that resolves to a cart (the user's unpaid order)
  return this.findOneAndUpdate(
    // query
    { user: userId, isPaid: false },
    // update - in the case the order (cart) is upserted
    { user: userId },
    // upsert option creates the doc if it doesn't exist!
    { upsert: true, new: true }
  );
};

// Instance method for adding an item to a cart (unpaid order)
orderSchema.methods.addItemToCart = async function (itemId) {
  // 'this' keyword is bound to the cart (order doc)
  const cart = this;
  // Check if the item already exists in the cart
  const lineItem = cart.lineItems.find(lineItem => lineItem.item._id.equals(itemId));
  if (lineItem) {
    // It already exists, so increase the qty
    lineItem.qty += 1;
  } else {
    // Get the item from the "catalog"
    // Note how the mongoose.model method behaves as a getter when passed one arg vs. two
    const Item = mongoose.model('Item');
    const item = await Item.findById(itemId);
    // The qty of the new lineItem object being pushed in defaults to 1
    cart.lineItems.push({ item });
  }
  // return the save() method's promise
  return cart.save();
};

// Instance method to set an item's qty in the cart (will add item if does not exist)
orderSchema.methods.setItemQty = function(itemId, newQty) {
  // this keyword is bound to the cart (order doc)
  const cart = this;
  // Find the line item in the cart for the menu item
  const lineItem = cart.lineItems.find(lineItem => lineItem.item._id.equals(itemId));
  if (lineItem && newQty <= 0) {
    // Calling deleteOne(), removes itself from the cart.lineItems array
    // Note that video shows remove(), which has been removed 😀 in Mongoose v7
    lineItem.deleteOne();
  } else if (lineItem) {
    // Set the new qty - positive value is assured thanks to prev if
    lineItem.qty = newQty;
  }
  // return the save() method's promise
  return cart.save();
};

module.exports = mongoose.model('order', orderSchema);