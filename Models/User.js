const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { decrypt } = require('dotenv');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please add a name']
    },
    email: {
        type: String,
        required:[true,'please add a email'],
        unique:[true,'email already exists'],
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please add a valid email",
        ],
      },
    role:{
        type:String,
        enum:['user','publisher'],
        default:'user'
    },
    password:{
        type:String,
        select:false,
        minlength:6,
        required:[true,'please add a password']
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
    createdAt:{
        type:Date,
        default:Date.now,

    }
    
})


UserSchema.pre('save',async function(next){
    try{
        if(!this.isModified('password')){
            next();
        }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
    }
    catch(err){
        next(err)
    }
    next();
})

UserSchema.methods.getSignedJwtToken = function() {
   return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE_IN
    })
    
}

UserSchema.methods.matchPassword =async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
}

UserSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
}


module.exports = mongoose.model('User',UserSchema);