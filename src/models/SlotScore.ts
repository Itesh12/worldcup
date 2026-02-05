import mongoose from 'mongoose';

const SlotScoreSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    inningsNumber: { type: Number, enum: [1, 2], required: true },
    position: { type: Number, required: true },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    isOut: { type: Boolean, default: false },
}, { timestamps: true });

SlotScoreSchema.index({ matchId: 1, inningsNumber: 1, position: 1 }, { unique: true });

export default mongoose.models.SlotScore || mongoose.model('SlotScore', SlotScoreSchema);
