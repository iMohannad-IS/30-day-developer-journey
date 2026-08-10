require("dotenv").config();

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME;

app.get("/",(req ,res) =>{
        res.json({
          message: `Welcome to ${APP_NAME}`,
        port: PORT
    });
});

app.listen(PORT,()=>{
  console.log(`${APP_NAME} is running on http://localhost:${PORT}`);
});