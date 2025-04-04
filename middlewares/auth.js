const User=require('../models/userModel');
const jwt=require('jsonwebtoken')

const auth=async(req,res,next)=>{
    try{
        const token= req.cookies.token;
        // console.log('token: ',req.cookies.token);
        
        if(!token){
        return res.status(400).json({msg:"token not found!",err:err.message});
        }

        const decodedtoken=jwt.verify(token,process.env.JWT_SECRET);
        // console.log(decodedtoken);
        
        if(!decodedtoken){
            return res.status(400).json({msg:"token not found!",err:err.message});
        }

        //here it gives the _id to all of the populate 
        const user=await User.findById(decodedtoken.token)
        .populate('followers')
        .populate('threads')
        .populate('replies')
        .populate('reposts')

        if(!user){
        return res.status(400).json({msg:"No user found!",err:err.message});
        }

        req.user=user;
        next();


    }catch(err){
        return res.status(400).json({msg:"authentication failed!,please Login",err:err.message});
    }
}

module.exports=auth;