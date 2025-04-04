const mongoose = require('mongoose');

const commentSchema=new mongoose.Schema({

    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    post:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"post"
    },
    content:{
        type:String,
    }

},{timestamps:true})

module.exports=mongoose.model('Comment',commentSchema);