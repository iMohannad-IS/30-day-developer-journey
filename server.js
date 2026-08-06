const express = require("express");
const app = express();
const PORT = 300;

const users = [];

app.use(express.json());

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

app.post("/api/users", (req, res) => {
    const user = req.body;

    users.push(user);

    res.status(201).json({
        message: "User created successfully",
        user: user
    });
});
app.get("/api/users", (req, res) => {
    res.json(users);
});

app.put("/api/users/:index", (req, res) => {
    const index = Number(req.params.index);

    if (!users[index]) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    users[index] = req.body;

    res.json({
        message: "User updated successfully",
        user: users[index]
    });
});

app.delete("/api/users/:index", (req, res) => {
    const index = Number(req.params.index);

    if (!users[index]) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    const deletedUser = users.splice(index, 1);

    res.json({
        message: "User deleted successfully",
        user: deletedUser[0]
    });
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});