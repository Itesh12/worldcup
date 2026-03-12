import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// GET: List all saved payout methods
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById((session.user as any).id).select('withdrawalMethods');
        
        if (user && !user.withdrawalMethods) {
            user.withdrawalMethods = [];
        }

        return NextResponse.json(user?.withdrawalMethods || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a new payout method
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = (session.user as any).id;
        
        const { type, label, details, isDefault } = await req.json();

        if (!type || !label || !details) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newMethod = { 
            _id: new mongoose.Types.ObjectId(),
            type, 
            label, 
            details, 
            isDefault: isDefault || false 
        };

        // If marked as default, reset others first
        if (newMethod.isDefault) {
            await User.updateOne(
                { _id: userId },
                { $set: { "withdrawalMethods.$[].isDefault": false } }
            );
        }

        // Use findOneAndUpdate to ensure the field is created and updated atomically
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { 
                $push: { withdrawalMethods: newMethod },
                $setOnInsert: { walletBalance: 0 } // Just a safety, not expected to insert
            },
            { 
                new: true, 
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        // Ensure at least one is default if none was set
        if (updatedUser.withdrawalMethods.length === 1 && !updatedUser.withdrawalMethods[0].isDefault) {
            updatedUser.withdrawalMethods[0].isDefault = true;
            await updatedUser.save();
        }

        console.log(`Saved payout method for user ${userId}:`, newMethod);

        return NextResponse.json({ 
            message: "Method added successfully", 
            methods: updatedUser.withdrawalMethods 
        });
    } catch (error: any) {
        console.error("POST Payout Method Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a payout method
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { methodId } = await req.json();

        await connectDB();
        const user = await User.findById((session.user as any).id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (!user.withdrawalMethods) user.withdrawalMethods = [];

        user.withdrawalMethods = user.withdrawalMethods.filter((m: any) => m._id.toString() !== methodId);
        
        // Ensure at least one is default if list not empty
        if (user.withdrawalMethods.length > 0 && !user.withdrawalMethods.some((m: any) => m.isDefault)) {
            user.withdrawalMethods[0].isDefault = true;
        }

        await user.save();

        return NextResponse.json({ message: "Method deleted successfully", methods: user.withdrawalMethods });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// PATCH: Set a payout method as default
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { methodId } = await req.json();
        if (!methodId) {
            return NextResponse.json({ error: "Method ID is required" }, { status: 400 });
        }

        await connectDB();
        const userId = (session.user as any).id;

        // Atomic update: reset all isDefault to false, then set the specific one to true
        await User.updateOne(
            { _id: userId },
            { $set: { "withdrawalMethods.$[].isDefault": false } }
        );

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, "withdrawalMethods._id": methodId },
            { $set: { "withdrawalMethods.$.isDefault": true } },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "Method not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            message: "Default method updated", 
            methods: updatedUser.withdrawalMethods 
        });
    } catch (error: any) {
        console.error("PATCH Payout Method Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
