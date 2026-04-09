import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log("❌ [AUTH] Missing Credentials");
                    throw new Error("Invalid credentials");
                }

                await connectDB();
                const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });

                if (!user || !user.password) {
                    console.log(`❌ [AUTH] User not found: ${credentials.email}`);
                    throw new Error("User not found");
                }

                const isValid = await bcrypt.compare(credentials.password.trim(), user.password);

                if (!isValid) {
                    console.log(`❌ [AUTH] Password Mismatch for: ${credentials.email}`);
                    throw new Error("Invalid password");
                }

                if (user.isBanned) {
                    console.log(`❌ [AUTH] Blocked (Banned): ${credentials.email}`);
                    throw new Error("Your account has been banned. Please contact support.");
                }

                console.log(`✅ [AUTH] Success: ${credentials.email} [${user.role}]`);

                // Update Last Login
                user.lastLogin = new Date();
                await user.save();

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                    lastLogin: user.lastLogin
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
                token.picture = user.image;
            }

            if (trigger === "update" && session) {
                token.name = session.name;
                token.picture = session.image;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                session.user.image = token.picture;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
