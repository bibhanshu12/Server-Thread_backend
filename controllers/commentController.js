const User=require('../models/userModel')
const Post=require('../models/postModel')
const Comment=require('../models/commentModel');
const {  mongoose } = require('mongoose');


 exports.addComment=async(req,res)=>{

    try{
        const {id}=req.params;
        const {content}=req.body;
        if(!id){
            return res.status(400).json({msg:"Id is required!"})
        }
        if(!content){
            return res.status(400).json({msg:"comment content required!"})
        }
        const postExists= await Post.findById(id);
        if(!postExists){
            return res.status(400).json({msg:"post not found!"})
        }
        const comment = new Comment({
            content,
            author:req.user._id,
            post:postExists._id,
        })
        
        const newComment= await comment.save(); 
        if(!newComment){
            return res.status(400).json({msg:"newComment is not saved !"})
        }
       
        await Post.findByIdAndUpdate(id,{
            $push:{comments:newComment._id},
        },{new:true})

        await  User.findByIdAndUpdate(req.user._id,{
            $push:{replies:comment._id},
        },{new:true})

        return res.status(200).json({msg:"comment done!",comment});
    }catch(err){
        return res.status(400).json({msg:"error in addComment!",err:err.message})
    }

}

exports.deleteComment=async(req,res)=>{

    try{
        const {postId,id}=req.params;
        if(!id || !postId){
            return res.status(400).json({msg:"Id and postId is required!"})
        }

        const postExists= await Post.findById(postId);
        if(!postExists){
            return res.status(400).json({msg:" no post exists!"})
        }
        const commentExists= await Comment.findById(id);

        if(!commentExists){
            return res.status(400).json({msg:" no comment exists!"})
        }

        const newId= new mongoose.Types.ObjectId(id);
        if(postExists.comments.includes(newId)){
             const id1=commentExists.author._id.toString();
             const id2=req.user._id.toString();
             if(id1!=id2){  
            return res.status(400).json({msg:" You are not authorized to delete this comment!"})
             }
             await Post.findByIdAndUpdate(postId,{
                $pull:{comments:id}
            },{new:true})
    
            await User.findByIdAndUpdate(req.user._id,{
                $pull:{replies:id}
            },{new:true});
    
            await Comment.findByIdAndDelete(id);
            return res.status(200).json({msg:"Comment deleted !"})
    
            
        }
        return res.status(201).json({msg:" This post doesn't includes the comment"})

       
       

    }catch(err){
        return res.status(400).json({msg:"failed to delete comment !"})
    }
}

