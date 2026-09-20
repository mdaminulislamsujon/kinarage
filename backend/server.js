require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { Pool } = require("pg");

const app = express();

// ==========================================
// CONFIG
// ==========================================

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
    process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_ENV";

const FRONTEND_DIR = path.join(__dirname, "..");

const UPLOAD_DIR = path.join(
    __dirname,
    "uploads",
    "products"
);

// Create upload folder automatically
fs.mkdirSync(UPLOAD_DIR, {
    recursive: true
});

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// Serve uploaded images
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// ==========================================
// POSTGRESQL
// ==========================================

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "kinarage",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || ""
});

// ==========================================
// MULTER IMAGE UPLOAD
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname)
                .toLowerCase();

        const safeName =
            `product-${Date.now()}-${Math.round(
                Math.random() * 100000
            )}${extension}`;

        cb(null, safeName);
    }
});

const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPG, PNG, WEBP and GIF images are allowed."
                )
            );
        }

        cb(null, true);
    }
});

// ==========================================
// DATABASE CONNECTION
// ==========================================

async function testDatabaseConnection() {

    try {

        const result =
            await pool.query("SELECT NOW()");

        console.log(
            "✅ PostgreSQL Database Connected Successfully"
        );

        console.log(
            `🕒 Database Time: ${result.rows[0].now}`
        );

    } catch (error) {

        console.error(
            "❌ PostgreSQL Connection Error:"
        );

        console.error(error.message);

        process.exit(1);
    }
}

// ==========================================
// CREATE / UPDATE TABLES
// ==========================================

