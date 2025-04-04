const express= require('express');
const dotenv=require("dotenv")
const connectDB=require('./config/db');
const router = require('./routes');
const cors=require('cors')
const rateLimit = require('express-rate-limit');
const cookieParser = require("cookie-parser");
const helmet = require('helmet');


dotenv.config();
const app =express();
const port=3000;
 app.use(helmet());
app.use(cors({
  origin: 'https://threads.bibhanshu.tech', // Replace with your frontend URL
  credentials:true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

connectDB();
app.use(express.json());

app.use(cookieParser());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', apiLimiter);

app.use('/api',router) 

 



app.listen(port,()=>{
    console.log(`Server is listening on port: ${port}`)
});

