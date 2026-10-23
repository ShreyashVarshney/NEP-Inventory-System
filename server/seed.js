import bcrypt from 'bcrypt';
import User from './models/User.js';
import Equipment from './models/Equipment.js';
import Cable from './models/Cable.js';
import Kit from './models/Kit.js';
import connectDB from './db/connection.js';

const seedData = async () => {
    try {
        await connectDB();
        console.log("Seeding NEP Inventory System database...");

        // 1. Ensure Admin User
        let admin = await User.findOne({ email: "admin@gmail.com" });
        if (!admin) {
            const hashPassword = await bcrypt.hash("admin", 10);
            admin = new User({
                name: "System Admin",
                email: "admin@gmail.com",
                password: hashPassword,
                address: "NEP Broadcast Operations Hub",
                role: "admin"
            });
            await admin.save();
            console.log("✓ Admin user created: admin@gmail.com / admin");
        } else {
            console.log("✓ Admin user already exists");
        }

        // 2. Ensure Staff User
        let staff = await User.findOne({ email: "staff@nep.com" });
        if (!staff) {
            const hashPassword = await bcrypt.hash("staff123", 10);
            staff = new User({
                name: "NEP Broadcast Staff",
                email: "staff@nep.com",
                password: hashPassword,
                address: "NEP India OB Central Hub",
                role: "staff"
            });
            await staff.save();
            console.log("✓ Staff user created: staff@nep.com / staff123");
        }

        // 3. Ensure Client/Customer User
        let customer = await User.findOne({ email: "client@gmail.com" });
        if (!customer) {
            const hashPassword = await bcrypt.hash("client123", 10);
            customer = new User({
                name: "Production Studio Client",
                email: "client@gmail.com",
                password: hashPassword,
                address: "Studio 4, Downtown",
                role: "customer"
            });
            await customer.save();
            console.log("✓ Customer user created: client@gmail.com / client123");
        }

        // 4. Ensure Default Kits
        const defaultKits = [
            "Main Central Depot",
            "OB Van 1 - Production Unit",
            "OB Van 2 - Sports Unit",
            "Studio Floor A",
            "Studio Floor B",
            "PCR Control Room",
            "Flypack Kit 1",
            "Client Return / Rental",
            "Central Engineering Lab"
        ];
        for (const kitName of defaultKits) {
            const exists = await Kit.findOne({ name: kitName });
            if (!exists) {
                await Kit.create({ name: kitName });
            }
        }
        console.log(`✓ Verified standard origin kits`);

        console.log("All seed data applied successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();