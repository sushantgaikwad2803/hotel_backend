import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    image: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    // qty: { type: String, default: "1" },
    category: { type: String },
    available: {type:Boolean , default: true },
}, { timestamps: true });

export const Food = mongoose.model("Food", foodSchema);
