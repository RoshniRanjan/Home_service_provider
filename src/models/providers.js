const mongoose=require("mongoose");
const providerSchema=new mongoose.Schema({

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
    profileImage:{
      type:String,
       required:true
    },
    services:{
        type:[String],
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    confirmPassword:{
        type:String,
        required:true
    },
    preferredTiming:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
});
const member=new mongoose.model("Provider",providerSchema);
module.exports=member;

