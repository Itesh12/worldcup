const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Models (Minimal Schemas for Seeding) ---
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'subadmin', 'user'], default: 'user' },
    balance: { type: Number, default: 0 },
    commissionEarned: { type: Number, default: 0 }
}, { timestamps: true });

const SubAdminConfigSchema = new mongoose.Schema({
    subAdminId: mongoose.Schema.Types.ObjectId,
    totalCommissionEarned: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
}, { timestamps: true });

const ArenaSchema = new mongoose.Schema({
    matchId: mongoose.Schema.Types.ObjectId,
    tournamentId: mongoose.Schema.Types.ObjectId,
    createdBy: mongoose.Schema.Types.ObjectId,
    name: String,
    entryFee: Number,
    maxSlots: Number,
    slotsCount: { type: Number, default: 0 },
    organizerCommissionPercentage: { type: Number, default: 5 },
    adminCommissionPercentage: { type: Number, default: 10 },
    isRevealed: { type: Boolean, default: false },
    revealTime: Date,
    isPrivate: { type: Boolean, default: false },
    inviteCode: { type: String, unique: true, sparse: true },
    status: { type: String, default: 'open' }
}, { timestamps: true });

const AssignmentSchema = new mongoose.Schema({
    tournamentId: mongoose.Schema.Types.ObjectId,
    matchId: mongoose.Schema.Types.ObjectId,
    arenaId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    inningsNumber: { type: Number, default: 1 },
    position: Number,
    entryFee: Number
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    type: String,
    description: String,
    status: String,
    referenceId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Arena = mongoose.models.Arena || mongoose.model('Arena', ArenaSchema);
const SubAdminConfig = mongoose.models.SubAdminConfig || mongoose.model('SubAdminConfig', SubAdminConfigSchema);
const UserBattingAssignment = mongoose.models.UserBattingAssignment || mongoose.model('UserBattingAssignment', AssignmentSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function run() {
    try {
        const MONGODB_URI = 'mongodb+srv://Kruti98:Kruti98.@cluster0.lkh2x.mongodb.net/worldcup?retryWrites=true&w=majority';
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // --- Phase 1: Total Cleanup ---
        console.log("Cleaning up old data...");
        await User.deleteMany({ role: 'subadmin' });
        await SubAdminConfig.deleteMany({});
        await Arena.deleteMany({});
        await Transaction.deleteMany({});
        
        // Aggressive Cleanup: Drop collection to remove all legacy indexes
        console.log("Dropping UserBattingAssignment collection and recreating indexes...");
        await UserBattingAssignment.collection.drop().catch(() => {});
        await UserBattingAssignment.createIndexes();

        // Optional: Reset player balances if needed, but we want 50 fresh ones.
        // We'll delete players too to be absolutely clean.
        await User.deleteMany({ name: /^Player-/ }); 
        
        // --- Phase 2: Secure Identity Seeding ---
        console.log("Seeding Users...");
        const hashedPassword = await bcrypt.hash('Test@123', 12);
        
        // 5 Sub-Admins
        const subAdmins = [];
        for (let i = 1; i <= 5; i++) {
            const sa = await User.create({
                name: `Franchise-${i}`,
                email: `subadmin${i}@test.com`,
                password: hashedPassword,
                role: 'subadmin'
            });
            subAdmins.push(sa);
        }

        // 50 Players
        const players = [];
        for (let i = 1; i <= 50; i++) {
            const p = await User.create({
                name: `Player-${i}`,
                email: `player${i}@test.com`,
                password: hashedPassword,
                role: 'user',
                balance: 10000 // Give them starting money for testing
            });
            players.push(p);
        }

        const mainAdmin = await User.findOne({ role: 'admin' });
        if (!mainAdmin) throw new Error("No admin user found to seed arenas.");

        // --- Phase 3: Operational Arena Seeding ---
        console.log("Seeding Arenas...");
        const matchId = new mongoose.Types.ObjectId('69cb9b4c7218b49e6ce85203');
        const tournamentId = new mongoose.Types.ObjectId('69cb9b24307793da5b86ae39');
        const matchStartTime = new Date('2026-04-02T14:00:00.000Z');
        const revealTime = new Date(matchStartTime.getTime() - 30 * 60 * 1000);

        const arenaPool = [];

        // Admin Arenas (5)
        for (let i = 1; i <= 5; i++) {
            const slots = [2, 4, 6, 8, 10][i-1];
            const arena = await Arena.create({
                matchId,
                tournamentId,
                createdBy: mainAdmin._id,
                name: `Global Arena ${i} (${slots} Slots)`,
                entryFee: [100, 200, 500, 1000, 50][i-1],
                maxSlots: slots,
                adminCommissionPercentage: 10,
                organizerCommissionPercentage: 5,
                revealTime,
                isPrivate: false,
                status: 'open'
            });
            arenaPool.push(arena);
        }

        // Sub-Admin Arenas (10)
        for (const sa of subAdmins) {
            for (let j = 1; j <= 2; j++) {
                const slots = j === 1 ? 4 : 8;
                const arena = await Arena.create({
                    matchId,
                    tournamentId,
                    createdBy: sa._id,
                    name: `${sa.name} Challenge ${j}`,
                    entryFee: j === 1 ? 250 : 750,
                    maxSlots: slots,
                    adminCommissionPercentage: 10,
                    organizerCommissionPercentage: 5,
                    revealTime,
                    isPrivate: false,
                    status: 'open'
                });
                arenaPool.push(arena);
            }
        }

        // --- Phase 4: Dynamic Join & Partial Fill Simulation ---
        console.log("Joining Players to Arenas...");
        
        for (let i = 0; i < arenaPool.length; i++) {
            const arena = arenaPool[i];
            
            // Randomly fill some, partially fill others
            let fillCount = arena.maxSlots;
            if (i === 0 || i === 5 || i === 10) { // Specific indices for partial fill
                fillCount = Math.max(1, arena.maxSlots - Math.floor(Math.random() * 2) - 1); 
                console.log(`Intentionally partially filling ${arena.name}: ${fillCount}/${arena.maxSlots}`);
            }

            // Shuffle players and pick N
            const shuffled = [...players].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, fillCount);

            for (const player of selected) {
                // Join (minimal logic)
                await UserBattingAssignment.create({
                    arenaId: arena._id,
                    userId: player._id,
                    matchId: arena.matchId,
                    tournamentId: arena.tournamentId,
                    inningsNumber: 1, // Required by schema
                    entryFee: arena.entryFee
                });
                
                await Transaction.create({
                    userId: player._id,
                    amount: -arena.entryFee,
                    type: 'entry_fee',
                    description: `Joined Arena: ${arena.name}`,
                    status: 'completed',
                    referenceId: arena._id
                });

                await User.findByIdAndUpdate(player._id, { $inc: { balance: -arena.entryFee } });
            }
            
            await Arena.findByIdAndUpdate(arena._id, { 
                slotsCount: fillCount,
                status: fillCount === arena.maxSlots ? 'full' : 'open'
            });
        }

        // --- Phase 5: Private Contests ---
        console.log("Seeding Private Contests...");
        const leaders = [...players].sort(() => 0.5 - Math.random()).slice(0, 10);
        const privateContestsOutput = [];

        for (const leader of leaders) {
            const contestCount = Math.floor(Math.random() * 3) + 1; // 1-3 contests
            for (let k = 1; k <= contestCount; k++) {
                const slots = [2, 4, 6][Math.floor(Math.random() * 3)];
                const inviteCode = `PRIV-${leader.name.split('-')[1]}-${k}-${Math.random().toString(36).substring(7).toUpperCase()}`;
                
                const arena = await Arena.create({
                    matchId,
                    tournamentId,
                    createdBy: leader._id,
                    name: `${leader.name}'s Personal Battle ${k}`,
                    entryFee: 100 * k,
                    maxSlots: slots,
                    adminCommissionPercentage: 10,
                    organizerCommissionPercentage: 5,
                    revealTime,
                    isPrivate: true,
                    inviteCode,
                    status: 'open'
                });

                // Leader joins their own contest
                await UserBattingAssignment.create({
                    arenaId: arena._id,
                    userId: leader._id,
                    matchId: arena.matchId,
                    tournamentId: arena.tournamentId,
                    inningsNumber: 1,
                    entryFee: arena.entryFee
                });
                await User.findByIdAndUpdate(leader._id, { $inc: { balance: -arena.entryFee } });
                
                // 3-5 others join
                const othersCount = Math.min(slots - 1, Math.floor(Math.random() * 3) + 2); // 2-4 others
                const otherPlayers = [...players].filter(p => p._id !== leader._id).sort(() => 0.5 - Math.random()).slice(0, othersCount);
                
                for (const p of otherPlayers) {
                    await UserBattingAssignment.create({
                        arenaId: arena._id,
                        userId: p._id,
                        matchId: arena.matchId,
                        tournamentId: arena.tournamentId,
                        inningsNumber: 1,
                        entryFee: arena.entryFee
                    });
                    await User.findByIdAndUpdate(p._id, { $inc: { balance: -arena.entryFee } });
                }

                await Arena.findByIdAndUpdate(arena._id, { 
                    slotsCount: othersCount + 1,
                    status: (othersCount + 1) === slots ? 'full' : 'open'
                });

                privateContestsOutput.push({
                    leader: leader.name,
                    arena: arena.name,
                    inviteCode,
                    slots: arena.maxSlots,
                    filled: othersCount + 1
                });
            }
        }

        console.log("\n--- SEEDING COMPLETE ---");
        console.log("PRIVATE CONTESTS SUMMARY:");
        console.table(privateContestsOutput);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
