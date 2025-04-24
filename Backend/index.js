import express from "express";
import cors from "cors";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import mysql from "mysql2/promise";
import { body, validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import pkg from "request-ip";
const { getClientIp } = pkg;
import rateLimit from "express-rate-limit";
import { randomBytes } from "crypto";

config();

const app = express();
app.use(express.json());


app.use(
    cors({
        origin: "http://localhost:5173",
        methods: "GET,POST,PUT,DELETE",
        credentials: true,
    })
);

app.use(cookieParser());


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message:
        "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);


const JWT_SECRET = "fnueoauirfn4983th698hfaosidfjaosidtj9348thawofiasjdofj"


let db;
(async () => {
    try {
        db = mysql.createPool({
            host: "localhost",
            user: "root",
            password: "1234",
            database: "bank_management",
        });

        console.log("Connected to MySQL server successfully!");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
})();


const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(403)
                .json({ message: "Forbidden: Invalid token" });
        }

        req.user = decoded; // Store decoded user information in the request object
        next(); // Proceed to the next middleware or route handler
    });
};


const authenticateAdmin = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(403)
                .json({ message: "Forbidden: Invalid token" });
        }
        if (!decoded.adminId) {
            return res.status(403).json({ message: "Forbidden: Not Admin" });
        }

        req.admin = decoded; 
        next();
    });
};

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: err.message,
    });
});

app.get("/", (req, res) => {
    var clientIp = getClientIp(req);
    res.send(`Your IP Address is ${clientIp}.`);
});

// User Signup Route
app.post(
    "/user/signup",
    [
        body("username")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters long")
            .escape(),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),
        body("email")
            .isEmail()
            .withMessage("Invalid email address")
            .normalizeEmail(),
        body("transaction_pin")
            .isLength({ min: 4, max: 4 })
            .withMessage("Transaction pin must be 4 digits")
            .escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            username,
            password,
            full_name,
            phone_number,
            age,
            email,
            transaction_pin,
        } = req.body;

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
                    .status(409)
                    .json({ message: "Username or email already exists." });
            }

            const saltRounds = 12;
            const hashedPassword = await hash(password, saltRounds);

            const hashedTransactionPin = await hash(
                transaction_pin,
                saltRounds
            );

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

            const initialMoney = Math.random() * 489673497;

            const [accountInsertResult] = await db.execute(
                "INSERT INTO accounts (user_id, money, transaction_pin, number_of_transactions) VALUES (?, ?, ?, ?)",
                [userId, initialMoney, hashedTransactionPin, 0]
            );

            const accountId = accountInsertResult.insertId;

            await db.execute(
                "INSERT INTO leaderboard (user_id, money, total_transactions) VALUES (?, ?, ?)",
                [userId, initialMoney, 0]
            );

            res.cookie("token", token, {
                secure: process.env.NODE_ENV === "production", // Use HTTPS in production
                httpOnly: true, // Make the cookie accessible only by the server
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            res.status(201).json({
                message: "User registered successfully!",
                userId: userId,
                token: token,
                username: username,
                email,
                phone_number,
                age,
                full_name,
                money: initialMoney,
                accountId,
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

// User Login Route
app.post("/login", limiter, async (req, res) => {
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
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const [account] = await db.execute(
            "SELECT * FROM accounts WHERE user_id = ?",
            [user.user_id]
        );

        if (account.length === 0) {
            return res
                .status(404)
                .json({ message: "Account not found for this user." });
        }

        const token = jwt.sign(
            { userId: user.user_id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        var clientIp = getClientIp(req);
        const [loginActivity] = await db.execute(
            "INSERT INTO login_activity (user_id, device_ip) VALUES (?, ?)",
            [user.user_id, clientIp]
        );

        res.cookie("token", token, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 3600000,
            path: "/",
            sameSite: "lax",
        });

        res.status(200).json({
            message: "Login successful!",
            token: token,
            user_id: user.user_id,
            full_name: user.full_name,
            phone_number: user.phone_number,
            age: user.age,
            email: user.email,
            username: user.username,
            money: account[0].money,
            account_id: account[0].account_id,
            transaction_pin: account[0].transaction_pin,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Failed to login.",
            error: error.message,
        });
    }
});

// User Login Activity (Protected Route)
app.get("/user/loginActivity", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [loginActivity] = await db.execute(
            "SELECT * FROM login_activity WHERE user_id = ?",
            [userId]
        );

        if (loginActivity.length === 0) {
            return res
                .status(404)
                .json({ message: "No login activity found." });
        }

        res.status(200).json({
            loginActivity,
        });
    } catch (error) {
        console.error("Login activity error:", error);
        res.status(500).json({
            message: "Failed to retrieve login activity.",
            error: error.message,
        });
    }
});


app.get("/user/balance", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }
        const [balance] = await db.execute(
            "SELECT money FROM accounts WHERE user_id = ?",
            [userId]
        );

        if (balance.length === 0) {
            return res
                .status(404)
                .json({ message: "No login activity found." });
        }

        res.status(200).json({
            balance,
        });
    } catch (error) {
        console.error("Login activity error:", error);
        res.status(500).json({
            message: "Failed to retrieve login activity.",
            error: error.message,
        });
    }
});

