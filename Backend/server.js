
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
app.use(cors());
app.use(express.json());



// test route
app.get("/", (req, res) => {
  res.send("API is running...");
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
});

