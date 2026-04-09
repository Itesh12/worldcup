import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'subadmin', 'player'], default: 'user' },
    parentAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If role is subadmin
    assignedSubAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If user is linked to a subadmin
    commissionEarned: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    image: { type: String },
    passwordResetCode: { type: String },
    walletBalance: { type: Number, default: 0 },
    withdrawalMethods: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        type: { type: String, enum: ['upi', 'bank'], required: true },
        label: { type: String, required: true },
        details: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    lastLogin: { type: Date }
}, { timestamps: true });

// In development, ensure we reload the model to pick up schema changes
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
