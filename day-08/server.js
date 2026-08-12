const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// MySQL Connection Pool
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

// Test Database Connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS connected");

        res.json({
            message: "Database connected successfully",
            result: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

app.get("/api/students", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM students"
        );

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch students"
        });
    }
});

app.get("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [rows] = await pool.query(
            "SELECT * FROM students WHERE student_id = ?",
            [studentId]
        );

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch student"
        });
    }
});

app.post("/api/students", async (req, res) => {
    try {
        const { name, email, major } = req.body;

        const [result] = await pool.query(
            "INSERT INTO students (name, email, major) VALUES (?, ?, ?)",
            [name, email, major]
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

app.delete("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM students WHERE student_id = ?",
            [studentId]
        );

        res.json({
            message: "Student deleted successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete student"
        });
    }
});

app.put("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const { name, email, major } = req.body;

        const [result] = await pool.query(
            `UPDATE students
             SET name = ?, email = ?, major = ?
             WHERE student_id = ?`,
            [name, email, major, studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message: "Student updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update student"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Day8-Backend is running on http://localhost:${PORT}`);
});