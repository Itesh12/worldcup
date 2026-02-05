import mongoose from 'mongoose';

const UserMatchStatsSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalRuns: { type: Number, default: 0 },
    totalBalls: { type: Number, default: 0 },
    rank: { type: Number },
}, { timestamps: true });

UserMatchStatsSchema.index({ matchId: 1, userId: 1 }, { unique: true });

export default mongoose.models.UserMatchStats || mongoose.model('UserMatchStats', UserMatchStatsSchema);
