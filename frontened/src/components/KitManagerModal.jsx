import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaTrash, FaPlus, FaCheck, FaTruck, FaExclamationTriangle } from 'react-icons/fa';

const KitManagerModal = ({
    isOpen,
    onClose,
    kits = [],
    onKitsUpdated
}) => {
    const [newKitName, setNewKitName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingKit, setDeletingKit] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    if (!isOpen) return null;

    const token = localStorage.getItem("pos-token");

    const showMessage = (msg, isErr = false) => {
        if (isErr) {
            setError(msg);
            setSuccessMsg("");
        } else {
            setSuccessMsg(msg);
            setError("");
        }
        setTimeout(() => {
            setError("");
            setSuccessMsg("");
        }, 3500);
    };

    const handleAddKit = async (e) => {
        e.preventDefault();
        if (!newKitName.trim()) return;

        try {
            setSubmitting(true);
            const res = await axios.post(
                "/api/equipment/kits",
                { name: newKitName.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                showMessage(`Kit "${newKitName.trim()}" added successfully!`);
                setNewKitName("");
                if (onKitsUpdated) onKitsUpdated(res.data.kits);
            }
        } catch (err) {
            console.error("Error adding kit:", err);
            showMessage(err.response?.data?.message || "Failed to add kit", true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteKit = async (kitName) => {
        if (!window.confirm(`Are you sure you want to delete kit "${kitName}"? Any equipment or cables currently assigned to this kit will be reassigned to Main Central Depot.`)) {
            return;
        }

        try {
            setDeletingKit(kitName);
            const res = await axios.delete(
                `/api/equipment/kits/${encodeURIComponent(kitName)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                showMessage(`Kit "${kitName}" deleted successfully!`);
                if (onKitsUpdated) onKitsUpdated(res.data.kits);
            }
        } catch (err) {
            console.error("Error deleting kit:", err);
            showMessage(err.response?.data?.message || "Failed to delete kit", true);
        } finally {
            setDeletingKit("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            NEP INDIA PVT LTD
                        </div>
                        <h2 className="text-base font-bold text-white mt-0.5">
                            Manage Kits & Locations
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <FaTimes className="text-base" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Alerts */}
                    {error && (
                        <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                            <FaExclamationTriangle />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                            <FaCheck />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Add Kit Form */}
                    <form onSubmit={handleAddKit} className="flex gap-2">
                        <input
                            type="text"
                            value={newKitName}
                            onChange={(e) => setNewKitName(e.target.value)}
                            placeholder="Enter new kit or location..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newKitName.trim()}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 shrink-0"
                        >
                            <FaPlus className="text-xs" />
                            <span>Add</span>
                        </button>
                    </form>

                    {/* Kits List */}
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Registered Kits ({kits.length})
                        </div>

                        {kits.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">No kits found.</p>
                        ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {kits.map((kit) => (
                                    <div
                                        key={kit}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 truncate mr-2">
                                            <FaTruck className="text-emerald-600 text-xs shrink-0" />
                                            <span className="truncate">{kit}</span>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteKit(kit)}
                                            disabled={deletingKit === kit}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                                            title={`Delete kit "${kit}"`}
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KitManagerModal;
