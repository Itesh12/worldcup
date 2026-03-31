import mongoose from 'mongoose';

const TournamentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    cricbuzzSeriesId: { type: String, required: true },
    cricbuzzSlug: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    commissionPercentage: { type: Number, default: 0 },
    entryFee: { type: Number }, // No longer strictly required or default 50
    startDate: { type: Date },
    endDate: { type: Date }
}, { timestamps: true });

// Ensure only one tournament can be highly active if we wanted, 
// but for our multi-tenant setup, multiple can exist, UI just needs to pick one

export default mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