async function createTables() {

    try {

        // --------------------------------------
        // PRODUCTS TABLE
        // --------------------------------------

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (

                id SERIAL PRIMARY KEY,

                name VARCHAR(255) NOT NULL,

                category VARCHAR(100) NOT NULL,

                price VARCHAR(100) NOT NULL,

                rating VARCHAR(50)
                    DEFAULT '4.5 ★',

                value VARCHAR(50)
                    DEFAULT '9.0/10',

                processor TEXT
                    DEFAULT 'N/A',

                battery TEXT
                    DEFAULT 'N/A',

                camera TEXT
                    DEFAULT 'N/A',

                icon VARCHAR(20)
                    DEFAULT '📱',

                image_url TEXT,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Existing database হলে image_url add করবে
        await pool.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS image_url TEXT
        `);

        // --------------------------------------
        // USERS TABLE
        // --------------------------------------

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (

                id SERIAL PRIMARY KEY,

                name VARCHAR(150) NOT NULL,

                email VARCHAR(255)
                    UNIQUE NOT NULL,

                password_hash TEXT NOT NULL,

                role VARCHAR(20)
                    DEFAULT 'user',

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        `);


        async function seedInitialProducts() {
    try {
        const existing = await pool.query(
            "SELECT COUNT(*)::int AS count FROM products"
        );

        const count = existing.rows[0].count;

        if (count > 0) {
            console.log(`ℹ️ Products already exist: ${count}`);
            return;
        }

        const products = [
            {
                name: "Galaxy Note Smartphone",
                category: "mobile",
                price: "৳19,999",
                rating: "4.5 ★",
                value: "9.2/10",
                processor: "Octa-core 2.2 GHz",
                battery: "5000 mAh",
                camera: "50MP Triple",
                icon: "📱"
            },
            {
                name: "UltraBook Pro 14",
                category: "laptop",
                price: "৳65,000",
                rating: "4.8 ★",
                value: "9.5/10",
                processor: "Intel Core i5 12th Gen",
                battery: "Up to 10 hours",
                camera: "720p HD Webcam",
                icon: "💻"
            },
            {
                name: "Wireless ANC Earbuds",
                category: "gadgets",
                price: "৳3,499",
                rating: "4.3 ★",
                value: "8.9/10",
                processor: "Bluetooth 5.3",
                battery: "30h with Case",
                camera: "N/A",
                icon: "🎧"
            },
            {
                name: "Smart Fitness Watch",
                category: "gadgets",
                price: "৳4,200",
                rating: "4.6 ★",
                value: "9.0/10",
                processor: "RTK Chipset",
                battery: "7 Days Battery",
                camera: "N/A",
                icon: "⌚"
            },
            {
                name: "Smart LED Desk Lamp",
                category: "home",
                price: "৳1,800",
                rating: "4.4 ★",
                value: "8.8/10",
                processor: "Touch Control LED",
                battery: "USB Powered",
                camera: "N/A",
                icon: "💡"
            },
            {
                name: "Budget Gaming Laptop",
                category: "laptop",
                price: "৳78,000",
                rating: "4.7 ★",
                value: "9.1/10",
                processor: "Ryzen 5 / RTX 3050",
                battery: "6 hours",
                camera: "HD Webcam",
                icon: "💻"
            }
        ];

        for (const product of products) {
            await pool.query(
                `
                INSERT INTO products
                (
                    name,
                    category,
                    price,
                    rating,
                    value,
                    processor,
                    battery,
                    camera,
                    icon
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                `,
                [
                    product.name,
                    product.category,
                    product.price,
                    product.rating,
                    product.value,
                    product.processor,
                    product.battery,
                    product.camera,
                    product.icon
                ]
            );
        }

        console.log(`✅ Seeded ${products.length} initial products`);
    } catch (error) {
        console.error("❌ Product seed error:", error);
        throw error;
    }
}

        // --------------------------------------
        // ADMIN USER
        // --------------------------------------

        const adminEmail =
            process.env.ADMIN_EMAIL ||
            "admin@kinarage.com";

        const adminPassword =
            process.env.ADMIN_PASSWORD ||
            "ChangeMe123!";

        const existingAdmin =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE email = $1
                `,
                [adminEmail]
            );

        if (existingAdmin.rows.length === 0) {

            const passwordHash =
                await bcrypt.hash(
                    adminPassword,
                    12
                );

            await pool.query(
                `
                INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    role
                )
                VALUES
                ($1, $2, $3, 'admin')
                `,
                [
                    "KinarAge Admin",
                    adminEmail,
                    passwordHash
                ]
            );

            console.log(
                `✅ Admin account created: ${adminEmail}`
            );

        } else {

            console.log(
                `ℹ️ Admin account already exists: ${adminEmail}`
            );
        }

        console.log(
            "✅ Database tables ready"
        );

    } catch (error) {

        console.error(
            "❌ Table creation error:"
        );

        console.error(error.message);

        process.exit(1);
    }
}

// ==========================================
// SEED INITIAL PRODUCTS
// ==========================================

async function seedInitialProducts() {

    try {

        const existing =
            await pool.query(
                "SELECT COUNT(*)::int AS count FROM products"
            );

        // Products already exist হলে duplicate করবে না
        if (existing.rows[0].count > 0) {

            console.log(
                `ℹ️ Products already exist: ${existing.rows[0].count}`
            );

            return;
        }

        const products = [

            {
                name: "Galaxy Note Smartphone",
                category: "mobile",
                price: "৳19,999",
                rating: "4.5 ★",
                value: "9.2/10",
                processor: "Octa-core 2.2 GHz",
                battery: "5000 mAh",
                camera: "50MP Triple",
                icon: "📱"
            },

            {
                name: "UltraBook Pro 14",
                category: "laptop",
                price: "৳65,000",
                rating: "4.8 ★",
                value: "9.5/10",
                processor: "Intel Core i5 12th Gen",
                battery: "Up to 10 hours",
                camera: "720p HD Webcam",
                icon: "💻"
            },

            {
                name: "Wireless ANC Earbuds",
                category: "gadgets",
                price: "৳3,499",
                rating: "4.3 ★",
                value: "8.9/10",
                processor: "Bluetooth 5.3",
                battery: "30h with Case",
                camera: "N/A",
                icon: "🎧"
            },

            {
                name: "Smart Fitness Watch",
                category: "gadgets",
                price: "৳4,200",
                rating: "4.6 ★",
                value: "9.0/10",
                processor: "RTK Chipset",
                battery: "7 Days Battery",
                camera: "N/A",
                icon: "⌚"
            },

            {
                name: "Smart LED Desk Lamp",
                category: "home",
                price: "৳1,800",
                rating: "4.4 ★",
                value: "8.8/10",
                processor: "Touch Control LED",
                battery: "USB Powered",
                camera: "N/A",
                icon: "💡"
            },

            {
                name: "Budget Gaming Laptop",
                category: "laptop",
                price: "৳78,000",
                rating: "4.7 ★",
                value: "9.1/10",
                processor: "Ryzen 5 / RTX 3050",
                battery: "6 hours",
                camera: "HD Webcam",
                icon: "💻"
            }

        ];

        for (const product of products) {

            await pool.query(
                `
                INSERT INTO products
                (
                    name,
                    category,
                    price,
                    rating,
                    value,
                    processor,
                    battery,
                    camera,
                    icon
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )
                `,
                [
                    product.name,
                    product.category,
                    product.price,
                    product.rating,
                    product.value,
                    product.processor,
                    product.battery,
                    product.camera,
                    product.icon
                ]
            );
        }

        console.log(
            `✅ Seeded ${products.length} initial products`
        );

    } catch (error) {

        console.error(
            "❌ Product seed error:",
            error.message
        );

        throw error;
    }
}

// ==========================================
// JWT HELPERS
// ==========================================

function createToken(user) {

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },

        JWT_SECRET,

        {
            expiresIn: "7d"
        }
    );
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

function authenticate(req, res, next) {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                error: "Authentication required"
            });
        }

        const parts =
            authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({
                error: "Invalid authorization format"
            });
        }

        const token = parts[1];

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
}

// ==========================================
// ADMIN MIDDLEWARE
// ==========================================

function requireAdmin(req, res, next) {

    if (
        !req.user ||
        req.user.role !== "admin"
    ) {

        return res.status(403).json({
            error: "Admin access required"
        });
    }

    next();
}

// ==========================================
// TEST API
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message:
            "KinarAge Backend API is running",
        status: "success"
    });
});

// ==========================================
// DATABASE TEST
// ==========================================

app.get("/api/test-db", async (req, res) => {

    try {

        const result =
            await pool.query(
                "SELECT NOW()"
            );

        res.json({
            message:
                "PostgreSQL connection successful!",
            time: result.rows[0].now
        });

    } catch (error) {

        res.status(500).json({
            error:
                "Database connection failed",
            message:
                error.message
        });
    }
});

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

app.post(
    "/api/auth/register",
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;

            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    error:
                        "Name, email and password are required"
                });
            }

            if (password.length < 6) {

                return res.status(400).json({
                    error:
                        "Password must be at least 6 characters"
                });
            }

            const cleanEmail =
                email.trim().toLowerCase();

            const existing =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE email = $1
                    `,
                    [cleanEmail]
                );

            if (existing.rows.length > 0) {

                return res.status(409).json({
                    error:
                        "Email already registered"
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const result =
                await pool.query(
                    `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password_hash,
                        role
                    )
                    VALUES
                    ($1, $2, $3, 'user')
                    RETURNING
                        id,
                        name,
                        email,
                        role,
                        created_at
                    `,
                    [
                        name.trim(),
                        cleanEmail,
                        passwordHash
                    ]
                );

            const user =
                result.rows[0];

            const token =
                createToken(user);

            res.status(201).json({
                message:
                    "Registration successful",
                token,
                user
            });

        } catch (error) {

            console.error(
                "Register Error:",
                error
            );

            res.status(500).json({
                error:
                    "Registration failed"
            });
        }
    }
);

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({
                    error:
                        "Email and password are required"
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM users
                    WHERE email = $1
                    `,
                    [
                        email
                            .trim()
                            .toLowerCase()
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({
                    error:
                        "Invalid email or password"
                });
            }

            const user =
                result.rows[0];

            const validPassword =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!validPassword) {

                return res.status(401).json({
                    error:
                        "Invalid email or password"
                });
            }

            const safeUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            const token =
                createToken(
                    safeUser
                );

            res.json({
                message:
                    "Login successful",
                token,
                user: safeUser
            });

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            res.status(500).json({
                error:
                    "Login failed"
            });
        }
    }
);

// ==========================================
// ADMIN LOGIN
// POST /api/auth/admin-login
// ==========================================

app.post(
    "/api/auth/admin-login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({
                    error:
                        "Email and password are required"
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM users
                    WHERE email = $1
                    AND role = 'admin'
                    `,
                    [
                        email
                            .trim()
                            .toLowerCase()
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({
                    error:
                        "Invalid admin credentials"
                });
            }

            const admin =
                result.rows[0];

            const validPassword =
                await bcrypt.compare(
                    password,
                    admin.password_hash
                );

            if (!validPassword) {

                return res.status(401).json({
                    error:
                        "Invalid admin credentials"
                });
            }

            const safeAdmin = {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: "admin"
            };

            const token =
                createToken(
                    safeAdmin
                );

            res.json({
                message:
                    "Admin login successful",
                token,
                user: safeAdmin
            });

        } catch (error) {

            console.error(
                "Admin Login Error:",
                error
            );

            res.status(500).json({
                error:
                    "Admin login failed"
            });
        }
    }
);

