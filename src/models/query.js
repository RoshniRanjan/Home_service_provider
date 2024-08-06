const mongoose=require("mongoose");
const inquirySchema=new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
    },
    message:{
        type:String,
        required:true
    },
    
});
const query=new mongoose.model("Inquiry",inquirySchema);
module.exports=query;

