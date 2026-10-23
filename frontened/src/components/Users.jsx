import { useEffect, useState } from "react";
import axios from "axios";
import {
    FaUsers,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaUserShield,
    FaUserTag,
    FaTimes,
    FaEnvelope,
    FaMapMarkerAlt
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [message, setMessage] = useState({ type: "", text: "" });

    // Add / Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        address: "",
        role: "customer"
    });

    const token = localStorage.getItem("pos-token");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to load users."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            address: "",
            role: "customer"
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (u) => {
        setIsEditing(true);
        setCurrentId(u._id);
        setFormData({
            name: u.name || "",
            email: u.email || "",
            password: "",
            address: u.address || "",
            role: u.role || "customer"
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEditing) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;

                const response = await axios.put(
                    `/api/users/${currentId}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    showMessage("success", "User updated successfully!");
                    setIsModalOpen(false);
                    fetchUsers();
                }
            } else {
                const response = await axios.post(
                    "/api/users",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    showMessage("success", "User created successfully!");
                    setIsModalOpen(false);
                    fetchUsers();
                }
            }
        } catch (error) {
            console.error("Error saving user:", error);
            showMessage("error", error.response?.data?.message || "Failed to save user.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (currentUser?.id === id) {
            alert("You cannot delete your own currently logged-in account.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) {
            return;
        }

        try {
            const response = await axios.delete(`/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                showMessage("success", "User deleted successfully!");
                setUsers(users.filter((u) => u._id !== id));
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            showMessage("error", error.response?.data?.message || "Failed to delete user.");
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesQuery =
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesQuery && matchesRole;
    });

    const adminCount = users.filter((u) => u.role === "admin").length;
    const customerCount = users.filter((u) => u.role === "customer").length;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUsers className="text-green-600" /> User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Control system access, user credentials, roles, and administrative permissions.
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleOpenAdd}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm shadow-sm flex items-center gap-2 transition"
                    >
                        <FaPlus /> Add New User
                    </button>
                </div>
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

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <p className="text-xs uppercase font-semibold text-gray-500">Total Registered Users</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <p className="text-xs uppercase font-semibold text-purple-600 flex items-center gap-1">
                        <FaUserShield /> Administrators
                    </p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{adminCount}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <p className="text-xs uppercase font-semibold text-green-600 flex items-center gap-1">
                        <FaUserTag /> Customers / Staff
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{customerCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-xs font-medium text-gray-500">Role:</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="customer">Customer</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                    <p className="text-sm">Loading users list...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                    <FaUsers className="mx-auto text-4xl text-gray-300 mb-2" />
                    <p className="font-medium text-gray-700">No users found</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {searchTerm ? "No users match your search." : "Create a new user account."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100/75 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                                    <th className="py-3.5 px-4">User</th>
                                    <th className="py-3.5 px-4">Email</th>
                                    <th className="py-3.5 px-4">Address</th>
                                    <th className="py-3.5 px-4">Role</th>
                                    <th className="py-3.5 px-4">Created Date</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredUsers.map((u) => {
                                    const isSelf = currentUser?.id === u._id;
                                    return (
                                        <tr key={u._id} className="hover:bg-gray-50/75 transition">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                                                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                                            {u.name}
                                                            {isSelf && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-1.5 py-0.2 rounded">
                                                                    You
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-gray-600">
                                                <span className="flex items-center gap-1.5">
                                                    <FaEnvelope className="text-gray-400 text-[11px]" /> {u.email}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-gray-500">
                                                {u.address ? (
                                                    <span className="flex items-center gap-1 truncate max-w-xs">
                                                        <FaMapMarkerAlt className="text-gray-400 shrink-0" /> {u.address}
                                                    </span>
                                                ) : (
                                                    <span className="italic text-gray-400">None</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        u.role === "admin"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : u.role === "staff"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-green-100 text-green-800"
                                                    }`}
                                                >
                                                    {u.role === "admin" ? <FaUserShield className="text-[10px]" /> : <FaUserTag className="text-[10px]" />}
                                                    {u.role === "staff" ? "Staff" : (u.role === "admin" ? "Admin" : "Customer")}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-gray-500">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(u)}
                                                    className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-md font-medium transition"
                                                    title="Edit User"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                {!isSelf && (
                                                    <button
                                                        onClick={() => handleDelete(u._id, u.name)}
                                                        className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-md font-medium transition"
                                                        title="Delete User"
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add / Edit User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaUsers className="text-green-600" />
                                {isEditing ? "Edit User" : "Create New User"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Jane Cooper"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {isEditing ? "New Password (leave empty to keep current)" : "Password *"}
                                </label>
                                <input
                                    type="password"
                                    placeholder={isEditing ? "••••••••" : "Enter strong password"}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!isEditing}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        System Role
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        disabled={submitting}
                                    >
                                        <option value="staff">Staff / Operator</option>
                                        <option value="customer">Customer</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address / Location
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="City, Country"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
