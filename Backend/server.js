
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require('./Routes/authRoutes')
const recipeRoutes = require('./Routes/recipeRoutes')
const socialRoutes = require('./Routes/socialRoutes')
const userRoutes = require('./Routes/userRoutes')
const mealRoutes = require('./Routes/mealRoutes')
const aiRoutes = require('./Routes/aiRoutes')

const app = express();

// middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://recipe-sharing-meal-planner.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());



const https = require("https");
const http = require("http");

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// health endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// connect DB
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/recipes',recipeRoutes);
app.use('/api/social',socialRoutes);
app.use('/api/users',userRoutes);
app.use('/api/meals',mealRoutes);
app.use('/api/ai',aiRoutes);

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Set up self-pinging every 14 minutes to keep Render instance active
  const FOURTEEN_MINUTES = 14 * 60 * 1000;
  setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const healthUrl = `${url}/health`;
    console.log(`[Self-Ping] Pinging health endpoint: ${healthUrl}`);
    
    const client = healthUrl.startsWith("https") ? https : http;
    client.get(healthUrl, (response) => {
      console.log(`[Self-Ping] Received response with status: ${response.statusCode}`);
    }).on("error", (error) => {
      console.error(`[Self-Ping] Failed to ping health endpoint:`, error.message);
    });
  }, FOURTEEN_MINUTES);
});

