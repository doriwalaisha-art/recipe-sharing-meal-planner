const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController')
const { protect } = require('../Middlewear/authMiddlewear');
const { upload } = require('../config/cloudinary');


router.get("/test", (req, res) => {
    res.send("User Route Working");
});

//loginuser
router.get("/profile/me",protect, userController.getProfile);

//another user
router.get("/profile/:id",protect,userController.getProfile);

router.put("/profile",protect,upload.single("image"),userController.updateProfile);

module.exports = router;