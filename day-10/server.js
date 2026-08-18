const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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


app.get("/api/students", async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const { major, sort, order } = req.query;

        const offset = (page - 1) * limit;

        let query = "SELECT * FROM students";

        const params = [];

        // Filtering
        if (major) {
            query += " WHERE major = ?";
            params.push(major);
        }

        // Sorting
        const allowedSortFields = [
            "student_id",
            "name",
            "email",
            "major"
        ];

        const allowedOrders = ["asc", "desc"];

        if (sort && allowedSortFields.includes(sort)) {
            const sortOrder = allowedOrders.includes(order?.toLowerCase())
                ? order.toUpperCase()
                : "ASC";

            query += ` ORDER BY ${sort} ${sortOrder}`;
        }

        // Pagination
        query += " LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);

        res.status(200).json({
            page,
            limit,
            students: rows
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

app.post("/api/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            [email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully",
            user_id: result.insertId
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

app.post("/api/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // Compare password with hash
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
    {
        user_id: user.user_id,
        email: user.email
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1h"
    }
);

        // Login successful
       res.status(200).json({
    message: "Login successful",
    token
});

    } catch (error) {
        console.error(error);
        next(error);
    }
});


// =========================
// Authentication Middleware
// =========================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

// =========================
// Protected Route
// =========================

app.get("/api/profile", authenticateToken, (req, res) => {
    res.status(200).json({
        message: "Access granted",
        user: req.user
    });
});

// =========================
// Get All Students
// =========================



app.get("/api/students", async (req, res, next) => {
    try {
        // Get page and limit from query parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Get students
        const [rows] = await pool.query(
            `SELECT *
             FROM students
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.status(200).json({
            page: page,
            limit: limit,
            students: rows
        });

    } catch (error) {
        console.error(error);
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

app.delete("/api/students/:id", async (req, res, next) => {
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
        console.error(error);
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