import mongoose from 'mongoose';

const BattingResolutionSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    inningsNumber: { type: Number, enum: [1, 2], required: true },
    position: { type: Number, required: true },
    actualPlayerId: { type: String, required: true }, // ID from external API
    playerName: { type: String, required: true }
}, { timestamps: true });

BattingResolutionSchema.index({ matchId: 1, inningsNumber: 1, position: 1 }, { unique: true });

export default mongoose.models.BattingResolution || mongoose.model('BattingResolution', BattingResolutionSchema);
