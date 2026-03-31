import mongoose from 'mongoose';

const ArenaSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin, SubAdmin, or User
    name: { type: String, required: true },
    description: { type: String },
    entryFee: { type: Number, required: true, default: 0 },
    maxSlots: { type: Number, required: true, default: 11 }, // Total available positions (e.g., 11 per innings)
    slotsCount: { type: Number, default: 0 }, // Current number of joined players
    
    // Revenue share settings
    organizerCommissionPercentage: { type: Number, default: 0 }, // What the 'createdBy' user gets
    adminCommissionPercentage: { type: Number, default: 0 }, // What the platform admin gets
    
    // Status & Reveal Logic
    isRevealed: { type: Boolean, default: false }, // Controlled by the T-30 minute logic
    revealTime: { type: Date }, // Automatically set to matchStartTime - 30 mins
    
    isPrivate: { type: Boolean, default: false },
    inviteCode: { type: String, unique: true, sparse: true }, // For private arenas
    
    status: { type: String, enum: ['open', 'full', 'locked', 'revealed', 'completed'], default: 'open' }
}, { timestamps: true });

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Arena;
}

export default mongoose.models.Arena || mongoose.model('Arena', ArenaSchema);
