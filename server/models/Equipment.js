import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        model: { type: String, trim: true, default: '' },
        serialNumber: { type: String, trim: true, default: '' },
        sku: { type: String, required: true, uppercase: true, trim: true },
        status: {
            type: String,
            enum: [
                'Working Fine',
                'Faulty',
                'Need to be sent to repair',
                'Under Maintenance',
                'Need to be sent to',
                'Available',
                'In Use',
                'Dispatched',
                'Retired'
            ],
            default: 'Working Fine'
        },
        conditionStatus: {
            type: String,
            default: 'Working Fine'
        },
        date: {
            type: String,
            default: () => new Date().toISOString().slice(0, 10)
        },
        time: {
            type: String,
            default: () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        },
        kitComingFrom: {
            type: String,
            default: 'Main Warehouse',
            trim: true
        },
        currentLocation: { type: String, default: 'Main Warehouse', trim: true },
        quantity: { type: Number, default: 1, min: 0 },
        description: { type: String, trim: true, default: '' },
        comments: { type: String, trim: true, default: '' },
        comment: { type: String, trim: true, default: '' }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Map to existing 'products' collection so all data is preserved
const Equipment = mongoose.model('Equipment', equipmentSchema, 'products');

export default Equipment;
export { Equipment, Equipment as Product };
