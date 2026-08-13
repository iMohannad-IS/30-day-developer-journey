const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.post("/api/students", async (req, res) => {
    try {
        const { name, email, major } = req.body;

        // Check required fields
        if (
            !name ||
            !email ||
            !major ||
            !name.trim() ||
            !email.trim() ||
            !major.trim()
        ) {
            return res.status(400).json({
                message: "Name, email and major are required"
            });
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        // Insert student into database
        const [result] = await pool.query(
            "INSERT INTO students (name, email, major) VALUES (?, ?, ?)",
            [name.trim(), email.trim(), major.trim()]
        );

        res.status(201).json({
            message: "Student created successfully",
            student_id: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create student"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Day 9 server is running on http://localhost:${PORT}`);
});