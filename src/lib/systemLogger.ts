import connectDB from "./db";
import SystemLog from "@/models/SystemLog";

export async function logSystemEvent(
    type: 'sync' | 'reveal' | 'settle' | 'payout' | 'repair' | 'error',
    status: 'success' | 'error' | 'warning',
    message: string,
    resourceId?: string,
    details?: any
) {
    try {
        await connectDB();
        
        await SystemLog.create({
            type,
            status,
            message,
            resourceId,
            details,
            timestamp: new Date()
        });

        // Optional: Keep only last 1000 logs to prevent DB bloat
        // (Only run occasionally or if count is very high)
    } catch (error) {
        console.error("FATAL: Failed to log system event:", error);
    }
}

/**
 * Helper to get the last run time for a specific type
 */
export async function getLastCronRun(type: string) {
    try {
        await connectDB();
        const lastLog = await SystemLog.findOne({ type, status: 'success' }).sort({ timestamp: -1 });
        return lastLog ? lastLog.timestamp : null;
    } catch (error) {
        return null;
    }
}
