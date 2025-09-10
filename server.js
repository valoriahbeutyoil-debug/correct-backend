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
    // Find admin user
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
      status: 'active' // Ensure user is active on registration
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

// Get crypto addresses
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

// Update crypto addresses
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

// TEMPORARY: Create admin user route (remove after use)
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
// === Payment Methods Routes ===

// Get all payment methods
app.get('/payment-methods', async (req, res) => {
  try {
    const methods = await PaymentMethod.find();
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// Add new payment method
app.post('/payment-methods', async (req, res) => {
  try {
    const { type, credentials, active } = req.body;
    if (!type || !credentials) {
      return res.status(400).json({ error: 'Type and credentials are required' });
    }
    const method = new PaymentMethod({ type, credentials, active });
    await method.save();
    res.json({ message: 'Payment method added', method });
  } catch (err) {
    res.status(500).json({ error: 'Error saving payment method' });
  }
});

// Update payment method
app.put('/payment-methods/:id', async (req, res) => {
  try {
    const { type, credentials, active } = req.body;
    const method = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      { type, credentials, active },
      { new: true }
    );
    if (!method) return res.status(404).json({ error: 'Payment method not found' });
    res.json({ message: 'Payment method updated', method });
  } catch (err) {
    res.status(500).json({ error: 'Error updating payment method' });
  }
});

// Delete payment method
app.delete('/payment-methods/:id', async (req, res) => {
  try {
    const deleted = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Payment method not found' });
    res.json({ message: 'Payment method deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting payment method' });
  }
});

// --- Product Routes ---
const Product = require('./Product');

// Get all products
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
    // Upload image to Cloudinary
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error || !result) {
        return res.status(500).json({ error: 'Image upload failed: ' + (error?.message || 'Unknown error') });
      }
      // Save product to MongoDB
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

// --- Order Routes ---
const Order = require('./Order');
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { user, products, total, billingInfo, paymentAddresses } = req.body;
    const order = new Order({ user, products, total, billingInfo, paymentAddresses });
    await order.save();
    res.json({ message: 'Order placed', order });
  } catch (err) {
    res.status(500).json({ error: 'Error placing order' });
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

