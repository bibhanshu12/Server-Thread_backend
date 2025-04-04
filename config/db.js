const mongoose=require("mongoose")

const connectDB=async()=>{

    await mongoose.connect(process.env.MONGO_URI);
  if(mongoose){
        console.log("DB Connected..");
    }else{
        console.log("DB Conncetion unsuccessfull");
        
    }


    

}

module.exports=connectDB;