// import express from "express";
// import mongoose from "mongoose";
// import multer from "multer";
// import dotenv from "dotenv";
// import fs from "fs";
// import cors from "cors";
// import { v2 as cloudinary } from "cloudinary";
// import { Food } from "./models/Food.js";
// import { Cart } from "./models/CartSchema.js";
// import bcrypt from "bcryptjs";
// import { Hotel } from "./models/Hotel.js";

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 1000;

// /* ==========================
//    ✅ MIDDLEWARE
// ========================== */

// // CORS (Express 5 Safe)
// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type"],
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ==========================
//    ✅ DATABASE CONNECTION
// ========================== */

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => console.log("❌ MongoDB Error:", err.message));

// /* ==========================
//    ✅ CLOUDINARY CONFIG
// ========================== */

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_API_KEY,
//   api_secret: process.env.CLOUD_API_SECRET,
// });

// /* ==========================
//    ✅ MULTER CONFIG
// ========================== */

// const upload = multer({
//   dest: "uploads/",
// });

// /* ==========================
//    ✅ ROUTES
// ========================== */

// // Test Route
// app.get("/", (req, res) => {
//   res.json({ message: "🔥 Server running successfully..." });
// });

// /* ==========================
//    ✅ CREATE FOOD
// ========================== */

// app.post("/api/food", upload.single("image"), async (req, res) => {
//   try {
//     console.log("BODY:", req.body);
//     console.log("HOTEL ID RECEIVED:", req.body.hotelId);

//     const { title, desc, price, rating, available, category, hotelId } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: "Image is required" });
//     }

//     if (!hotelId) {
//       return res.status(400).json({ message: "Hotel ID is required" });
//     }

//     // Upload image to Cloudinary
//     const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//       folder: "foods",
//     });

//     fs.unlinkSync(req.file.path);

//     const newFood = await Food.create({
//       hotel: hotelId,   // ✅ FIXED
//       image: uploadResult.secure_url,
//       title,
//       desc,
//       price,
//       rating,
//       category,
//       available,
//     });
    

//     res.status(201).json({
//       success: true,
//       data: newFood,
//     });

//   } catch (error) {
//     console.error("CREATE FOOD ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// /* ==========================
//    ✅ GET ALL FOOD
// ========================== */

// // Get foods by hotel
// app.get("/api/food/hotel/:hotelId", async (req, res) => {
//   try {
//     const foods = await Food.find({ hotel: req.params.hotelId });
//     res.json({ success: true, foods });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });


// /* ==========================
//    ✅ DELETE FOOD
// ========================== */

// app.delete("/api/food/:id", async (req, res) => {
//   try {
//     await Food.findByIdAndDelete(req.params.id);
//     res.json({ message: "Food deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


// // Toggle food availability
// app.put("/api/food/:id/toggle", async (req, res) => {
//   try {
//     const food = await Food.findById(req.params.id);
//     if (!food) {
//       return res.status(404).json({ success: false, message: "Food not found" });
//     }

//     // Toggle available
//     food.available = !food.available;
//     await food.save();

//     res.json({ success: true, data: food });
//   } catch (error) {
//     console.error("TOGGLE FOOD ERROR:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });



// /* ==========================
//    ✅ START SERVER
// ========================== */

// app.post("/api/cart", async (req, res) => {
//     const { table, items } = req.body
//     if (!table || !items) {
//         return res.json({ message: "all fields are required ", success: false })
//     }
//     const data = await Cart.create({ table, items });
//     res.json({ data })
// })

// app.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });


// /* ==========================
//    ✅ HOTEL REGISTRATION API
// ========================== */

// app.post("/api/hotel/signup", upload.single("hotelImage"), async (req, res) => {
//   try {
//     // 1. Extract data from body
//     const { hotelName, email, password, address, city, state, tableCount } = req.body;

//     // 2. Validation Check (Prevents the 'toLowerCase' crash)
//     if (!hotelName || !email || !password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Required fields (hotelName, email, password) are missing." 
//       });
//     }

//     // 3. Check if hotel already exists
//     const existingHotel = await Hotel.findOne({ email: email.toLowerCase() });
//     if (existingHotel) {
//       return res.status(400).json({ success: false, message: "Email already registered" });
//     }

//     // 4. Handle Image Upload
//     let imageUrl = "";
//     if (req.file) {
//       const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//         folder: "hotels",
//       });
//       imageUrl = uploadResult.secure_url;
//       fs.unlinkSync(req.file.path); 
//     }

//     // 5. Secure Password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // 6. Save to Database
//     const newHotel = await Hotel.create({
//       hotelName,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       address,
//       city,
//       state,
//       tableCount: Number(tableCount) || 1,
//       hotelImage: imageUrl,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Hotel registered successfully!",
//       data: { id: newHotel._id, hotelName: newHotel.hotelName },
//     });
//   } catch (error) {
//     console.error("HOTEL SIGNUP ERROR:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// });


// /* ==========================
//    ✅ GET ALL HOTELS
// ========================== */

// app.get("/api/hotels", async (req, res) => {
//   try {
//     // Find all hotels but don't send the password field for security
//     const hotels = await Hotel.find().select("-password").sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       count: hotels.length,
//       data: hotels
//     });
//   } catch (error) {
//     console.error("GET HOTELS ERROR:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });


// app.put("/api/hotel/:id", upload.single("hotelImage"), async (req, res) => {
//   try {
//     const hotelId = req.params.id;
//     const updateData = { ...req.body };

//     // Convert tableCount to number
//     if (updateData.tableCount) {
//       updateData.tableCount = Number(updateData.tableCount);
//     }

//     // Handle new image if uploaded
//     if (req.file) {
//       const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//         folder: "hotels",
//       });
//       updateData.hotelImage = uploadResult.secure_url;
//       fs.unlinkSync(req.file.path);
//     }

//     // Update hotel
//     const updatedHotel = await Hotel.findByIdAndUpdate(
//       hotelId,
//       updateData,
//       { new: true } // return updated document
//     ).select("-password");

//     if (!updatedHotel) {
//       return res.status(404).json({ success: false, message: "Hotel not found" });
//     }

//     res.json({ success: true, data: updatedHotel });

//   } catch (error) {
//     console.error("UPDATE HOTEL ERROR:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });



// /* ==========================
//     ✅ HOTEL LOGIN API
// ========================== */
// app.post("/api/hotel/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: "Email and password are required" });
//     }

//     // 1. Find the hotel
//     const hotel = await Hotel.findOne({ email: email.toLowerCase() });
//     if (!hotel) {
//       return res.status(404).json({ success: false, message: "Hotel not found" });
//     }

//     // 2. Compare hashed password
//     const isMatch = await bcrypt.compare(password, hotel.password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Invalid credentials" });
//     }

//     // 3. Send back hotel data
//     res.status(200).json({
//       success: true,
//       message: `Welcome back, ${hotel.hotelName}!`,
//       data: {
//         _id: hotel._id,   // 🔥 change here
//         hotelName: hotel.hotelName,
//         email: hotel.email,
//         address: hotel.address,
//         city: hotel.city,
//         state: hotel.state,
//         tableCount: hotel.tableCount,
//         hotelImage: hotel.hotelImage
//       }
      
//     });

//   } catch (error) {
//     console.error("LOGIN ERROR:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// });

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
   ✅ START SERVER (ALWAYS LAST)
================================= */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
