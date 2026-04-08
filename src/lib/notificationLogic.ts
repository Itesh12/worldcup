import connectDB from "./db";
import Notification from "@/models/Notification";
import User from "@/models/User";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Arena from "@/models/Arena";
import mongoose from "mongoose";

interface NotificationData {
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'money' | 'match';
    link?: string;
}

/**
 * Creates a notification for a specific user
 */
export async function createNotification(userId: string, data: NotificationData) {
    try {
        await connectDB();
        
        await Notification.create({
            userId: new mongoose.Types.ObjectId(userId),
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link
        });
        
        return { success: true };
    } catch (error) {
        console.error("Failed to create notification:", error);
        return { success: false, error };
    }
}

/**
 * Sends a notification to all administrators
 */
export async function notifyAdmins(data: NotificationData) {
    try {
        await connectDB();
        
        const admins = await User.find({ role: 'admin' }).select('_id');
        
        if (admins.length === 0) return { success: false, message: "No admins found" };
        
        const notifications = admins.map(admin => ({
            userId: admin._id,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link
        }));
        
        await Notification.insertMany(notifications);
        
        return { success: true, count: admins.length };
    } catch (error) {
        console.error("Failed to notify admins:", error);
        return { success: false, error };
    }
}

/**
 * Sends a notification to a Sub-Admin and their linked Admin
 */
export async function notifySubAdminAndAdmin(subAdminId: string, data: NotificationData) {
    try {
        await connectDB();
        
        const subAdmin = await User.findById(subAdminId).select('_id role parentAdminId');
        if (!subAdmin) return { success: false, message: "SubAdmin not found" };
        
        const userIds = [subAdmin._id];
        if (subAdmin.parentAdminId) {
            userIds.push(subAdmin.parentAdminId);
        }
        
        const notifications = userIds.map(id => ({
            userId: id,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link
        }));
        
        await Notification.insertMany(notifications);
        
        return { success: true };
    } catch (error) {
        console.error("Failed to notify SubAdmin/Admin:", error);
        return { success: false, error };
    }
}

/**
 * Sends a notification to all unique users participating in a specific arena
 */
export async function notifyUsersInArena(arenaId: string, data: NotificationData) {
    try {
        await connectDB();
        
        // 1. Get unique users in the arena
        const assignments = await UserBattingAssignment.find({ arenaId }).select('userId').lean();
        const uniqueUserIds = [...new Set(assignments.map(a => a.userId.toString()))];

        if (uniqueUserIds.length === 0) return { success: true, count: 0 };

        // 2. Insert notifications
        const notifications = uniqueUserIds.map(id => ({
            userId: new mongoose.Types.ObjectId(id),
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link
        }));

        await Notification.insertMany(notifications);
        return { success: true, count: uniqueUserIds.length };
    } catch (error) {
        console.error("Failed to notify users in arena:", error);
        return { success: false, error };
    }
}

/**
 * Sends a notification to all unique users participating in any arena for a match
 */
export async function notifyUsersInMatch(matchId: string, data: NotificationData) {
    try {
        await connectDB();

        // 1. Get unique users across all arenas for this match
        const assignments = await UserBattingAssignment.find({ matchId }).select('userId').lean();
        const uniqueUserIds = [...new Set(assignments.map(a => a.userId.toString()))];

        if (uniqueUserIds.length === 0) return { success: true, count: 0 };

        // 2. Insert notifications
        const notifications = uniqueUserIds.map(id => ({
            userId: new mongoose.Types.ObjectId(id),
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link
        }));

        await Notification.insertMany(notifications);
        return { success: true, count: uniqueUserIds.length };
    } catch (error) {
        console.error("Failed to notify users in match:", error);
        return { success: false, error };
    }
}
