import mongoose from 'mongoose';
import connectDB from '../src/lib/db';
import User from '../src/models/User';
import Tournament from '../src/models/Tournament';
import Match from '../src/models/Match';
import Arena from '../src/models/Arena';
import Transaction from '../src/models/Transaction';
import UserBattingAssignment from '../src/models/UserBattingAssignment';
import { performMatchSync } from '../src/lib/matchSync';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
    try {
        console.log("🚀 STARTING OFFICIAL IPL 2026 SEEDING (TODAY ONLY) 🚀");
        await connectDB();

        // 1. LEAGUE ACTIVATION
        console.log("[1/5] Activating IPL 2026...");
        const tournament = await Tournament.findOneAndUpdate(
            { cricbuzzSeriesId: "9241" },
            { 
                name: "IPL 2026", 
                cricbuzzSlug: "ipl-2026", 
                isActive: true, 
                commissionPercentage: 10 
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Tournament Created: ${tournament.name}`);

        // 2. FULL MATCH SYNC
        console.log("[2/5] Syncing all matches for the league...");
        await performMatchSync(tournament._id.toString());
        const allMatches = await Match.find({ tournamentId: tournament._id });
        console.log(`✅ Synced ${allMatches.length} matches.`);

        // 3. USER GENERATION
        console.log("[3/5] Generating 56 Users (Hashed)...");
        const hashedPW = await bcrypt.hash("Test@123", 10);
        
        // Admin
        const admin = await User.findOneAndUpdate(
            { email: 'admin@worldcup.com' },
            { name: 'Global Admin', password: hashedPW, role: 'admin', walletBalance: 0 },
            { upsert: true, new: true }
        );

        // Sub-Admins
        const subAdmins = [];
        for (let i = 1; i <= 5; i++) {
            const sa = await User.findOneAndUpdate(
                { email: `subadmin${i}@worldcup.com` },
                { name: `Sub Admin ${i}`, password: hashedPW, role: 'subadmin', walletBalance: 0 },
                { upsert: true, new: true }
            );
            subAdmins.push(sa);
        }

        // Players
        const players = [];
        for (let i = 1; i <= 50; i++) {
            const p = await User.findOneAndUpdate(
                { email: `player${i}@worldcup.com` },
                { name: `Pro Player ${i}`, password: hashedPW, role: 'player', walletBalance: 10000 },
                { upsert: true, new: true }
            );
            players.push(p);
        }
        console.log(`✅ 56 Users (1 Admin, 5 Sub, 50 Players) are ready.`);

        // 4. TODAY'S MATCH FILTER
        const today = new Date();
        const startOfDay = new Date(today.setHours(0,0,0,0));
        const endOfDay = new Date(today.setHours(23,59,59,999));
        
        const todayMatches = await Match.find({
            tournamentId: tournament._id,
            startTime: { $gte: startOfDay, $lte: endOfDay }
        });

        if (todayMatches.length === 0) {
            console.warn("⚠️ No matches found for TODAY. Falling back to the closest upcoming match for testing.");
            const upcoming = await Match.findOne({ tournamentId: tournament._id, status: 'upcoming' }).sort({ startTime: 1 });
            if (upcoming) todayMatches.push(upcoming);
        }

        if (todayMatches.length === 0) {
            console.error("❌ No matches available in the system. Cannot create arenas.");
            process.exit(1);
        }

        console.log(`✅ Targeted ${todayMatches.length} Matches for Arena Creation.`);

        // 5. ARENA GENERATION & JOINING
        console.log("[4/5] Creating 270 Arenas and performing joins...");
        let arenaCount = 0;
        let joinCount = 0;
        const slotOptions = [2, 4, 6, 8, 10];

        // Helper to create & join
        const createAndPopulateArena = async (matchId: any, createdBy: any, name: string, isPrivate = false) => {
            const maxSlots = slotOptions[Math.floor(Math.random() * slotOptions.length)];
            const inviteCode = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined;
            
            const arenaData: any = {
                tournamentId: tournament._id,
                matchId,
                name,
                entryFee: 100,
                maxSlots,
                slotsCount: 0,
                isPrivate,
                createdBy: createdBy._id,
                status: 'open',
                revealTime: new Date(Date.now() + 600000) // Reveal in 10 mins for test
            };
            if (inviteCode) arenaData.inviteCode = inviteCode;

            const arena = await Arena.create(arenaData);
            arenaCount++;

            // Perform Joins
            // Target Fill: Min 2, Max maxSlots
            const fillCount = Math.max(2, Math.floor(Math.random() * (maxSlots + 1)));
            const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
            const candidates = shuffledPlayers.slice(0, fillCount);

            for (const player of candidates) {
                // Wallet Logic
                await User.findByIdAndUpdate(player._id, { $inc: { walletBalance: -arena.entryFee } });
                
                await Transaction.create({
                    userId: player._id,
                    amount: -arena.entryFee,
                    type: 'bet_placed',
                    description: `Contest Entry: ${arena.name}`,
                    status: 'completed',
                    referenceId: arena._id.toString()
                });

                await UserBattingAssignment.create({
                    tournamentId: tournament._id,
                    matchId,
                    arenaId: arena._id,
                    userId: player._id,
                    inningsNumber: 1,
                    position: null
                });

                arena.slotsCount += 1;
                joinCount++;
            }

            if (arena.slotsCount === arena.maxSlots) arena.status = 'full';
            await arena.save();
        };

        // 10 Admin public arenas
        for (let i = 1; i <= 10; i++) {
            const match = todayMatches[i % todayMatches.length];
            await createAndPopulateArena(match._id, admin, `Admin Pro League ${i}`);
        }

        // 10 Sub-Admin public arenas
        for (let i = 1; i <= 10; i++) {
            const sa = subAdmins[i % subAdmins.length];
            const match = todayMatches[i % todayMatches.length];
            await createAndPopulateArena(match._id, sa, `Masters Contest ${i}`);
        }

        // 250 Player private arenas (5 per player)
        for (const player of players) {
            for (let i = 1; i <= 5; i++) {
                const match = todayMatches[i % todayMatches.length];
                await createAndPopulateArena(match._id, player, `${player.name.split(' ')[2]}'s Private Arena ${i}`, true);
            }
        }

        console.log(`✅ SUCCESS: Created ${arenaCount} Arenas.`);
        console.log(`✅ SUCCESS: Simulated ${joinCount} User Joins with full financial audit.`);
        console.log("🚀 ECOSYSTEM RESET & SEED COMPLETE 🚀");

    } catch (err) {
        console.error("SEEDING FAILED:", err);
    } finally {
        process.exit(0);
    }
}

seed();
