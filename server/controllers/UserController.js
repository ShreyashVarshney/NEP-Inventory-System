import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const getUsers = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Administrators can access user directory.' });
        }
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
};

export const addUser = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Administrators can create new user accounts.' });
        }
        const { name, email, password, address, role = 'customer' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            address: address || '',
            role: role || 'customer'
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ success: false, message: 'Server error adding user' });
    }
};

export const updateUser = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Administrators can update user accounts.' });
        }
        const { id } = req.params;
        const { name, email, address, role, password } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (address !== undefined) updateData.address = address;
        if (role) updateData.role = role;

        if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, message: 'Email is already taken by another account.' });
            }
            updateData.email = normalizedEmail;
        }

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!updated) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User updated successfully', user: updated });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, message: 'Server error updating user' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Administrators can delete user accounts.' });
        }
        const { id } = req.params;

        // Prevent self deletion
        if (req.user && req.user._id.toString() === id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        }

        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting user' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error getting profile:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email, address, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name.trim();
        if (address !== undefined) user.address = address;

        if (email && email.trim().toLowerCase() !== user.email) {
            const normalized = email.trim().toLowerCase();
            const duplicate = await User.findOne({ email: normalized, _id: { $ne: user._id } });
            if (duplicate) {
                return res.status(400).json({ success: false, message: 'Email is already in use.' });
            }
            user.email = normalized;
        }

        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Incorrect current password.' });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
};
