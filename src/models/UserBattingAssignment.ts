import mongoose from 'mongoose';

const UserBattingAssignmentSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inningsNumber: { type: Number, enum: [1, 2], required: true },
    position: { type: Number, required: true },
}, { timestamps: true });

// Ensure a user is assigned to only one slot per match/innings,
// and a slot has only one user.
UserBattingAssignmentSchema.index({ matchId: 1, userId: 1, inningsNumber: 1 }, { unique: true });
UserBattingAssignmentSchema.index({ matchId: 1, inningsNumber: 1, position: 1 }, { unique: true });

export default mongoose.models.UserBattingAssignment || mongoose.model('UserBattingAssignment', UserBattingAssignmentSchema);