// ==========================================
// CURRENT USER
// GET /api/auth/me
// ==========================================

app.get(
    "/api/auth/me",
    authenticate,
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        created_at
                    FROM users
                    WHERE id = $1
                    `,
                    [req.user.id]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "User not found"
                });
            }

            res.json({
                user:
                    result.rows[0]
            });

        } catch (error) {

            res.status(500).json({
                error:
                    "Failed to get user"
            });
        }
    }
);

// ==========================================
// GET PRODUCTS
// PUBLIC
// ==========================================

app.get(
    "/api/products",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        category,
                        price,
                        rating,
                        value,
                        processor,
                        battery,
                        camera,
                        icon,
                        image_url,
                        created_at,
                        updated_at
                    FROM products
                    ORDER BY created_at DESC
                    `
                );

            res.json(
                result.rows
            );

        } catch (error) {

            console.error(
                "Get Products Error:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to fetch products"
            });
        }
    }
);

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

app.get(
    "/api/products/:id",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM products
                    WHERE id = $1
                    `,
                    [req.params.id]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Product not found"
                });
            }

            res.json(
                result.rows[0]
            );

        } catch (error) {

            res.status(500).json({
                error:
                    "Failed to fetch product"
            });
        }
    }
);

// ==========================================
// ADMIN ADD PRODUCT
// POST /api/products
// ==========================================

app.post(
    "/api/products",
    authenticate,
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            const {
                name,
                category,
                price,
                rating,
                value,
                processor,
                battery,
                camera
            } = req.body;

            if (
                !name ||
                !category ||
                !price
            ) {

                return res.status(400).json({
                    error:
                        "Name, category and price are required"
                });
            }

            const imageUrl =
                req.file
                    ? `/uploads/products/${req.file.filename}`
                    : null;

            const result =
                await pool.query(
                    `
                    INSERT INTO products
                    (
                        name,
                        category,
                        price,
                        rating,
                        value,
                        processor,
                        battery,
                        camera,
                        icon,
                        image_url
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10
                    )
                    RETURNING *
                    `,
                    [
                        name.trim(),

                        category
                            .trim()
                            .toLowerCase(),

                        price.trim(),

                        rating ||
                            "4.5 ★",

                        value ||
                            "9.0/10",

                        processor ||
                            "N/A",

                        battery ||
                            "N/A",

                        camera ||
                            "N/A",

                        "📦",

                        imageUrl
                    ]
                );

            res.status(201).json({
                message:
                    "Product added successfully",

                product:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Add Product Error:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to add product",

                message:
                    error.message
            });
        }
    }
);

// ==========================================
// ADMIN UPDATE PRODUCT
// PUT /api/products/:id
// ==========================================

app.put(
    "/api/products/:id",
    authenticate,
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            const {
                name,
                category,
                price,
                rating,
                value,
                processor,
                battery,
                camera
            } = req.body;

            const oldResult =
                await pool.query(
                    `
                    SELECT *
                    FROM products
                    WHERE id = $1
                    `,
                    [req.params.id]
                );

            if (
                oldResult.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Product not found"
                });
            }

            const oldProduct =
                oldResult.rows[0];

            let imageUrl =
                oldProduct.image_url;

            if (req.file) {

                imageUrl =
                    `/uploads/products/${req.file.filename}`;

                // Delete old image
                if (
                    oldProduct.image_url &&
                    oldProduct.image_url.startsWith(
                        "/uploads/products/"
                    )
                ) {

                    const oldFile =
                        path.join(
                            __dirname,
                            oldProduct.image_url
                                .replace(
                                    "/uploads/",
                                    "uploads/"
                                )
                        );

                    if (
                        fs.existsSync(oldFile)
                    ) {

                        fs.unlinkSync(
                            oldFile
                        );
                    }
                }
            }

            const result =
                await pool.query(
                    `
                    UPDATE products
                    SET
                        name =
                            COALESCE($1, name),

                        category =
                            COALESCE($2, category),

                        price =
                            COALESCE($3, price),

                        rating =
                            COALESCE($4, rating),

                        value =
                            COALESCE($5, value),

                        processor =
                            COALESCE($6, processor),

                        battery =
                            COALESCE($7, battery),

                        camera =
                            COALESCE($8, camera),

                        image_url =
                            $9,

                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE id = $10

                    RETURNING *
                    `,
                    [
                        name ||
                            null,

                        category
                            ? category
                                .trim()
                                .toLowerCase()
                            : null,

                        price ||
                            null,

                        rating ||
                            null,

                        value ||
                            null,

                        processor ||
                            null,

                        battery ||
                            null,

                        camera ||
                            null,

                        imageUrl,

                        req.params.id
                    ]
                );

            res.json({
                message:
                    "Product updated successfully",

                product:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Update Product Error:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to update product"
            });
        }
    }
);

// ==========================================
// ADMIN DELETE PRODUCT
// ==========================================

app.delete(
    "/api/products/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    DELETE FROM products
                    WHERE id = $1
                    RETURNING *
                    `,
                    [req.params.id]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Product not found"
                });
            }

            const product =
                result.rows[0];

            // Delete uploaded image
            if (
                product.image_url &&
                product.image_url.startsWith(
                    "/uploads/products/"
                )
            ) {

                const filePath =
                    path.join(
                        __dirname,
                        product.image_url
                            .replace(
                                "/uploads/",
                                "uploads/"
                            )
                    );

                if (
                    fs.existsSync(filePath)
                ) {

                    fs.unlinkSync(filePath);
                }
            }

            res.json({
                message:
                    "Product deleted successfully",

                product
            });

        } catch (error) {

            console.error(
                "Delete Product Error:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to delete product"
            });
        }
    }
);

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Server Error:",
            error
        );

        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).json({
                error:
                    error.message
            });
        }

        res.status(500).json({
            error:
                error.message ||
                "Internal server error"
        });
    }
);

// ==========================================
// 404
// ==========================================

app.use(
    (req, res) => {

        res.status(404).json({
            error:
                "API route not found"
        });
    }
);

// ==========================================
// START
// ==========================================

async function startServer() {
    try {
        await testDatabaseConnection();

        await createTables();

        // Insert initial products if database is empty
        await seedInitialProducts();

        app.listen(PORT, () => {
            console.log(`🚀 Backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
