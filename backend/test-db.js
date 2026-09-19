require("dotenv").config();

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URL, {
    tls: true,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
});

async function test() {
    try {
        console.log("Connecting directly with MongoDB driver...");

        await client.connect();

        console.log("✅ MongoDB driver connected!");

        const result = await client.db("kinarage").command({
            ping: 1
        });

        console.log("✅ Ping:", result);

        await client.close();

    } catch (err) {
        console.error("❌ ERROR:", err);
    }
}

test();
