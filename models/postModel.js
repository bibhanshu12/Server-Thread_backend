const mongoose=require('mongoose')

const postModel=new mongoose.Schema({

    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
    content:{
        type:Object,  //for some text filed in post
    },
    media:{
        type:String, //for cloudinary
    },
    public_id:{
        type:String,
    },
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }],
    comments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment",
    }]

},{timestamps:true})

module.exports= mongoose.model('post',postModel);