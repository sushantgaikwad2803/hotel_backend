import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  foodId: String,
  title: String,
  price: Number,
  quantity: Number,
  delivered: Boolean,
  orderedAt: Date
});

const bookingSchema = new mongoose.Schema({

  hotelId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Hotel"
  },

  orderType:String,
  number:String,

  customerName:String,
  age:Number,
  personCount:Number,

  checkInTime:Date,

  orders:[orderSchema],

  totalAmount:Number,

  status:{
    type:String,
    default:"active"
  },

  kotSent:{
    type:Boolean,
    default:false
  }

},{timestamps:true});

export default mongoose.model("Booking", bookingSchema);