// === Load environment variables first ===
require('dotenv').config();

// === Import dependencies ===
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// === Initialize Express app ===
const app = express();
app.use(express.json());
app.use(cors());

// === Configure Cloudinary ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// === Multer setup ===
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('DocuShop backend is running');
});

const User = require('./user');
const CryptoAddress = require('./CryptoAddress');
const PaymentMethod = require('./PaymentMethod');
const Product = require('./Product');
const Order = require('./Order');
const Shipping = require("./Shipping");


// ==========================
// USER ROUTES
// ==========================

// Delete product by ID
app.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Update admin login details
app.put('/users/admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    admin.email = email;
    admin.password = password; // In production, hash the password!
    await admin.save();
    res.json({ message: 'Admin login details updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User registration
app.post('/users/register', async (req, res) => {
  try {
    const { firstname, lastname, username, email, phone, password } = req.body;
    if (!firstname || !lastname || !username || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstname,
      lastname,
      username,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      status: 'active'
    });
    await user.save();
    res.json({ message: 'Registration successful', user: { id: user._id, email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account not active' });
    }
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================
// CRYPTO ADDRESS ROUTES
// ==========================

app.get('/crypto-addresses', async (req, res) => {
  try {
    let addresses = await CryptoAddress.findOne();
    if (!addresses) {
      addresses = new CryptoAddress();
      await addresses.save();
    }
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/crypto-addresses', async (req, res) => {
  try {
    const { bitcoin, ethereum, usdt } = req.body;
    let addresses = await CryptoAddress.findOne();
    if (!addresses) {
      addresses = new CryptoAddress({ bitcoin, ethereum, usdt });
    } else {
      addresses.bitcoin = bitcoin;
      addresses.ethereum = ethereum;
      addresses.usdt = usdt;
      addresses.updatedAt = Date.now();
    }
    await addresses.save();
    res.json({ message: 'Crypto addresses updated', addresses });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================
// ADMIN CREATION (TEMPORARY)
// ==========================
app.post('/create-admin', async (req, res) => {
  try {
    const { username = 'admin', email = 'admin@example.com', password = 'admin123' } = req.body;
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });
    await admin.save();
    res.json({ message: 'Admin user created', admin: { id: admin._id, email: admin.email, username: admin.username } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================
// PAYMENT METHODS ROUTES
// ==========================

// Get payment methods (always return one document)
// Professional GET route for all active payment methods
app.get('/api/payment-methods', async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ active: true });
    console.log('[DEBUG] GET /api/payment-methods:', methods);
    res.json(methods);
  } catch (err) {
    console.error('[ERROR] GET /api/payment-methods:', err);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// ✅ Unified PUT /payment-methods (removed duplicate)
app.put('/api/payment-methods', async (req, res) => {
  try {
    const { bank, paypal, skype, bitcoin, ethereum, usdt } = req.body;

    // --- Handle Bank ---
    if (bank) {
      let bankMethod = await PaymentMethod.findOne({ type: 'Bank' });
      if (bankMethod) {
        bankMethod.credentials = { account: bank };
        bankMethod.active = true;
        await bankMethod.save();
      } else {
        await PaymentMethod.create({
          type: 'Bank',
          credentials: { account: bank },
          active: true
        });
      }
    }

    // --- Handle PayPal ---
    if (paypal) {
      let paypalMethod = await PaymentMethod.findOne({ type: 'PayPal' });
      if (paypalMethod) {
        paypalMethod.credentials = { email: paypal };
        paypalMethod.active = true;
        await paypalMethod.save();
      } else {
        await PaymentMethod.create({
          type: 'PayPal',
          credentials: { email: paypal },
          active: true
        });
      }
    }

    // --- Handle Skype ---
    if (skype) {
      let skypeMethod = await PaymentMethod.findOne({ type: 'Skype' });
      if (skypeMethod) {
        skypeMethod.credentials = { id: skype };
        skypeMethod.active = true;
        await skypeMethod.save();
      } else {
        await PaymentMethod.create({
          type: 'Skype',
          credentials: { id: skype },
          active: true
        });
      }
    }

    // --- Handle Crypto ---
    if (bitcoin || ethereum || usdt) {
      let cryptoMethod = await PaymentMethod.findOne({ type: 'Crypto' });
      const credentials = { bitcoin, ethereum, usdt };
      if (cryptoMethod) {
        cryptoMethod.credentials = { ...(cryptoMethod.credentials || {}), ...credentials };
        cryptoMethod.active = true;
        await cryptoMethod.save();
      } else {
        await PaymentMethod.create({
          type: 'Crypto',
          credentials,
          active: true
        });
      }
    }

    res.json({ message: 'Payment methods saved/updated successfully' });
  } catch (err) {
    console.error('PUT /payment-methods error:', err);
    res.status(500).json({ error: 'Error saving payment methods' });
  }
});

// ==========================
// PRODUCT ROUTES
// ==========================
app.get('/products', async (req, res) => {
  try {
    const category = req.query.category;
    const products = category ? await Product.find({ category }) : await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Product upload with Cloudinary
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!name || !category || !price || !req.file) {
      return res.status(400).json({ error: 'Missing required fields: name, category, price, image' });
    }
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error || !result) {
        return res.status(500).json({ error: 'Image upload failed: ' + (error?.message || 'Unknown error') });
      }
      const product = new Product({
        name,
        description,
        price,
        image: result.secure_url,
        category,
        available: true
      });
      await product.save();
      return res.json({ message: 'Product created', product });
    }).end(req.file.buffer);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Serve uploaded images statically
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

// ==========================
// ORDER ROUTES
// ==========================
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email') // only return safe user fields
      .populate('products.product', 'name price'); // only return name & price

    // 🔹 Ensure fallback if product was deleted
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      products: order.products.map(p => ({
        product: p.product ? p.product._id : null,
        quantity: p.quantity,
        snapshot: p.snapshot || {
          name: p.product ? p.product.name : "Unknown (deleted)",
          price: p.product ? p.product.price : 0
        }
      }))
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { user, products, total, billingInfo, paymentAddresses, paymentMethod } = req.body;

    // 🔹 Ensure billingInfo.name is set (combine firstname + lastname if available)
    if (!billingInfo.name && billingInfo.firstname && billingInfo.lastname) {
      billingInfo.name = `${billingInfo.firstname} ${billingInfo.lastname}`;
    }

    // 🔹 Add product snapshots (name + price at order time)
    const populatedProducts = await Promise.all(
      products.map(async (p) => {
        const prod = await Product.findById(p.product);
        return {
          product: p.product,
          quantity: p.quantity,
          snapshot: {
            name: prod ? prod.name : "Unknown",
            price: prod ? prod.price : 0
          }
        };
      })
    );

    // 🔹 Save order with snapshots + billing info
    const order = new Order({
      user,
      products: populatedProducts,
      total,
      billingInfo,
      paymentAddresses,
      paymentMethod
    });

    await order.save();
    res.json({ message: "✅ Order placed successfully", order });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: "Error placing order" });
  }
});

// Cancel order endpoint
app.patch('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ error: 'Error cancelling order' });
  }
});
// Add GET /users route to return an empty array or user list
app.get('/users', async (req, res) => {
  // TODO: Replace with actual user fetching logic if needed
  res.json([]);
});
// Hard delete order
app.delete('/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// === Shipping Settings Routes ===

// Get current shipping settings
app.get("/api/shipping", async (req, res) => {
  try {
    let settings = await Shipping.findOne();
    if (!settings) {
      settings = new Shipping();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shipping settings
app.put("/api/shipping", async (req, res) => {
  try {
    let settings = await Shipping.findOne();
    if (!settings) {
      settings = new Shipping();
    }
    settings.method = req.body.method;
    settings.cost = req.body.cost;
    settings.estimatedDelivery = req.body.estimatedDelivery;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// SERVER START
// ==========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

if (!PORT || !MONGO_URI || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });









