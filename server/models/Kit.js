import mongoose from 'mongoose';

const kitSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true }
    },
    { timestamps: true }
);

const Kit = mongoose.model('Kit', kitSchema);

export default Kit;
