import mongoose from "mongoose";

const billSchema = new mongoose.Schema({

hotelId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Hotel",
required:true
},

billNo:Number,

roomNumber:String,

customerName:String,

personCount:Number,

checkInTime:Date,

checkOutTime:Date,

stayDays:Number,

roomTotal:Number,

foodItems:[
{
title:String,
price:Number,
quantity:Number
}
],

foodTotal:Number,

gst:Number,

total:Number,

paymentMethod:String,

createdAt:{
type:Date,
default:Date.now
}

});

export default mongoose.model("Bill",billSchema);