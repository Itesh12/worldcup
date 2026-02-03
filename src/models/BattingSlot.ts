import mongoose from 'mongoose';

const BattingSlotSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    inningsNumber: { type: Number, enum: [1, 2], required: true },
    position: { type: Number, required: true }, // 1, 2, 3...
}, { timestamps: true });

// Ensure unique slot per match, innings, and position
BattingSlotSchema.index({ matchId: 1, inningsNumber: 1, position: 1 }, { unique: true });

export default mongoose.models.BattingSlot || mongoose.model('BattingSlot', BattingSlotSchema);
