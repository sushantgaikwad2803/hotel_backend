import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  foodId: String,
  title: String,
  price: Number,
  quantity: Number,
  delivered: {
    type: Boolean,
    default: false
  },
  orderedAt: {
    type: Date,
    default: Date.now
  }
});

const bookingSchema = new mongoose.Schema(
{
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true
  },

  tableNumber: {
    type: String,
    required: true
  },

  orders: [orderSchema],

  totalAmount: Number,

  status: {
    type: String,
    default: "active"
  },

  kotSent: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);



// ✅ INDEXES (important for performance)
bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, tableNumber: 1 });
bookingSchema.index({ hotelId: 1, kotSent: 1 });



export default mongoose.model("Booking", bookingSchema);