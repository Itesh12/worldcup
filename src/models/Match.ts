import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    externalMatchId: { type: String, required: true, unique: true },
    teams: [{
        name: { type: String, required: true },
        shortName: { type: String, required: true },
        logo: { type: String }
    }],
    status: { type: String, enum: ['upcoming', 'live', 'finished', 'completed', 'result', 'settled'], default: 'upcoming' },
    startTime: { type: Date, required: true },
    venue: { type: String },
    result: { type: String },
    matchDesc: { type: String }, // e.g. "4th Match"
    seriesName: { type: String }, // e.g. "IPL 2026"
    liveScore: {
        team1Score: { type: String },
        team2Score: { type: String },
        statusText: { type: String },
        lastUpdated: { type: Date }
    },
    adminCommissionEarned: { type: Number, default: 0 },
    entryFee: { type: Number },
    commissionPercentage: { type: Number }
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
