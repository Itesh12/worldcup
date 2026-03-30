import mongoose from 'mongoose';
import Match from './src/models/Match';
import dotenv from 'dotenv';
dotenv.config();

async function checkMatches() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const matches = await Match.find({}).limit(50);
    console.log('Total matches in DB:', await Match.countDocuments());
    console.log('Match Statuses:', await Match.distinct('status'));
    
    const finishedCount = await Match.countDocuments({ 
        status: { $in: ['finished', 'completed', 'result', 'settled'] } 
    });
    console.log('Finished matches count:', finishedCount);
    
    if (matches.length > 0) {
        console.log('Sample Match:', JSON.stringify(matches[0], null, 2));
    }
    
    process.exit(0);
}

checkMatches();
