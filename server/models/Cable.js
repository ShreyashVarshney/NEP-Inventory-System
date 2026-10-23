import mongoose from 'mongoose';

const cableSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        cableTag: { type: String, required: true, uppercase: true, trim: true },
        category: {
            type: String,
            required: true,
            trim: true,
            default: 'SMPTE 311M Hybrid Fiber'
        },
        length: { type: String, trim: true, default: '100m' },
        status: {
            type: String,
            enum: ['Working Fine', 'Faulty', 'Need to be sent to repair', 'Under Maintenance'],
            default: 'Working Fine'
        },
        pairingStatus: {
            type: String,
            enum: ['Cable Pending', 'Need to be Paired', 'Paired', 'Single / Standalone'],
            default: 'Cable Pending'
        },
        pairedWith: { type: String, trim: true, default: '' },
        pairedCableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cable', default: null },
        kitComingFrom: {
            type: String,
            default: 'Main Central Depot',
            trim: true
        },
        currentLocation: { type: String, default: 'Main Central Depot', trim: true },
        date: {
            type: String,
            default: () => new Date().toISOString().slice(0, 10)
        },
        time: {
            type: String,
            default: () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        },
        notes: { type: String, trim: true, default: '' },
        comments: { type: String, trim: true, default: '' },
        comment: { type: String, trim: true, default: '' }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Cable = mongoose.model('Cable', cableSchema);

export default Cable;
