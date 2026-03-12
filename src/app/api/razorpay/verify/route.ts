import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount // amount in INR
    } = await req.json();

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is verified
      await connectDB();
      const userId = (session.user as any).id;

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { new: true }
      );

      await Transaction.create({
        userId,
        amount,
        type: 'deposit',
        description: `Razorpay Deposit (${razorpay_payment_id})`,
        status: 'completed',
        referenceId: razorpay_payment_id
      });

      return NextResponse.json({
        message: "Payment verified successfully",
        balance: user.walletBalance
      });
    } else {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Razorpay Verification API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
