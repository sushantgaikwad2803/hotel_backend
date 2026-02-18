// import express from "express";
// import mongoose from "mongoose";
// import multer from "multer";
// import dotenv from "dotenv";
// import fs from "fs";
// import { v2 as cloudinary } from "cloudinary";
// import { Food } from "./models/Food.js"; // make sure this path is correct
// import { Cart } from "./models/CartSchema.js";

// dotenv.config();

// const app = express();
// const port = 1000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }))

// /* ==========================
//    1️⃣ MongoDB Connection
// ========================== */

// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log("✅ MongoDB Connected"))
//     .catch((err) => console.log("❌ MongoDB connection error:", err.message));


// /* ==========================
//    2️⃣ Cloudinary Config
// ========================== */

// cloudinary.config({
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.CLOUD_API_KEY,
//     api_secret: process.env.CLOUD_API_SECRET,
// });


// /* ==========================
//    3️⃣ Multer Setup
// ========================== */

// const upload = multer({ dest: "uploads/" });


// /* ==========================
//    4️⃣ Routes
// ========================== */

// app.get("/", (req, res) => {
//     res.json({ message: "🔥 Server running..." });
// });




// /* -------- CREATE FOOD -------- */

// app.post("/api/food", upload.single("image"), async (req, res) => {
//     try {
//         const { title, desc, price, rating, qty, category } = req.body;

//         if (!req.file) {
//             return res.status(400).json({ message: "Image is required" });
//         }

//         // Upload to Cloudinary
//         const result = await cloudinary.uploader.upload(req.file.path, {
//             folder: "foods",
//         });

//         // Delete local file after upload
//         fs.unlinkSync(req.file.path);

//         const newFood = await Food.create({
//             image: result.secure_url,
//             title,
//             desc,
//             price,
//             rating,
//             qty,
//             category,
//         });

//         res.status(201).json({
//             success: true,
//             data: newFood,
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// });


// /* -------- GET ALL FOOD -------- */

// app.get("/api/food", async (req, res) => {
//     try {
//         const foods = await Food.find().sort({ createdAt: -1 });
//         res.json(foods);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// app.get("/api/food/:name", async (req, res) => {


//     const name = req.body;
//     const data = await Food.findOne({ title: name })
//     if (!data) {
//         return res.json({ message: "no data found", success: false })
//     }

//     res.json({
//         data, success: true
//     })
// })



// /* -------- DELETE FOOD -------- */

// app.delete("/api/food/:id", async (req, res) => {
//     try {
//         await Food.findByIdAndDelete(req.params.id);
//         res.json({ message: "Food deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });


// /* ==========================
//    5️⃣ Start Server
// ========================== */

// app.listen(port, () => {
//     console.log(`🚀 Server running on port ${port}`);
// });

import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { Food } from "./models/Food.js";
import { Cart } from "./models/CartSchema.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 1000;

/* ==========================
   ✅ MIDDLEWARE
========================== */

// CORS (Express 5 Safe)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==========================
   ✅ DATABASE CONNECTION
========================== */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

/* ==========================
   ✅ CLOUDINARY CONFIG
========================== */

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/* ==========================
   ✅ MULTER CONFIG
========================== */

const upload = multer({
  dest: "uploads/",
});

/* ==========================
   ✅ ROUTES
========================== */

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "🔥 Server running successfully..." });
});

/* ==========================
   ✅ CREATE FOOD
========================== */

app.post("/api/food", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, price, rating, qty, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "foods",
    });

    // Remove local file
    fs.unlinkSync(req.file.path);

    const newFood = await Food.create({
      image: uploadResult.secure_url,
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
    console.error("CREATE FOOD ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ==========================
   ✅ GET ALL FOOD
========================== */

app.get("/api/food", async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================
   ✅ GET FOOD BY TITLE
========================== */

app.get("/api/food/:name", async (req, res) => {
  try {
    const name = req.params.name;

    const food = await Food.findOne({ title: name });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    res.json({
      success: true,
      data: food,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================
   ✅ DELETE FOOD
========================== */

app.delete("/api/food/:id", async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================
   ✅ START SERVER
========================== */

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
