import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    hotel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Hotel", 
        required: true 
    },
    image: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    price: { type: Number, required: true },
    FoodCategory: { type: String },
    category: { type: String },
    available: { type: Boolean, default: true },
}, { timestamps: true });

export const Food = mongoose.model("Food", foodSchema);
