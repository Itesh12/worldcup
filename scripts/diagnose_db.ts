
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function diagnose() {
    console.log("--- MongoDB Diagnostic Tool ---");

    if (!MONGODB_URI) {
        console.error("Error: MONGODB_URI is not defined in .env.local");
        process.exit(1);
    }

    const hostMatch = MONGODB_URI.match(/@([^/?#]+)/);
    if (!hostMatch) {
        console.error("Error: Could not parse host from MONGODB_URI");
        process.exit(1);
    }
    const clusterHost = hostMatch[1];
    console.log(`Cluster Host: ${clusterHost}`);

    // 1. DNS Resolution Test
    console.log("\n1. DNS Resolution Test:");

    const resolve = (host: string, type: 'A' | 'SRV' = 'A') => {
        return new Promise((res) => {
            if (type === 'SRV') {
                dns.resolveSrv(`_mongodb._tcp.${host}`, (err, addresses) => {
                    if (err) {
                        console.error(`  - SRV _mongodb._tcp.${host}: FAILED (${err.message})`);
                        res(null);
                    } else {
                        console.log(`  - SRV _mongodb._tcp.${host}: SUCCESS (${addresses.length} shards found)`);
                        res(addresses);
                    }
                });
            } else {
                dns.lookup(host, (err, address) => {
                    if (err) {
                        console.error(`  - A ${host}: FAILED (${err.message})`);
                        res(null);
                    } else {
                        console.log(`  - A ${host}: SUCCESS (${address})`);
                        res(address);
                    }
                });
            }
        });
    };

    const srvRecords = await resolve(clusterHost, 'SRV') as any[];
    if (srvRecords) {
        for (const record of srvRecords) {
            await resolve(record.name);
        }
    } else {
        await resolve(clusterHost);
    }

    // 2. Connectivity Test
    console.log("\n2. MongoDB Connectivity Test:");
    try {
        const start = Date.now();
        console.log("  - Attempting connection...");
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        const duration = Date.now() - start;
        console.log(`  - SUCCESS: Connected in ${duration}ms`);

        const db = mongoose.connection.db;
        if (!db) throw new Error("Database object is undefined");

        const admin = db.admin();
        const serverStatus = await admin.serverStatus();
        console.log(`  - Host: ${mongoose.connection.host}`);
        console.log(`  - Replica Set: ${serverStatus.repl?.setName || 'N/A'}`);
        console.log(`  - Connection Count: ${serverStatus.connections.current}`);

        await mongoose.disconnect();
        console.log("  - Connection closed.");
    } catch (err: any) {
        console.error(`  - FAILED: ${err.message}`);
        if (err.message.includes('getaddrinfo')) {
            console.log("\n[DIAGNOSIS] This looks like a DNS issue. Your machine cannot resolve the MongoDB Atlas hostnames.");
            console.log("Check if you are behind a firewall/VPN, or if your local DNS server is having issues.");
        } else if (err.message.includes('selection timeout')) {
            console.log("\n[DIAGNOSIS] Connection timeout. The host is resolvable but not reachable.");
            console.log("Check if your IP address is whitelisted in MongoDB Atlas project settings.");
        }
    }

    console.log("\n--- Diagnostic Complete ---");
    process.exit(0);
}

diagnose();
