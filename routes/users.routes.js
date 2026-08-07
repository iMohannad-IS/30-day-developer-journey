const express = require("express");

const router = express.Router();

const users = require("../data/users");

router.get("/",(req,res) => {
    res.json(users);
});

router.post("/", (req, res) => {
    const user = req.body;

    users.push(user);

    res.status(201).json({
        message: "User created successfully",
        user: user
    });
});

router.put("/:index", (req, res) => {
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

router.delete("/:index", (req, res) => {
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

module.exports=router;
