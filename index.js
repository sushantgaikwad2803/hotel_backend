import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";

import { Food } from "./models/Food.js";
import { Cart } from "./models/CartSchema.js";
import { Hotel } from "./models/Hotel.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 1000;

/* =================================
   ✅ MIDDLEWARE
================================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =================================
   ✅ DATABASE CONNECTION
================================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

/* =================================
   ✅ CLOUDINARY CONFIG
================================= */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/* =================================
   ✅ MULTER CONFIG
================================= */
const upload = multer({ dest: "uploads/" });

/* =================================
   ✅ TEST ROUTE
================================= */
app.get("/", (req, res) => {
  res.json({ message: "🔥 Server running successfully..." });
});

/* =================================
   ✅ HOTEL ROUTES
================================= */

// REGISTER HOTEL
app.post("/api/hotel/signup", upload.single("hotelImage"), async (req, res) => {
  try {
    const { hotelName, email, password, address, city, state, tableCount } = req.body;

    if (!hotelName || !email || !password) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const existingHotel = await Hotel.findOne({ email: email.toLowerCase() });
    if (existingHotel) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    let imageUrl = "";
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: "hotels" });
      imageUrl = uploadResult.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newHotel = await Hotel.create({
      hotelName,
      email: email.toLowerCase(),
      password: hashedPassword,
      address,
      city,
      state,
      tableCount: Number(tableCount) || 1,
      hotelImage: imageUrl,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newHotel._id,
        hotelName: newHotel.hotelName,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LOGIN HOTEL
app.post("/api/hotel/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hotel = await Hotel.findOne({ email: email.toLowerCase() });
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const isMatch = await bcrypt.compare(password, hotel.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      data: {
        _id: hotel._id,
        hotelName: hotel.hotelName,
        email: hotel.email,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state,
        tableCount: hotel.tableCount,
        hotelImage: hotel.hotelImage,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET ALL HOTELS
app.get("/api/hotels", async (req, res) => {
  try {
    const hotels = await Hotel.find().select("-password");
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE HOTEL
app.get("/api/hotels/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select("-password");
    if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });

    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE HOTEL
app.put("/api/hotel/:id", upload.single("hotelImage"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.tableCount) {
      updateData.tableCount = Number(updateData.tableCount);
    }

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: "hotels" });
      updateData.hotelImage = uploadResult.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({ success: true, data: updatedHotel });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =================================
   ✅ FOOD ROUTES
================================= */

// CREATE FOOD
app.post("/api/food", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, price, rating, category, available, hotelId } = req.body;

    if (!req.file || !hotelId) {
      return res.status(400).json({ success: false, message: "Image & Hotel ID required" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: "foods" });
    fs.unlinkSync(req.file.path);

    const newFood = await Food.create({
      hotel: hotelId,
      image: uploadResult.secure_url,
      title,
      desc,
      price,
      rating,
      category,
      available,
    });

    res.status(201).json({ success: true, data: newFood });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET FOODS BY HOTEL
app.get("/api/food/hotel/:hotelId", async (req, res) => {
  try {
    const foods = await Food.find({ hotel: req.params.hotelId });
    res.json({ success: true, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE FOOD
app.delete("/api/food/:id", async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Food deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TOGGLE AVAILABILITY
app.put("/api/food/:id/toggle", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    food.available = !food.available;
    await food.save();

    res.json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =================================
   ✅ CART ROUTE
================================= */

app.post("/api/cart", async (req, res) => {
  try {
    const { table, items } = req.body;
    const data = await Cart.create({ table, items });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =================================
   ✅ BOOKING ROUTES
================================= */

// PLACE ORDER
app.post("/api/bookings/place-order", async (req, res) => {
  try {
    const { hotelId, tableNumber, items } = req.body;

    if (!hotelId || !tableNumber || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "Missing data"
      });
    }

    let booking = await Booking.findOne({
      hotelId,
      tableNumber,
      status: "active"
    });

    const newAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (booking) {
      // Add new items to existing booking
      items.forEach(item => {
        const existing = booking.orders.find(
          o => o.title === item.title
        );

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          booking.orders.push(item);
        }
      });

      booking.totalAmount += newAmount;
      await booking.save();

      return res.json({ success: true, data: booking });
    }

    // Create new booking
    const newBooking = await Booking.create({
      hotelId,
      tableNumber,
      orders: items,
      totalAmount: newAmount,
      status: "active"
    });

    res.json({ success: true, data: newBooking });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// GET BOOKINGS BY HOTEL
app.get("/api/bookings/:hotelId", async (req, res) => {
  try {
    const bookings = await Booking.find({
      hotelId: req.params.hotelId
    });

    res.json({ success: true, data: bookings });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// COMPLETE DINNER
app.put("/api/bookings/complete/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false });
    }

    booking.status = "completed";
    await booking.save();

    res.json({ success: true, data: booking });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

/* =================================
   ✅ START SERVER (ALWAYS LAST)
================================= */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
