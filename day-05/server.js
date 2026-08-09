const express = require("express");
const logger = require("./middleware/logger");
const auth = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
    res.send("Hello from Day 5!");
});

app.get("/api/test", auth, (req, res) => {
        res.json({
        message: "Middleware is working!"
    });
});

app.get("/api/error",(req,res,next)=>{
    const error = new Error("This is a test error");
    next(error);
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Day 5 server is running on http://localhost:${PORT}`);
});