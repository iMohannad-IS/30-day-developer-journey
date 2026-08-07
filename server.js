const express = require("express");
const app = express();
const PORT = 300;

const usersRouter = require("./routes/users.routes");

app.use(express.json());

app.use("/api/users", usersRouter);

app.get("/",(req,res) =>{
    res.send("Hello from my first backend server!");
});

app.get("/api/profile", (req, res) => {
    res.json({
        name: "Mohannad",
        major: "Computer Information Systems",
        level: 7
    });
});


app.get("/api/users", (req, res) => {
    res.json(users);
});







app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});