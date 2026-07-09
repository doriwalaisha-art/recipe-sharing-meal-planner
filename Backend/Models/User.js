const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name : {
        type : String ,
        required : true 
    },

    email : {
        type : String , 
        required : true,
        unique : true
    },

    password : {
        type : String,
        required : true
    },

    profileImage : {
        type : String,
        default : 'https://via.placeholder.com/150',
    },

    bio : {
        type : String,
        default : ''
    },

    createdAt : {
        type : Date,
        default : Date.now
    }
});

module.exports = mongoose.model('User',userSchema);