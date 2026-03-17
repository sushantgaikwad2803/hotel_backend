import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
    sectionName: {
        type: String,
        required: true
    },
    tableCount: {
        type: Number,
        required: true,
        min: 1,
        max: 200
    }
});

const hotelSchema = new mongoose.Schema({
    hotelName: { 
        type: String, 
        required: true, 
        trim: true 
    },

    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
    },

    password: { 
        type: String, 
        required: true 
    },

    hotelType: {
        type: String,
        required: true,
        enum: ["hotel_only", "hotel_with_lodging"]
    },

    address: { 
        type: String, 
        required: true 
    },

    city: { 
        type: String, 
        required: true 
    },

    state: { 
        type: String, 
        required: true 
    },

    sections: [sectionSchema],

    // 🔹 Order count (not required)
    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // 🔹 Room count (required only if hotelType = hotel_with_lodging)
    roomCount: {
        type: Number,
        min: 1,
        required: function () {
            return this.hotelType === "hotel_with_lodging";
        }
    },

    hotelImage: { 
        type: String 
    }

}, { timestamps: true });

export const Hotel = mongoose.model("Hotel", hotelSchema);