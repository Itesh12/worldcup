import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemLog extends Document {
    type: 'sync' | 'reveal' | 'settle' | 'payout' | 'repair' | 'error';
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: any;
    resourceId?: string; // e.g. matchId or arenaId
    timestamp: Date;
}

const SystemLogSchema: Schema = new Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ['sync', 'reveal', 'settle', 'payout', 'repair', 'error'] 
    },
    status: { 
        type: String, 
        required: true, 
        enum: ['success', 'error', 'warning'] 
    },
    message: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    resourceId: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Index for fast retrieval of recent logs and health checks
SystemLogSchema.index({ type: 1, timestamp: -1 });
SystemLogSchema.index({ timestamp: -1 });

export default mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);
