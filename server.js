
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
app.get('/payment-methods', async (req, res) => {
  try {
    let methods = await PaymentMethod.findOne();
    if (!methods) {
      methods = new PaymentMethod();
      await methods.save();
    }
    res.json(methods);
  } catch (err) {
    console.error('GET /payment-methods error:', err);
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// ✅ Unified PUT /payment-methods (removed duplicate)
app.put('/payment-methods', async (req, res) => {
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
// Add GET /users route to return an empty array or user list
app.get('/users', async (req, res) => {
  // TODO: Replace with actual user fetching logic if needed
  res.json([]);
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