// User Profile Route (Protected Route)
app.get("/user/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [users] = await db.execute(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = users[0];

        const [account] = await db.execute(
            "SELECT * FROM accounts WHERE user_id = ?",
            [userId]
        );
        if (account.length === 0) {
            return res
                .status(404)
                .json({ message: "Account not found for this user." });
        }

        res.status(200).json({
            ...user,
            money: account[0].money,
            account_id: account[0].account_id,
            transaction_pin: account[0].transaction_pin,
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({
            message: "Failed to retrieve profile.",
            error: error.message,
        }); 
    }
});

// Update Username Route (Protected Route)
app.post(
    "/update",
    authenticateToken,
    [
        body("newUsername")
            .isLength({ min: 3, max: 20 })
            .withMessage("Username must be between 3 and 20 characters")
            .escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { newUsername } = req.body;
        const userId = req.user.userId; //Using userId from the decoded token.

        try {
            if (!db) {
                return res
                    .status(500)
                    .json({ message: "Database connection failed." });
            }

            const [users] = await db.execute(
                "SELECT * FROM users WHERE user_id = ?",
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            const [existingUsers] = await db.execute(
                "SELECT * FROM users WHERE username = ?",
                [newUsername]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    message:
                        "New Username already taken, please choose another one",
                });
            }

            const [updatedUsers] = await db.execute(
                "UPDATE users SET username = ? WHERE user_id = ?",
                [newUsername, userId]
            );

            const newToken = jwt.sign(
                { userId: userId, username: newUsername },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", newToken, {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            return res.status(200).json({
                message: "Username Updated Successfully",
            });
        } catch (error) {
            console.error("Error updating username:", error);
            return res.status(500).json({
                message: "Error updating username",
                error: error.message,
            });
        }
    }
);

