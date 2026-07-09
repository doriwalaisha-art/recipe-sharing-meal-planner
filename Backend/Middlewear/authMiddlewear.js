const jwt = require ('jsonwebtoken');
const User = require('../Models/User');

const protect = async (req,res, next) =>  {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            const decoded = jwt.verify(token.split(' ')[1],process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        }catch(error) {
            res.status(401).json({ message : 'Not authorized , token failed'})
        }
    } else {
        res.status(401).json({ message : 'no token provided '});
    }
};

const optionalProtect = async (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.error("Optional auth error:", error.message);
        }
    }
    next();
};

module.exports = { protect, optionalProtect };