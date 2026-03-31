import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // positive for credits, negative for debits
    type: { 
        type: String, 
        enum: ['deposit', 'withdrawal', 'bet_placed', 'winnings', 'refund', 'bonus', 'commission'], 
        required: true 
    },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'completed' 
    },
    referenceId: { type: String }, // Optional ID to link to a match or external transaction
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