// Transaction Route 
app.post("/user/transaction", authenticateToken, async (req, res) => {
    const { money, receiverUser_id, transaction_pin, comments } = req.body;
    const userId = req.user.userId; 

    let conn;

    try {
        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }


        const [users] = await db.execute(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const [receiver] = await db.execute(
            "SELECT * FROM users WHERE user_id = ?",
            [receiverUser_id]
        );

        if (receiver.length === 0) {
            return res
                .status(404)
                .json({ message: "Receiver User not found." });
        }


        const [senderAccount] = await db.execute(
            "SELECT account_id, money, transaction_pin FROM accounts WHERE user_id = ?",
            [userId]
        );
        if (senderAccount.length === 0) {
            return res
                .status(404)
                .json({ message: "Sender Account not found." });
        }

        const senderAccountId = senderAccount[0].account_id;
        let senderBalance = senderAccount[0].money;
        const storedTransactionPin = senderAccount[0].transaction_pin;

        const [receiverAccount] = await db.execute(
            "SELECT account_id, money FROM accounts WHERE user_id = ?",
            [receiverUser_id]
        );
        if (receiverAccount.length === 0) {
            return res
                .status(404)
                .json({ message: "Receiver Account not found." });
        }

        const receiverAccountId = receiverAccount[0].account_id;
        const receiverBalance = receiverAccount[0].money;


        const validPin = await compare(transaction_pin, storedTransactionPin);

        if (!validPin) {
            return res
                .status(401)
                .json({ message: "Invalid transaction PIN." });
        }


        const MINIMUM_BALANCE = 5000;

        if (senderBalance < money) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        if (senderBalance - money < MINIMUM_BALANCE) {
            return res.status(400).json({
                message: `Minimum balance amount is ${MINIMUM_BALANCE}`,
            });
        }


        conn = await db.getConnection();
        try {
            await conn.beginTransaction();


            await conn.execute(
                "UPDATE accounts SET money = money - ? WHERE account_id = ?",
                [money, senderAccountId]
            );

            await conn.execute(
                "UPDATE accounts SET money = money + ? WHERE account_id = ?",
                [money, receiverAccountId]
            );


            await conn.execute(
                "INSERT INTO transactions (sender_user_id, receiver_user_id, amount, comments) VALUES (?, ?, ?, ?)",
                [userId, receiverUser_id, money, comments]
            );


            await conn.execute(
                "UPDATE accounts SET number_of_transactions = number_of_transactions + 1 WHERE account_id = ?",
                [senderAccountId]
            );


            const [updatedSenderAccount] = await conn.execute(
                "SELECT money FROM accounts WHERE account_id = ?",
                [senderAccountId]
            );
            senderBalance = updatedSenderAccount[0].money;

            await conn.execute(
                "UPDATE leaderboard SET money = ?, total_transactions = total_transactions + 1 WHERE user_id = ?",
                [senderBalance, userId]
            );

            await conn.commit();
            res.status(200).json({ message: "Transaction successful" });
        } catch (err) {
            await conn.rollback();
            console.error("Transaction error:", err);
            res.status(500).json({
                message: "Transaction failed",
                error: err.message,
            });
        } finally {
            if (conn) conn.release();
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Error Occurred" });
    }
});

// Logout Route
app.get("/user/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Logged out successfully" });
});

// Admin Signup Route
app.post(
    "/admin/signup",
    [
        body("username")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters long")
            .escape(),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),
        body("email")
            .isEmail()
            .withMessage("Invalid email address")
            .normalizeEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, name, phone, age, email } = req.body;

        try {
            if (!db) {
                return res
                    .status(500)
                    .json({ message: "Database connection failed." });
            }

            const [existingUsers] = await db.execute(
                "SELECT * FROM admin WHERE username = ? OR email = ?",
                [username, email]
            );

            if (existingUsers.length > 0) {
                return res
                    .status(409)
                    .json({ message: "Username or email already exists." });
            }

            const hashedPassword = await hash(password, 12);

            const [result] = await db.execute(
                "INSERT INTO admin (username, password, name, phone, age, email) VALUES (?, ?, ?, ?, ?, ?)",
                [username, hashedPassword, name, phone, age, email]
            );

            const adminid = result.insertId;

            const token = jwt.sign(
                { adminId: adminid, username: username },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", token, {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            res.status(201).json({
                message: "Admin registered successfully!",
                adminid: adminid,
                token: token,
                username: username,
                email,
                phone,
                age,
                name,
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({
                message: "Failed to register Admin.",
                error: error.message,
            });
        }
    }
);

// Admin Login Route
app.post("/admin/login", limiter, async (req, res) => {
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

        const [admin] = await db.execute(
            "SELECT * FROM admin WHERE username = ?",
            [username]
        );

        if (admin.length === 0) {
            return res
                .status(401)
                .json({ message: "Invalid username or password." });
        }

        const admmin = admin[0];

        const passwordMatch = await compare(password, admmin.password);

        if (!passwordMatch) {
            return res
                .status(401)
                .json({ message: "Invalid username or password." });
        }

        const token = jwt.sign(
            { adminId: admmin.admin_id, username: admmin.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 3600000,
            path: "/",
            sameSite: "lax",
        });

        res.status(200).json({
            message: "Admin Login successful!",
            token: token,
            adminId: admmin.admin_id,
            name: admmin.name,
            phone_number: admmin.phone,
            age: admmin.age,
            email: admmin.email,
            username: admmin.username,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Failed to login.",
            error: error.message,
        });
    }
});

