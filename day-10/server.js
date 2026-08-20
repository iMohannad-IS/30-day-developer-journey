const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads"));
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

// =========================
// Test Database Connection
// =========================

app.get("/api/test-db", async (req, res, next) => {
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
// Filtering + Sorting + Pagination
// =========================

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

            const sortOrder =
                allowedOrders.includes(order?.toLowerCase())
                    ? order.toUpperCase()
                    : "ASC";

            query += ` ORDER BY ${sort} ${sortOrder}`;
        }

        // Pagination
        query += " LIMIT ? OFFSET ?";

        params.push(limit, offset);

        const [rows] = await pool.query(
            query,
            params
        );

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


// =========================
// Register
// =========================

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
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Every new registered user is a student
        const role = "student";

        // Insert user
        const [result] = await pool.query(
            "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
            [
                email,
                hashedPassword,
                role
            ]
        );

        res.status(201).json({
            message: "User registered successfully",
            user_id: result.insertId,
            role
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});


// =========================
// Login
// =========================

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

        // Create JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role
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

    // Check if token exists
    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    try {

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Save user information
        req.user = decoded;

        // Continue to next middleware
        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

app.post(
    "/api/profile/avatar",
    authenticateToken,
    (req, res, next) => {
        upload.single("avatar")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        message: "Image must be smaller than 2MB"
                    });
                }
                return res.status(400).json({
                    message: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    message: err.message
                });
            }
            next();
        });
    },
    async (req, res, next) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Avatar is required"
            });
        }

        const userId = req.user.user_id;

        await pool.query(
            "UPDATE users SET avatar = ? WHERE user_id = ?",
            [req.file.filename, userId]
        );

        const avatarUrl =
            `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.status(200).json({
            message: "Avatar uploaded successfully",
            avatar: avatarUrl
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});


// =========================
// Authorization Middleware
// =========================

const authorizeRole = (...allowedRoles) => {

    return (req, res, next) => {

        // Check user role
        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                message: "Access forbidden"
            });
        }

        next();
    };
};


// =========================
// Protected Profile Route
// =========================

app.get(
    "/api/profile",
    authenticateToken,
    (req, res) => {

        res.status(200).json({
            message: "Access granted",
            user: req.user
        });
    }
);


// =========================
// Admin Protected Route
// =========================

app.get(
    "/api/admin",
    authenticateToken,
    authorizeRole("admin"),
    (req, res) => {

        res.status(200).json({
            message: "Welcome Admin",
            user: req.user
        });
    }
);


// =========================
// Get Student By ID
// =========================

app.get("/api/students/:id", async (req, res, next) => {
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
// Admin Only
// =========================

app.delete(
    "/api/students/:id",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res, next) => {

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
    }
);


// =========================
// Update Student
// Admin Only
// =========================

app.put(
    "/api/students/:id",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res, next) => {

        try {

            const studentId = req.params.id;

            const {
                name,
                email,
                major
            } = req.body;

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
            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    }
);


// =========================
// Create Student
// Admin Only
// =========================

app.post(
    "/api/students",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res, next) => {

        try {

            const {
                name,
                email,
                major
            } = req.body;

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
            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    message: "Invalid email format"
                });
            }

            // Insert student
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
    }
);


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