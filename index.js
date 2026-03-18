import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";

import { Food } from "./models/Food.js";
import { Hotel } from "./models/Hotel.js";
import Booking from "./models/Booking.js";
import Order from "./models/Order.js";
import Bill from "./models/Bill.js";

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
    const {
      hotelName,
      email,
      password,
      address,
      city,
      state,
      hotelType,
      orderCount,
      roomCount
    } = req.body;

    let sections = [];

    if (req.body.sections) {
      try {
        sections = JSON.parse(req.body.sections);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid sections format"
        });
      }
    }

    if (!hotelName || !email || !password || !hotelType) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    if (hotelType === "hotel_with_lodging" && (!roomCount || roomCount < 1)) {
      return res.status(400).json({
        success: false,
        message: "Room count required for lodging hotels"
      });
    }

    const existingHotel = await Hotel.findOne({ email: email.toLowerCase() });

    if (existingHotel) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    let imageUrl = "";

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "hotels"
      });

      imageUrl = uploadResult.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newHotel = await Hotel.create({
      hotelName,
      email: email.toLowerCase(),
      password: hashedPassword,
      hotelType,
      address,
      city,
      state,
      sections,

      orderCount: orderCount || 0,
      roomCount: hotelType === "hotel_with_lodging" ? roomCount : undefined,

      hotelImage: imageUrl
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newHotel._id,
        hotelName: newHotel.hotelName
      }
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
        sections: hotel.sections,
        hotelType: hotel.hotelType,
        roomCount: hotel.roomCount,
        orderCount: hotel.orderCount,
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

    if (updateData.sections) {
      updateData.sections = JSON.parse(updateData.sections);
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
    const { title, desc, price, foodCategory, category, available, hotelId } = req.body;

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
      foodCategory,
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

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      })
    }

    food.available = !food.available;
    await food.save();

    res.json({ success: true, data: food });
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

    const { hotelId, tableNumber, orderType, items } = req.body;

    if (!hotelId || !tableNumber || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "Missing data"
      });
    }

    let booking;

    // ✅ ROOM ORDER
    if (orderType === "room") {

      booking = await Booking.findOne({
        hotelId,
        number: tableNumber,
        orderType: "room",
        status: "active"
      });

      if (!booking) {
        return res.json({
          success: false,
          message: "Room not logged in"
        });
      }

    }

    // ✅ TABLE ORDER
    else {

      booking = await Booking.findOne({
        hotelId,
        number: tableNumber,
        orderType: "table",
        status: "active"
      });

      if (!booking) {
        booking = new Booking({
          hotelId,
          orderType: "table",
          number: tableNumber,
          orders: [],
          totalAmount: 0,
          status: "active"
        });
      }

    }

    // ✅ ADD ITEMS
    items.forEach(item => {

      const price = Number(item.price);
      const qty = Number(item.quantity);

      booking.orders.push({
        foodId: item.foodId,
        title: item.title,
        price: price,
        quantity: qty,
        delivered: false,
        orderedAt: new Date()
      });

      booking.totalAmount += price * qty;

    });

    await booking.save();

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {

    console.log("Booking Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});


// GET BOOKINGS BY HOTEL
app.get("/api/bookings/hotel/:hotelId", async (req, res) => {
  try {

    const { type } = req.query;

    let filter = {
      hotelId: req.params.hotelId,
      status: "active"
    };

    if (type === "room") {
      filter.orderType = "room";
    }

    if (type === "table") {
      filter.orderType = "table";
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/bookings/table/:hotelId/:tableNumber", async (req, res) => {
  try {

    const bookings = await Booking.find({
      hotelId: req.params.hotelId,
      number: req.params.tableNumber,
      orderType: "table",
      status: "active"
    });

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/bookings/kot/:hotelId", async (req, res) => {
  try {

    const bookings = await Booking.find({
      hotelId: req.params.hotelId,
      status: "active",
      kotSent: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.put("/api/bookings/remove-item/:bookingId", async (req, res) => {
  try {
    const { foodId } = req.body;

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const item = booking.orders.find(
      (o) => String(o.foodId) === String(foodId)
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // ✅ IF QUANTITY MORE THAN 1 → REDUCE ONLY 1
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      // ✅ IF ONLY 1 → REMOVE ITEM COMPLETELY
      booking.orders = booking.orders.filter(
        (o) => String(o.foodId) !== String(foodId)
      );
    }

    // ✅ RECALCULATE TOTAL PROPERLY
    booking.totalAmount = booking.orders.reduce(
      (sum, order) =>
        sum + Number(order.price) * Number(order.quantity),
      0
    );

    // ✅ If no items left → mark completed
    if (booking.orders.length === 0) {
      booking.status = "completed";
    }

    await booking.save();

    res.json({ success: true, data: booking });

  } catch (error) {
    console.log("Remove Item Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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

app.put("/api/bookings/update-quantity/:bookingId", async (req, res) => {
  try {
    const { foodId, action } = req.body; // action: "increase" or "decrease"

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false });
    }

    const item = booking.orders.find(
      (o) => String(o.foodId) === String(foodId)
    );

    if (!item) {
      return res.status(404).json({ success: false });
    }

    if (action === "increase") {
      item.quantity += 1;
    }

    if (action === "decrease") {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        booking.orders = booking.orders.filter(
          (o) => String(o.foodId) !== String(foodId)
        );
      }
    }

    // Recalculate total
    booking.totalAmount = booking.orders.reduce(
      (sum, order) =>
        sum + Number(order.price) * Number(order.quantity),
      0
    );

    if (booking.orders.length === 0) {
      booking.status = "completed";
    }

    await booking.save();

    res.json({ success: true, data: booking });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

app.put("/api/bookings/deliver-item/:bookingId", async (req, res) => {

  try {

    const { orderItemId } = req.body;

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false });
    }

    const item = booking.orders.id(orderItemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found"
      });
    }

    item.delivered = true;

    await booking.save();

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });

  }

});

app.post("/api/bookings/manual-add", async (req, res) => {

  try {

    const { hotelId, tableNumber, roomNumber, orderType, items } = req.body;

    const number = orderType === "room" ? roomNumber : tableNumber;

    let booking = await Booking.findOne({
      hotelId,
      number,
      orderType,
      status: "active"
    });

    if (!booking) {

      booking = new Booking({

        hotelId,

        orderType,
        number,

        orders: [],
        totalAmount: 0,
        status: "active"

      });

    }

    items.forEach((item) => {

      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      
      booking.orders.push({
      foodId: item.foodId,
      title: item.title,
      price: price,
      quantity: qty,
      delivered: false,
      orderedAt: new Date()
      });
      
      booking.totalAmount = Number(booking.totalAmount || 0) + (price * qty);
      
      });

    await booking.save();

    res.json({ success: true, data: booking });

  } catch (error) {

    console.log("Manual Add Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

app.put("/api/bookings/shift-table", async (req, res) => {

  try {

    let { hotelId, fromTable, toTable } = req.body;

    if (!hotelId || !fromTable || !toTable) {
      return res.json({ success: false, message: "Missing data" });
    }

    // make case insensitive
    fromTable = fromTable.toUpperCase();
    toTable = toTable.toUpperCase();

    // check if target table already has active booking
    const existing = await Booking.findOne({
      hotelId,
      number: toTable,
      orderType: "table",
      status: "active"
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Table already occupied"
      });
    }

    const bookings = await Booking.find({
      hotelId,
      number: fromTable,
      orderType: "table",
      status: "active"
    });

    if (bookings.length === 0) {
      return res.json({
        success: false,
        message: "No active orders"
      });
    }

    for (let booking of bookings) {
      booking.number = toTable;
      await booking.save();
    }

    res.json({
      success: true,
      message: "Orders shifted successfully"
    });

  } catch (err) {

    console.error(err);
    res.json({ success: false });

  }

});

app.put("/api/bookings/send-kot/:bookingId", async (req, res) => {

  try {

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.json({ success: false });
    }

    booking.kotSent = true;

    await booking.save();

    res.json({
      success: true,
      data: booking
    });

  } catch (err) {

    console.error(err);
    res.json({ success: false });

  }

});

app.post("/api/orders/complete-table", async (req, res) => {

  try {

    const { hotelId, tableNumber, paymentMethod } = req.body;

    const bookings = await Booking.find({
      hotelId,
      number: tableNumber,
      orderType: "table",
      status: "active"
    });

    if (!bookings.length) {
      return res.json({ success: false, message: "No orders found" });
    }

    // collect all items
    const items = bookings.flatMap(b => b.orders);

    let subtotal = 0;

    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const gst = subtotal * 0.05;
    const totalAmount = subtotal + gst;

    // generate bill number
    const billNo = "BILL-" + Date.now();

    const order = await Order.create({

      hotelId,
      billNo,

      items: items.map(i => ({
        foodId: i.foodId,
        title: i.title,
        price: i.price,
        quantity: i.quantity
      })),

      subtotal,
      gst,
      totalAmount,
      paymentMethod

    });

    // delete bookings after bill
    await Booking.deleteMany({
      hotelId,
      number: tableNumber,
      orderType: "table"
    });

    res.json({
      success: true,
      order,
      tableNumber
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });

  }
});

app.get("/api/rooms/hotel/:hotelId", async (req, res) => {

  const bookings = await Booking.find({
    hotelId: req.params.hotelId,
    orderType: "room",
    status: "active"
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: bookings
  });

});

app.post("/api/bookings/room-login", async (req, res) => {

  const { hotelId, roomNumber, customerName, age, personCount } = req.body;

  try {

    const room = new Booking({

      hotelId,
      number: roomNumber,
      customerName,
      age,
      personCount,
    
      orderType: "room",
      status: "active",
    
      orders: [],        
      totalAmount: 0,      
    
      checkInTime: new Date()
    
    });

    await room.save();

    res.json({ success: true, data: room });

  } catch (err) {
    res.json({ success: false });
  }

});


app.post("/api/bookings/room-checkout", async (req, res) => {

  const { hotelId, roomNumber, paymentMethod } = req.body;

  try {

    const bookings = await Booking.find({
      hotelId,
      number: roomNumber,
      orderType: "room",
      status: "active"
    });

    if (bookings.length === 0) {
      return res.json({ success: false });
    }

    const loginBooking = bookings.find(b => b.checkInTime);

    const checkoutTime = new Date();
    const checkInTime = new Date(loginBooking.checkInTime);

    const hours = (checkoutTime - checkInTime) / (1000 * 60 * 60);
    const stayDays = Math.max(1, Math.ceil(hours / 24));

    const roomRate = 400;
    const roomTotal = stayDays * roomRate;

    let foodItems = [];
    let foodTotal = 0;

    bookings.forEach(b => {
      (b.orders || []).forEach(i => {
        foodItems.push(i);
        foodTotal += Number(i.price) * Number(i.quantity);
      });
    });

    const gst = Number(((roomTotal + foodTotal) * 0.05).toFixed(2));
    const total = roomTotal + foodTotal + gst;

    const lastBill = await Bill.findOne({ hotelId }).sort({ billNo: -1 });
    const billNo = lastBill ? lastBill.billNo + 1 : 1;

    const bill = new Bill({

      hotelId,
      billNo,
      roomNumber,

      customerName: loginBooking.customerName,
      personCount: loginBooking.personCount,

      checkInTime,
      checkOutTime: checkoutTime,

      stayDays,
      roomTotal,
      foodTotal,
      gst,
      total,

      paymentMethod,

      foodItems

    });

    await bill.save();

    await Booking.deleteMany({
      hotelId,
      number: roomNumber,
      orderType: "room"
    });

    res.json({ success: true, bill });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }

});

app.post("/api/bookings/generate-room-bill", async (req, res) => {

  const { hotelId, roomNumber } = req.body;

  try {

    const booking = await Booking.findOne({
      hotelId,
      number: roomNumber,
      orderType: "room",
      status: "active"
    });

    if (!booking) {
      return res.json({ success: false });
    }

    const checkoutTime = new Date();
    const checkInTime = new Date(booking.checkInTime);

    const hours = (checkoutTime - checkInTime) / (1000 * 60 * 60);
    const stayDays = Math.max(1, Math.ceil(hours / 24));

    const roomRate = 400;
    const roomTotal = stayDays * roomRate;

    let foodTotal = (booking.orders || []).reduce(
      (sum, i) => sum + Number(i.price) * Number(i.quantity),
      0
    );

    const gst = Number(((roomTotal + foodTotal) * 0.05).toFixed(2));
    const total = roomTotal + foodTotal + gst;

    const bill = {
      roomNumber,
      customerName: booking.customerName,
      personCount: booking.personCount,
      checkInTime,
      checkOutTime: checkoutTime,
      stayDays,
      roomTotal,
      foodTotal,
      gst,
      total,
      foodItems: booking.orders
    };

    res.json({ success: true, bill });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }

});

app.put("/api/bookings/shift-to-room", async (req, res) => {
  try {

    const { hotelId, tableNumber, roomNumber } = req.body;

    if (!hotelId || !tableNumber || !roomNumber) {
      return res.json({ success: false, message: "Missing data" });
    }

    // ✅ FIND TABLE BOOKINGS
    const tableBookings = await Booking.find({
      hotelId,
      number: tableNumber,
      orderType: "table",
      status: "active"
    });

    if (tableBookings.length === 0) {
      return res.json({
        success: false,
        message: "No table orders found"
      });
    }

    // ✅ FIND ROOM (MUST BE LOGGED IN)
    const roomBooking = await Booking.findOne({
      hotelId,
      number: roomNumber,
      orderType: "room",
      status: "active",
      checkInTime: { $exists: true }
    });

    if (!roomBooking) {
      return res.json({
        success: false,
        message: "Room not logged in"
      });
    }

    // ✅ MOVE ITEMS
    tableBookings.forEach(tb => {
      tb.orders.forEach(item => {
        roomBooking.orders.push({
          foodId: item.foodId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          delivered: item.delivered,
          orderedAt: item.orderedAt
        });
      });

      roomBooking.totalAmount += tb.totalAmount || 0;
    });

    await roomBooking.save();

    // ✅ COMPLETE TABLE
    await Booking.updateMany(
      {
        hotelId,
        number: tableNumber,
        orderType: "table",
        status: "active"
      },
      {
        $set: { status: "completed" }
      }
    );

    res.json({
      success: true,
      message: "Shifted to room successfully"
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

/* =================================
  ✅ START SERVER (ALWAYS LAST)
================================= */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