// Admin Profile Route (Protected Route)
app.get("/admin/profile", authenticateAdmin, async (req, res) => {
    try {
        const adminId = req.admin.adminId;

        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [admin] = await db.execute(
            "SELECT * FROM admin WHERE admin_id = ?",
            [adminId]
        );

        if (admin.length === 0) {
            return res.status(404).json({ message: "Admin not found." });
        }

        const addmin = admin[0];

        res.status(200).json({
            addmin,
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({
            message: "Failed to retrieve admin profile",
            error: error.message,
        });
    }
});

// Admin Update Route (Protected Route)
app.post(
    "/admin/update",
    authenticateAdmin,
    [
        body("newUsername")
            .isLength({ min: 3, max: 20 })
            .withMessage("Username must be between 3 and 20 characters")
            .escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { newUsername } = req.body;
        const adminId = req.admin.adminId;

        try {
            if (!db) {
                return res
                    .status(500)
                    .json({ message: "Database connection failed." });
            }

            const [admin] = await db.execute(
                "SELECT * FROM admin WHERE admin_id = ?",
                [adminId]
            );

            if (admin.length === 0) {
                return res.status(404).json({ message: "Admin not found." });
            }

            const [existingadmin] = await db.execute(
                "SELECT * FROM admin WHERE username = ?",
                [newUsername]
            );

            if (existingadmin.length > 0) {
                return res.status(400).json({
                    message:
                        "New Username already taken, please choose another one",
                });
            }

            const [updatedadmin] = await db.execute(
                "UPDATE admin SET username = ? WHERE admin_id = ?",
                [newUsername, adminId]
            );

            const newToken = jwt.sign(
                { adminId: adminId, username: newUsername },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", newToken, {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            return res.status(200).json({
                message: "Username Updated Successfully",
            });
        } catch (error) {
            console.error("Admin error updating username:", error);
            return res.status(500).json({
                message: "Error updating username",
                error: error.message,
            });
        }
    }
);

// Admin User List Route (Protected Route)
app.get("/admin/UsersList", authenticateAdmin, async (req, res) => {
    try {
        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }
        const [AllUsers] = await db.execute("Select * from users");
        if (AllUsers.length === 0) {
            return res.status(404).json({ message: "No users found." });
        }
        res.status(200).json({
            AllUsers,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Error fetching users." });
    }
});

// Admin Block User Route (Protected Route)
app.post("/admin/blockUser", authenticateAdmin, async (req, res) => {
    const { userId, reason } = req.body;

    try {
        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [userExists] = await db.execute(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (userExists.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const query_fraud =
            "INSERT INTO fraud_people (user_id, reason) VALUES (?, ?)";
        const [fraudEntry] = await db.execute(query_fraud, [userId, reason]);

        const [deletedUser] = await db.execute(
            "DELETE FROM users WHERE user_id = ?",
            [userId]
        );

        res.status(200).json({
            message: "User blocked successfully",
            deletedUser,
            fraudEntry,
        });
    } catch (error) {
        console.error("Error in blockUser:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Admin Freeze Money Route (Protected Route)
app.post("/admin/FreezeMoney", authenticateAdmin, async (req, res) => {
    const { userId } = req.body;

    try {
        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [userExists] = await db.execute(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (userExists.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user_money = await db.execute(
            "select money from accounts where user_id = ?",
            [userId]
        );

        const freeze_query = await db.execute(
            "UPDATE ACCOUNTS SET money = 1818 WHERE USER_ID = ?",
            [userId]
        );

        res.status(200).json({
            message: "Money Deducted successfully",
            freeze_query,
        });
    } catch (error) {
        console.error("Error in Money Deducting:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Verify Route
app.get("/verify", (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized: No token found" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res
            .status(200)
            .json({ message: "Token is valid", userId: decoded.userId });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
});

// Admin Logout Route
app.get("/admin/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Admin logged out successfully" });
});

// Start the server
app.listen(3000, () => {
    console.log("listening in port 3000");
});
