const User = require ('../Models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn : '30d'});
}

exports.registerUser = async (req, res) => {
    try{
        const {name, email, password} = req.body ; 
        
        const userExists = await User.findOne({email});
        if (userExists) 
        return res.status(400).json({message : 'User already exists'});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password : hashedPassword
        });

        res.status(201).json({
            _id : user._id,
            name : user.name,
            email : user.email,
            token : generateToken(user._id)
        });
    }catch(error) {
        res.status(500).json({ message : error.message });
    }
};

exports.loginUser = async (req,res) => {
    try{
        const { email, password } =  req.body;

        const user = await User.findOne({email});
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id : user._id,
                name : user.name,
                email: user.email,
                token : generateToken(user._id)
            });
            console.log("LOGIN RESPONSE:", user);
        }else {
            res.status(401).json({ message : 'Invalid email or password'});
        }
    }catch (error) {
        res.status(500).json({ message : error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

    
        let user = await User.findOne({ email });

        if (!user) {
        
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: hashedPassword,
                profileImage: picture || 'https://via.placeholder.com/150'
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
