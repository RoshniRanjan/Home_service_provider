const mongoose=require("mongoose");
const seekerSchema=new mongoose.Schema({

    fullName:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true,
        unique:true
    },
    Address:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    confirmPassword:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
});
const Register=new mongoose.model("Seeker",seekerSchema);
module.exports=Register;

