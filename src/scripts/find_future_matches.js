const mongoose = require('mongoose');
const MatchSchema = new mongoose.Schema({ startTime: Date, status: String, teams: Array });
const Match = mongoose.model('Match', MatchSchema);

async function run() {
    try {
        await mongoose.connect('mongodb+srv://Kruti98:Kruti98.@cluster0.lkh2x.mongodb.net/worldcup?retryWrites=true&w=majority');
        const now = new Date();
        const matches = await Match.find({ status: 'upcoming', startTime: { $gt: now } }).sort({ startTime: 1 }).limit(10);
        console.log(JSON.stringify(matches, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
