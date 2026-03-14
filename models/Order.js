import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  foodId: String,
  title: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({

  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true
  },

  billNo: {
    type: String,
    required: true,
    unique: true
  },

  items: [itemSchema],

  subtotal: Number,

  gst: Number,

  totalAmount: Number,

  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card"],
    default: "cash"
  }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);