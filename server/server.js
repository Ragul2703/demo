const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

dotenv.config(); // Initialize dotenv

const app = express();
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not set

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if there is a connection error
  });

// Define the User schema and model, ensuring we do not overwrite the model if it already exists
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Define the Course schema and model, ensuring we do not overwrite the model if it already exists
const courseSchema = new mongoose.Schema({
  description: String,
  thumbnailUrl: String,
  videoUrl: String,
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

app.use(cors()); // Enable CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.get("/demo", (req, res) => {
  res.send("DemoPages");
});

// User login route
app.post('/logins', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      res.status(200).json({ message: 'Login successful!' });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload course route
app.post('/upload', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { description } = req.body;
  const thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
  const video = req.files['video'] ? req.files['video'][0] : null;

  if (!description || !thumbnail || !video) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const course = new Course({
      description,
      thumbnailUrl: `http://localhost:${PORT}/uploads/${thumbnail.filename}`,
      videoUrl: `http://localhost:${PORT}/uploads/${video.filename}`,
    });

    await course.save();

    res.status(200).json({ message: 'Upload successful!' });
  } catch (error) {
    console.error('Error during course upload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses route
app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
