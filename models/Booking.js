import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },

  orders: [
    {
      foodId: String,
      title: String,
      price: Number,
      quantity: Number,
      orderedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  totalAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  }

}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);