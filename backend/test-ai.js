require('dotenv').config();
const { analyzeImage } = require('./services/aiImageAnalysisService');

async function test() {
  try {
    const result = await analyzeImage('https://res.cloudinary.com/racerjru/image/upload/v1727608620/h4xrf5uam5mly3t4n4z6.jpg');
    console.log("Success:", result);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

test();
