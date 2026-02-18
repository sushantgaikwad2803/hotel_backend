import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { Food } from "./models/Food.js"; // make sure this path is correct

dotenv.config();

const app = express();
const port = 1000;

app.use(express.json());

/* ==========================
   1️⃣ MongoDB Connection
========================== */

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB connection error:", err.message));


/* ==========================
   2️⃣ Cloudinary Config
========================== */

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});


/* ==========================
   3️⃣ Multer Setup
========================== */

const upload = multer({ dest: "uploads/" });


/* ==========================
   4️⃣ Routes
========================== */

app.get("/", (req, res) => {
    res.json({ message: "🔥 Server running..." });
});


/* -------- CREATE FOOD -------- */

app.post("/api/food", upload.single("image"), async (req, res) => {
    try {
        const { title, desc, price, rating, qty, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "foods",
        });

        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        const newFood = await Food.create({
            image: result.secure_url,
            title,
            desc,
            price,
            rating,
            qty,
            category,
        });

        res.status(201).json({
            success: true,
            data: newFood,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


/* -------- GET ALL FOOD -------- */

app.get("/api/food", async (req, res) => {
    try {
        const foods = await Food.find().sort({ createdAt: -1 });
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* -------- DELETE FOOD -------- */

app.delete("/api/food/:id", async (req, res) => {
    try {
        await Food.findByIdAndDelete(req.params.id);
        res.json({ message: "Food deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* ==========================
   5️⃣ Start Server
========================== */

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
