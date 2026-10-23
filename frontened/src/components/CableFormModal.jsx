import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaLink, FaNetworkWired, FaCommentAlt, FaTruck, FaCog } from 'react-icons/fa';

export const CABLE_CATEGORIES = [
    "SMPTE 311M Hybrid Fiber",
    "12G/3G-SDI BNC Coaxial",
    "Triax Camera Cable",
    "Audio Multi-Snake / XLR",
    "Cat6A / Cat6 Tactical Ethernet",
    "OpticalCON Quad / Duo Fiber",
    "PowerCon / Socapex / Mains",
    "HDMI / Fiber Extender"
];

export const CABLE_STATUSES = [
    { value: "Working Fine", label: "Working Fine (Tested & Healthy)", desc: "100% operational, fine condition" },
    { value: "Faulty", label: "Faulty (Broken Core / Connector)", desc: "Core fault, pin damage, or broken jacket" },
    { value: "Need to be sent to repair", label: "Need to be sent to repair", desc: "Awaiting factory re-termination" },
    { value: "Under Maintenance", label: "Under Maintenance (Testing)", desc: "Continuity / optical loss test in progress" }
];

const CableFormModal = ({
    isOpen,
    onClose,
    onSave,
    editingCable = null,
    availableCables = [],
    kits = [],
    onOpenKitManager
}) => {
    const isDuplicate = Boolean(editingCable?.isDuplicate);
    const isEdit = Boolean(editingCable) && !isDuplicate;

    const [name, setName] = useState("");
    const [cableTag, setCableTag] = useState("");
    const [category, setCategory] = useState(CABLE_CATEGORIES[0]);
    const [customCategory, setCustomCategory] = useState("");
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [length, setLength] = useState("100m");
    const [status, setStatus] = useState("Working Fine");
    const [kitComingFrom, setKitComingFrom] = useState("Main Central Depot");
    const [customKit, setCustomKit] = useState("");
    const [isCustomKit, setIsCustomKit] = useState(false);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setError("");

        if (editingCable) {
            setName(editingCable.name || "");
            // In duplicate mode, clear the cable tag/serial so user can quickly type a new one
            setCableTag(isDuplicate ? "" : (editingCable.cableTag || ""));
            setLength(editingCable.length || "100m");
            setStatus(editingCable.status || "Working Fine");
            setNotes(editingCable.comments || editingCable.comment || editingCable.notes || "");

            const currentKit = editingCable.kitComingFrom || editingCable.currentLocation || "Main Central Depot";
            if (kits.includes(currentKit)) {
                setKitComingFrom(currentKit);
                setIsCustomKit(false);
                setCustomKit("");
            } else {
                setKitComingFrom("__custom__");
                setIsCustomKit(true);
                setCustomKit(currentKit);
            }

            if (CABLE_CATEGORIES.includes(editingCable.category)) {
                setCategory(editingCable.category);
                setIsCustomCategory(false);
                setCustomCategory("");
            } else {
                setCategory("__custom__");
                setIsCustomCategory(true);
                setCustomCategory(editingCable.category || "");
            }
        } else {
            setName("");
            setCableTag("");
            setCategory(CABLE_CATEGORIES[0]);
            setIsCustomCategory(false);
            setCustomCategory("");
            setLength("100m");
            setStatus("Working Fine");
            setKitComingFrom(kits[0] || "Main Central Depot");
            setIsCustomKit(false);
            setCustomKit("");
            setNotes("");
        }
    }, [isOpen, editingCable, kits, isDuplicate]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Cable Name is required.");
            return;
        }

        const finalCat = isCustomCategory ? customCategory.trim() : category;
        if (!finalCat) {
            setError("Cable Category is required.");
            return;
        }

        const finalKit = isCustomKit ? customKit.trim() : kitComingFrom;
        if (!finalKit) {
            setError("Please specify Kit / Origin Location.");
            return;
        }

        const payload = {
            name: name.trim(),
            cableTag: cableTag.trim(),
            category: finalCat,
            length: length.trim(),
            status,
            pairingStatus: editingCable?.pairingStatus || "Cable Pending",
            pairedWith: editingCable?.pairedWith || "",
            kitComingFrom: finalKit,
            notes: notes.trim(),
            comments: notes.trim(),
            comment: notes.trim()
        };

        try {
            setSubmitting(true);
            await onSave(payload, isDuplicate ? undefined : editingCable?._id);
            onClose();
        } catch (err) {
            console.error("Save cable error:", err);
            setError(err.response?.data?.message || err.message || "Failed to save cable.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            NEP INDIA PVT LTD • Cable Inventory
                        </div>
                        <h2 className="text-lg font-bold text-white mt-0.5">
                            {isDuplicate ? "Duplicate Cable (New Serial / Tag)" : isEdit ? "Edit Cable Information" : "Register New Cable"}
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
                                Specifications copied from <strong>{editingCable?.name || editingCable?.cableTag}</strong>. Enter new Cable Tag / Serial below.
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* 1. Name & Tag */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Cable Name / Identification <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. SMPTE Hybrid Fiber Reel A1, 12G SDI Drum #3"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Cable Tag / Barcode ID
                                </label>
                                {isDuplicate && (
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                                        New Unit Tag
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={cableTag}
                                onChange={(e) => setCableTag(e.target.value)}
                                placeholder="e.g. CBL-SMPTE-001 (auto if blank)"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-mono uppercase ${
                                    isDuplicate ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20" : "border-slate-300"
                                }`}
                                autoFocus={isDuplicate}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Cable Length
                            </label>
                            <input
                                type="text"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                placeholder="e.g. 100m, 50m, 200m, 30m"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* 2. Cable Category */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Cable Category <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCustomCategory(!isCustomCategory);
                                    if (!isCustomCategory) {
                                        setCategory("__custom__");
                                    } else {
                                        setCategory(CABLE_CATEGORIES[0]);
                                    }
                                }}
                                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                                {isCustomCategory ? "← Standard Categories" : "+ Custom Category"}
                            </button>
                        </div>

                        {!isCustomCategory ? (
                            <select
                                value={category}
                                onChange={(e) => {
                                    if (e.target.value === "__custom__") {
                                        setIsCustomCategory(true);
                                    } else {
                                        setCategory(e.target.value);
                                    }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            >
                                {CABLE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                <option value="__custom__">➕ Add Custom Category...</option>
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter custom cable category (e.g. Lemo Triax, DMX 5-Pin)"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                autoFocus
                                required
                            />
                        )}
                    </div>

                    {/* 3. Operational Condition / Health Status (Fine vs Faulty) */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Cable Health Status <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        >
                            {CABLE_STATUSES.map((st) => (
                                <option key={st.value} value={st.value}>
                                    {st.label} — {st.desc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Kit / Origin Location with Add and Delete options */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Kit / Origin Location
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomKit(!isCustomKit);
                                        if (!isCustomKit) {
                                            setKitComingFrom("__custom__");
                                        } else {
                                            setKitComingFrom(kits[0] || "Main Central Depot");
                                        }
                                    }}
                                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                                >
                                    {isCustomKit ? "← Select standard" : "+ Add custom kit"}
                                </button>
                                {onOpenKitManager && (
                                    <button
                                        type="button"
                                        onClick={onOpenKitManager}
                                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline ml-1 pl-1.5 border-l border-slate-300"
                                        title="Open Kit Manager to Add or Delete Kits"
                                    >
                                        <FaCog className="text-[10px]" />
                                        <span>Manage / Delete</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isCustomKit ? (
                            <select
                                value={kitComingFrom}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "__custom__") {
                                        setIsCustomKit(true);
                                        setKitComingFrom("__custom__");
                                    } else {
                                        setIsCustomKit(false);
                                        setKitComingFrom(val);
                                    }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            >
                                {kits.map((kit) => (
                                    <option key={kit} value={kit}>
                                        {kit}
                                    </option>
                                ))}
                                {!kits.includes("Main Central Depot") && (
                                    <option value="Main Central Depot">Main Central Depot</option>
                                )}
                                <option value="__custom__">➕ Add Custom Kit / Location...</option>
                            </select>
                        ) : (
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value={customKit}
                                    onChange={(e) => setCustomKit(e.target.value)}
                                    placeholder="Enter new kit or location (e.g. OB Van 3, Studio Ground Floor)..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                    autoFocus
                                    required
                                />
                                <p className="text-[11px] text-emerald-700 font-medium">
                                    New kit will be registered and available across the system.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 6. Comment / Notes */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                            <FaCommentAlt className="text-slate-400 text-xs" />
                            <span>Comment / Operational Notes & Inspection Details (Optional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Tested on optical meter: 0.2dB loss; BNC connector checked; drum #4 assigned for live broadcast..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm resize-none"
                        />
                    </div>

                    {/* Actions */}
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
                                    ? "Save Duplicate Cable"
                                    : isEdit
                                    ? "Update Cable"
                                    : "Save Cable"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CableFormModal;
