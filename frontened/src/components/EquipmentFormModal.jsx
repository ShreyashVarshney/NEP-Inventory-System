import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaCommentAlt } from 'react-icons/fa';

const DEFAULT_KIT_OPTIONS = [
    "OB Van 1 - Production Unit",
    "OB Van 2 - Sports Unit",
    "Studio Floor A",
    "Studio Floor B",
    "PCR Control Room",
    "Main Central Depot",
    "Flypack Kit 1",
    "Client Return / Rental"
];

const STATUS_OPTIONS = [
    { label: "Working Fine", value: "Working Fine", desc: "Operational and ready for broadcast" },
    { label: "Faulty", value: "Faulty", desc: "Hardware or component fault" },
    { label: "Need to be sent to repair", value: "Need to be sent to repair", desc: "Requires dispatch or external repair" },
    { label: "Under Maintenance", value: "Under Maintenance", desc: "Currently under servicing or inspection" }
];

const EquipmentFormModal = ({
    isOpen,
    onClose,
    onSave,
    editingEquipment = null,
    existingKits = []
}) => {
    const isDuplicate = Boolean(editingEquipment?.isDuplicate);
    const isEdit = Boolean(editingEquipment) && !isDuplicate;

    const [model, setModel] = useState("");
    const [name, setName] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [status, setStatus] = useState("Working Fine");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [kitOption, setKitOption] = useState(DEFAULT_KIT_OPTIONS[0]);
    const [customKit, setCustomKit] = useState("");
    const [isCustomKit, setIsCustomKit] = useState(false);
    const [comments, setComments] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setError("");
        if (editingEquipment) {
            setModel(editingEquipment.model || "");
            setName(editingEquipment.name || "");
            // If duplicate, clear serial number so only serial number is changed
            setSerialNumber(isDuplicate ? "" : (editingEquipment.serialNumber || editingEquipment.sku || ""));
            setStatus(editingEquipment.status || editingEquipment.conditionStatus || "Working Fine");
            
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            setDate(isDuplicate ? todayStr : (editingEquipment.date || (editingEquipment.createdAt ? new Date(editingEquipment.createdAt).toISOString().slice(0, 10) : todayStr)));
            setTime(isDuplicate ? timeStr : (editingEquipment.time || (editingEquipment.createdAt ? new Date(editingEquipment.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "12:00")));
            setComments(editingEquipment.comments || editingEquipment.comment || editingEquipment.description || "");

            const currentKit = editingEquipment.kitComingFrom || editingEquipment.currentLocation || DEFAULT_KIT_OPTIONS[0];
            const allKnown = Array.from(new Set([...DEFAULT_KIT_OPTIONS, ...existingKits]));
            
            if (allKnown.includes(currentKit)) {
                setKitOption(currentKit);
                setIsCustomKit(false);
                setCustomKit("");
            } else {
                setKitOption("__custom__");
                setIsCustomKit(true);
                setCustomKit(currentKit);
            }
        } else {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            setModel("");
            setName("");
            setSerialNumber("");
            setStatus("Working Fine");
            setDate(todayStr);
            setTime(timeStr);
            setKitOption(DEFAULT_KIT_OPTIONS[0]);
            setIsCustomKit(false);
            setCustomKit("");
            setComments("");
        }
    }, [isOpen, editingEquipment, existingKits, isDuplicate]);

    if (!isOpen) return null;

    const combinedKitOptions = Array.from(new Set([...DEFAULT_KIT_OPTIONS, ...existingKits])).filter(Boolean);

    const handleKitSelectChange = (e) => {
        const val = e.target.value;
        if (val === "__custom__") {
            setIsCustomKit(true);
            setKitOption("__custom__");
        } else {
            setIsCustomKit(false);
            setKitOption(val);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Equipment Name is required.");
            return;
        }

        if (!model.trim()) {
            setError("Equipment Model is required.");
            return;
        }

        const finalKit = isCustomKit ? customKit.trim() : kitOption;
        if (!finalKit) {
            setError("Please specify the Kit Coming From.");
            return;
        }

        const payload = {
            name: name.trim(),
            model: model.trim(),
            serialNumber: serialNumber.trim(),
            status,
            conditionStatus: status,
            date: date || new Date().toISOString().slice(0, 10),
            time: time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            kitComingFrom: finalKit,
            comments: comments.trim(),
            comment: comments.trim(),
            description: comments.trim()
        };

        try {
            setSubmitting(true);
            await onSave(payload, isDuplicate ? undefined : editingEquipment?._id);
            onClose();
        } catch (err) {
            console.error("Save error:", err);
            setError(err.response?.data?.message || err.message || "Failed to save equipment record.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
                {/* Header - Clean text without logo graphic */}
                <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            NEP INDIA PVT LTD
                        </div>
                        <h2 className="text-lg font-bold text-white mt-0.5">
                            {isDuplicate ? "Duplicate Equipment (New Unit)" : isEdit ? "Edit Equipment Information" : "Add New Equipment"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {/* Duplicate Mode Helper Alert */}
                    {isDuplicate && (
                        <div className="p-3 text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider flex-shrink-0">
                                Duplicate Mode
                            </span>
                            <span>
                                Specifications copied from <strong>{editingEquipment?.name || editingEquipment?.model}</strong>. Enter new serial number below.
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* 1. Equipment Model & Serial Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Equipment Model <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="e.g. Sony HDC-4300, Grass Valley..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Serial Number
                                </label>
                                {isDuplicate && (
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                                        New Unit S/N
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                placeholder={isDuplicate ? "Enter NEW serial number..." : "e.g. SN-883920, NEP-9021"}
                                autoFocus={isDuplicate}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm font-mono ${
                                    isDuplicate
                                        ? "border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                                        : "border-slate-300"
                                }`}
                            />
                        </div>
                    </div>

                    {/* 2. Equipment Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Equipment Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. 4K Studio Camera Head, 3 M/E Vision Mixer Panel..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                            required
                        />
                    </div>

                    {/* 3. Status of Equipment */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Equipment Status <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label} — {opt.desc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Date & Time Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Time <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* 5. Kit Coming From (Option OR User Can Add) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Kit Coming From <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCustomKit(!isCustomKit);
                                    if (!isCustomKit) {
                                        setKitOption("__custom__");
                                    } else {
                                        setKitOption(combinedKitOptions[0]);
                                    }
                                }}
                                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                            >
                                {isCustomKit ? "← Select from standard options" : "+ Add custom / new kit"}
                            </button>
                        </div>

                        {!isCustomKit ? (
                            <div>
                                <select
                                    value={kitOption}
                                    onChange={handleKitSelectChange}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {combinedKitOptions.map((kit) => (
                                        <option key={kit} value={kit}>
                                            {kit}
                                        </option>
                                    ))}
                                    <option value="__custom__">➕ Add Custom Kit / Location...</option>
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Choose existing kit source or click "+ Add custom" to type any new source.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <input
                                    type="text"
                                    value={customKit}
                                    onChange={(e) => setCustomKit(e.target.value)}
                                    placeholder="Enter new kit or location (e.g. Flypack Unit 4, Studio Delta, Client XYZ)"
                                    className="w-full px-3.5 py-2 rounded-lg border border-emerald-400 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    autoFocus
                                    required
                                />
                                <p className="text-[11px] text-emerald-700 font-medium">
                                    Custom kit will be saved and added to the kit list for future selections.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Comments / Notes */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                            <FaCommentAlt className="text-slate-400 text-xs" />
                            <span>Comment / Operational Notes (Optional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="e.g., Verified healthy before live broadcast, sensor cleaned, minor scratch on casing..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                        >
                            <FaCheck className="text-xs" />
                            <span>
                                {submitting
                                    ? "Saving..."
                                    : isDuplicate
                                    ? "Save Duplicate Equipment"
                                    : isEdit
                                    ? "Update Equipment"
                                    : "Save Equipment"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentFormModal;
