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


// =========================
// Test Database Connection
// =========================

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT 1 AS connected"
        );

        res.json({
            message: "Database connected successfully",
            result: rows
        });

    } catch (error) {
        next(error);
    }
});


// =========================
// Get All Students
// =========================

app.get("/api/students", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM students"
        );

        res.json(rows);

    } catch (error) {
        next(error);
    }
});


// =========================
// Get Student By ID
// =========================

app.get("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [rows] = await pool.query(
            "SELECT * FROM students WHERE student_id = ?",
            [studentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        next(error);
    }
});


// =========================
// Delete Student
// =========================

app.delete("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM students WHERE student_id = ?",
            [studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student deleted successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {
        next(error);
    }
});


// =========================
// Update Student
// =========================

app.put("/api/students/:id", async (req, res, next) => {
    try {
       
        const studentId = req.params.id;
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


        // Update student

        const [result] = await pool.query(
            `UPDATE students
             SET name = ?, email = ?, major = ?
             WHERE student_id = ?`,
            [
                name.trim(),
                email.trim(),
                major.trim(),
                studentId
            ]
        );


        // Check if student exists

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        res.status(200).json({
            message: "Student updated successfully"
        });

    } catch (error) {
        next(error);
    }
});


// =========================
// Create Student
// =========================

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
            [
                name.trim(),
                email.trim(),
                major.trim()
            ]
        );


        res.status(201).json({
            message: "Student created successfully",
            student_id: result.insertId
        });

    } catch (error) {
        next(error);
    }
});


// =========================
// Error Handling Middleware
// =========================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: "Internal Server Error"
    });
});


// =========================
// Start Server
// =========================

app.listen(PORT, () => {
    console.log(
        `Day 10 server is running on http://localhost:${PORT}`
    );
});