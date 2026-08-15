const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  await Complaint.deleteMany({});
  console.log('All complaints deleted successfully!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
