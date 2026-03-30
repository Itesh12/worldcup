const mongoose = require('mongoose');
require('dotenv').config();

const MatchSchema = new mongoose.Schema({
    status: String,
    tournamentId: mongoose.Schema.Types.ObjectId
});

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const allStatuses = await Match.distinct('status');
        console.log('Unique statuses in DB:', allStatuses);
        
        const count = await Match.countDocuments();
        console.log('Total matches:', count);
        
        const finished = await Match.find({ 
            status: { $in: ['finished', 'completed', 'result', 'settled'] } 
        }).limit(5);
        console.log('Sample finished matches:', JSON.stringify(finished, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
