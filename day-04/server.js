const express = require("express");
const logger = require("./middleware/logger");
const auth = require("./middleware/auth");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
    res.send("Hello from Day 4!");
});

app.get("/api/test", auth, (req, res) => {
        res.json({
        message: "Middleware is working!"
    });
});

app.listen(PORT, () => {
    console.log(`Day 4 server is running on http://localhost:${PORT}`);
});