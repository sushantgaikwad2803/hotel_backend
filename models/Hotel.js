import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
    hotelName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, // Should be hashed
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    tableCount: { type: Number, required: true, min: 1, max: 500 },
    hotelImage: { type: String }, // URL from Cloudinary or S3
}, { timestamps: true });

export const Hotel = mongoose.model("Hotel", hotelSchema);