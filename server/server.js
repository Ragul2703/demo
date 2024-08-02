const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config(); // Initialize dotenv

const app = express();
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not set

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from 'uploads'

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define User model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } // Plain text password - Hash before storing in production
});

const User = mongoose.model('User', UserSchema);

// Define Course model
const CourseSchema = new mongoose.Schema({
  thumbnail: { type: String, required: true },
  video: { type: String, required: true },
  description: { type: String, required: true }
});

const Course = mongoose.model('Course', CourseSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid filename collisions
  }
});

const upload = multer({ storage });

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.password === password) { // Compare plain text passwords - Hash in production
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload course endpoint
app.post('/upload', upload.fields([{ name: 'thumbnail' }, { name: 'video' }]), async (req, res) => {
  const { description } = req.body;
  const thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0].path : '';
  const video = req.files['video'] ? req.files['video'][0].path : '';

  if (!description || !thumbnail || !video) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newCourse = new Course({ thumbnail, video, description });
    await newCourse.save();
    res.status(200).json({ message: 'Upload successful!' });
  } catch (err) {
    console.error('Error during course upload:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all courses endpoint
app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error retrieving courses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
