const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);

app.get('/', (req, res) => {
  res.send('Civora API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
