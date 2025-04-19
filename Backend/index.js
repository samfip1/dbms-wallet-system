import express, { json } from "express";
import cors from "cors";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import mysql from "mysql2/promise";
import { body, validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
config();
const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:5173",
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

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "fiopawjefoiawnef9834ht89hvoiausndfoiashfeoiweiawdfshioawef";

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
    }
})();

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

            // **CRITICAL: HASH THE TRANSACTION PIN**
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

            const initialMoney = Math.random()*489673497;

            const [accountInsertResult] = await db.execute(
                "INSERT INTO accounts (user_id, money, transaction_pin, number_of_transactions) VALUES (?, ?, ?, ?)",
                [userId, initialMoney, hashedTransactionPin, 0]
            );

            const accountId = accountInsertResult.insertId;

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
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
        console.log(user);

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

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
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

app.get("/profile", async (req, res) => {
    const token = req.cookies.token;

    console.log(token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

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
        res.status(401).json({ message: "Invalid token." });
    }
});

app.post(
    "/update",
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

        const token = req.cookies.token;
        const { newUsername } = req.body;

        if (!token) {
            return res.status(401).json({
                message: "Token not Provided",
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.userId;
            console.log(userId);

            if (!db) {
                return res
                    .status(500)
                    .json({ message: "Database connection failed." });
            }

            const [users] = await db.execute(
                "SELECT * FROM users WHERE user_id = ?",
                [userId]
            );
            console.log(users);

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

            console.log(updatedUsers);

            const newToken = jwt.sign(
                { userId: userId, username: newUsername },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            return res.status(200).json({
                message: "Username Updated Successfully",
            });
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .json({
                    message: "Error updating username",
                    error: error.message,
                });
        }
    }
);
app.post("/transaction", async (req, res) => {
    const token = req.cookies.token;
    const { money, receiverUser_id, transaction_pin, comments } = req.body;

    if (!token) {
        return res.status(401).json({ message: "Token not Provided" });
    }

    let conn;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

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
        console.log(receiver);
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
        const senderBalance = senderAccount[0].money;
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

            const [leaderboardSender] = await conn.execute(
                "SELECT * FROM leaderboard WHERE user_id = ?",
                [userId]
            );

            if (leaderboardSender.length > 0) {
                await conn.execute(
                    "UPDATE leaderboard SET money = ?, total_transactions = total_transactions + 1 WHERE user_id = ?",
                    [senderBalance - money, userId]
                );
            } else {
                await conn.execute(
                    "INSERT INTO leaderboard (user_id, money, total_transactions) VALUES (?, ?, ?)",
                    [userId, senderBalance - money, 1]
                );
            }

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

app.get("/user/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Logged out successfully" });
});

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
            console.log(adminid);

            const token = jwt.sign(
                { adminid: adminid, username: username },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            res.status(201).json({
                message: "User registered successfully!",
                adminid: adminid,
                token: token,
                username: username,
                email,
                phone,
                age,
                name,
                adminid,
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
        console.log(admmin);

        const passwordMatch = await compare(password, admmin.password);

        if (!passwordMatch) {
            return res
                .status(401)
                .json({ message: "Invalid username or password." });
        }

        const token = jwt.sign(
            { admin: admmin.admin_id, username: admmin.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600000,
            path: "/",
            sameSite: "lax",
        });

        res.status(200).json({
            message: "Login successful!",
            token: token,
            admin,
            name: admin.full_name,
            phone_number: admin.phone_number,
            age: admin.age,
            email: admin.email,
            username: admin.username,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Failed to login.",
            error: error.message,
        });
    }
});

app.get("/admin/profile", async (req, res) => {
    const token = req.cookies.token;

    console.log(token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const adminId = decoded.admin;
        console.log(adminId + " admin id");

        if (!db) {
            return res
                .status(500)
                .json({ message: "Database connection failed." });
        }

        const [admin] = await db.execute(
            "SELECT * FROM admin WHERE admin_id = ?",
            [adminId]
        );
        console.log(admin);

        if (admin.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const addmin = admin[0];
        console.log(addmin);

        res.status(200).json({
            addmin,
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(401).json({ message: "Invalid token." });
    }
});

app.post(
    "/admin/update",
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
        const token = req.cookies.token;
        const { newUsername } = req.body;

        if (!token) {
            return res.status(401).json({
                message: "Token not Provided",
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const adminId = decoded.admin;

            console.log(adminId);

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
                return res.status(404).json({ message: "User not found." });
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
            console.log(updatedadmin);

            const newToken = jwt.sign(
                { adminId: adminId, username: newUsername },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 3600000,
                path: "/",
                sameSite: "lax",
            });

            return res.status(200).json({
                message: "Username Updated Successfully",
            });
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .json({
                    message: "Error updating username",
                    error: error.message,
                });
        }
    }
);

app.get("/admin/UsersList", async (req, res) => {
    const token = req.cookies.token;
    console.log(token);
    if (!token) {
        return res.status(401).json({
            message: "Token not Provided",
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const adminId = decoded.admin;
        console.log(adminId + " admin id");

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

app.post("/admin/blockUser", async (req, res) => {
    const token = req.cookies.token;
    const { userId, reason } = req.body;

    if (!token) {
        return res.status(401).json({
            message: "Token not provided",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const adminId = decoded.admin;
        console.log(adminId + " admin id");

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

app.post("/admin/FreezeMoney", async (req, res) => {
    const token = req.cookies.token;
    const { userId } = req.body;

    if (!token) {
        return res.status(401).json({
            message: "Token not provided",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const adminId = decoded.admin;
        console.log(adminId + " admin id");

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
        )
        console.log(user_money);
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

app.get("/admin/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Logged out successfully" });
});
app.listen(3000, () => {
    console.log("listening in port 3000");
});
