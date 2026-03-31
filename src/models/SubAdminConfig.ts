import mongoose from 'mongoose';

const SubAdminConfigSchema = new mongoose.Schema({
    subAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    brandName: { type: String, required: true }, // The 'League' name they use
    logo: { type: String },
    commissionPercentage: { type: Number, default: 5 }, // Share of the prize pool they take
    totalCommissionEarned: { type: Number, default: 0 },
    allowedToCreateArenas: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure we reload the model in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.SubAdminConfig;
}

export default mongoose.models.SubAdminConfig || mongoose.model('SubAdminConfig', SubAdminConfigSchema);
