import express from 'express';
import cors from 'cors';
import connectDB from "./db/connection.js";
import authRoutes from './routes/auth.js';
import equipmentRoutes from './routes/equipment.js';
import cableRoutes from './routes/cable.js';
import userRoutes from './routes/user.js';

const app = express();
app.use(cors());
app.use(express.json());

// Main Equipment, Cables & Auth APIs
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/products', equipmentRoutes); // Compatibility alias
app.use('/api/cables', cableRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);

if (process.loadEnvFile && (!process.env.JWT_SECRET || !process.env.PORT)) {
    try {
        process.loadEnvFile();
    } catch {
        // .env file might already be loaded via CLI or not present in container
    }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on http://localhost:${PORT}`);
});