import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    table: {
        type: String,
        required: true,
    },
    items: [
        {
            type: String,
            required: true,
        },
    ],
    status: {
        type: Boolean,
        required: true,
        default: false
    }

}, { timestamps: true });

export const Cart = mongoose.model("Cart", cartSchema);
