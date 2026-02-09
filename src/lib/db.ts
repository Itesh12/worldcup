import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 15000, // Increased from 5000
            connectTimeoutMS: 20000,       // Increased from 10000
            heartbeatFrequencyMS: 10000,
        };

        console.log("MongoDB: Attempting new connection...");
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
            console.log("MongoDB: Connected successfully to", m.connection.host);
            return m;
        }).catch((err) => {
            console.error("MongoDB: Connection error details:");
            console.error("- Message:", err.message);
            console.error("- Code:", err.code);
            if (err.message.includes('getaddrinfo')) {
                console.error("- Suggestion: Check DNS settings or MongoDB Atlas IP Whitelist.");
            }
            cached.promise = null; // Reset promise on failure
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null; // Force reset if await fails
        throw e;
    }

    return cached.conn;
}

export default connectDB;
