import express, { json } from "express";
import cors from "cors";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { createConnection } from "mysql2/promise";
import { body, validationResult } from "express-validator";

config();

const app = express();
app.use(json());
app.use(cors());

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "fiopawjefoiawnef9834ht89hvoiausndfoiashfeoiweiawdfshioawef";

let db;

(async () => {
    try {
        db = await createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "1234",
            database: process.env.DB_DATABASE || "simple",
        });

        console.log("Connected to MySQL server successfully!");
    } catch (error) {
        console.error("Database connection error:", error);
    }
})();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: err.message,
    });
});

app.get("/", (req, res) => {
    res.send("hello");
});

// User registration route with input validation
app.post(
    "/user/signup",
    [
        body("username")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters long"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),
        body("email").isEmail().withMessage("Invalid email address"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, full_name, phone_number, age, email } =
            req.body;

        try {
            if (!db) {
                return res
                    .status(500)
                    .json({ message: "Database connection failed." });
            }

            const [existingUsers] = await db.execute(
                "SELECT * FROM users WHERE username = ? OR email = ?",
                [username, email]
            );

            if (existingUsers.length > 0) {
                return res
                    .status(400)
                    .json({ message: "Username or email already exists." });
            }

            const hashedPassword = await hash(password, 12);

            const [result] = await db.execute(
                "INSERT INTO users (username, password, full_name, phone_number, age, email) VALUES (?, ?, ?, ?, ?, ?)",
                [username, hashedPassword, full_name, phone_number, age, email]
            );

            const userId = result.insertId;

            const token = jwt.sign(
                { userId: userId, username: username },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.status(201).json({
                message: "User registered successfully!",
                userId: userId,
                token: token,
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({
                message: "Failed to register user.",
                error: error.message,
            });
        }
    }
);

// User login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "Username and password are required." });
    }

    try {
        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [users] = await db.execute(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (users.length === 0) {
            return res
                .status(401)
                .json({ message: "Invalid username or password." }); 
        }

        const user = users[0];

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return res
                .status(401)
                .json({ message: "Invalid username or password." }); 
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful!",
            token: token,
            userId: user.id,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Failed to login.",
            error: error.message,
        });
    }
});

app.listen(3000, () => {
    console.log("listening in port 3000");
});
