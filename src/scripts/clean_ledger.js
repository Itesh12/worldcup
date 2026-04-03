const mongoose = require('mongoose');

async function clean() {
    const MONGODB_URI = 'mongodb+srv://Kruti98:Kruti98.@cluster0.lkh2x.mongodb.net/worldcup?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for Audit Ledger Cleanup...");

    const UserSchema = new mongoose.Schema({ role: String });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const TransactionSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, type: String });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

    // 1. Identify users who are NOT authorized to earn commission (Regular Players)
    const unauthorizedUsers = await User.find({ role: 'user' }).select('_id');
    const playerIds = unauthorizedUsers.map(p => p._id);

    // 2. Remove incorrect 'commission' type transactions for these players
    const result = await Transaction.deleteMany({
        type: 'commission',
        userId: { $in: playerIds }
    });

    console.log(`✅ Cleanup Complete: Removed ${result.deletedCount} invalid player commission records from the Audit Ledger.`);
    process.exit(0);
}

clean().catch(e => {
    console.error("Cleanup Error:", e);
    process.exit(1);
});
