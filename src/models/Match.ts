import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
    externalMatchId: { type: String, required: true, unique: true },
    teams: [{
        name: { type: String, required: true },
        shortName: { type: String, required: true },
        logo: { type: String }
    }],
    status: { type: String, enum: ['upcoming', 'live', 'finished', 'completed', 'result', 'settled'], default: 'upcoming' },
    startTime: { type: Date, required: true },
    venue: { type: String },
    result: { type: String }
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
