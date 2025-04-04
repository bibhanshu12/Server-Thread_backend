const express= require('express');
const dotenv=require("dotenv")
const connectDB=require('./config/db');
const router = require('./routes');
const cors=require('cors')
const cookieParser = require("cookie-parser");


dotenv.config();
const app =express();
const port=3000;

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  credentials:true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
 
connectDB();
app.use(express.json());

app.use('/api',router) 

 



app.listen(port,()=>{
    console.log(`Server is listening on port: ${port}`)
});

