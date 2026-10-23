import { useState, useEffect } from "react";
import axios from "axios";
import {
    FaUserCircle,
    FaLock,
    FaEnvelope,
    FaMapMarkerAlt,
    FaUserShield,
    FaSave,
    FaKey
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
    const { user, login } = useAuth();
    const token = localStorage.getItem("pos-token");

    const [loading, setLoading] = useState(false);
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Profile form
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get("/api/users/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data?.success) {
                    const u = response.data.user;
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setAddress(u.address || "");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmittingProfile(true);

        try {
            const response = await axios.put(
                "/api/users/profile",
                { name, email, address },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showMessage("success", "Profile updated successfully!");
                // Update AuthContext state
                login(response.data.user, token);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showMessage("error", error.response?.data?.message || "Failed to update profile.");
        } finally {
            setSubmittingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showMessage("error", "New passwords do not match.");
            return;
        }

        if (newPassword.length < 4) {
            showMessage("error", "Password must be at least 4 characters long.");
            return;
        }

        setSubmittingPassword(true);
        try {
            const response = await axios.put(
                "/api/users/profile",
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showMessage("success", "Password changed successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            showMessage("error", error.response?.data?.message || "Failed to change password.");
        } finally {
            setSubmittingPassword(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FaUserCircle className="text-green-600" /> Account Settings & Profile
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Manage your personal account details, contact info, and security credentials.
                </p>
            </div>

            {/* Notification Alert */}
            {message.text && (
                <div
                    className={`mb-6 p-4 rounded-lg text-sm font-medium transition-all ${
                        message.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-inner">
                            {name ? name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{name || "Administrator"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{email}</p>

                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <FaUserShield /> {user?.role ? user.role.toUpperCase() : "ADMIN"}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-3 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <FaEnvelope className="text-gray-400" />
                                <span className="truncate">{email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-gray-400" />
                                <span className="truncate">{address || "No address specified"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Forms Section */}
                <div className="md:col-span-2 space-y-6">
                    {/* Edit Profile Form */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaUserCircle className="text-green-600" /> Personal Information
                        </h3>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={submittingProfile}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={submittingProfile}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location / Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Warehouse, City, State"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    disabled={submittingProfile}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingProfile}
                                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FaSave /> {submittingProfile ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password Form */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaKey className="text-amber-600" /> Security & Password
                        </h3>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter current password"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    disabled={submittingPassword}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Min 4 characters"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        disabled={submittingPassword}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Repeat new password"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={submittingPassword}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingPassword}
                                    className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FaLock /> {submittingPassword ? "Updating Password..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
