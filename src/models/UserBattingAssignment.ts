import mongoose from 'mongoose';

const UserBattingAssignmentSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    arenaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Arena', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inningsNumber: { type: Number, enum: [1, 2], required: true },
    position: { type: Number }, // Hidden until T-30 reveal
}, { timestamps: true });

// Ensure a user is assigned to only one slot per arena overall.
// This supports the blind draft model where inning/position are assigned at reveal.
UserBattingAssignmentSchema.index({ arenaId: 1, userId: 1 }, { unique: true });
UserBattingAssignmentSchema.index({ arenaId: 1, inningsNumber: 1, position: 1 }, { 
    unique: true, 
    partialFilterExpression: { position: { $type: "number" } } 
});

export default mongoose.models.UserBattingAssignment || mongoose.model('UserBattingAssignment', UserBattingAssignmentSchema);
