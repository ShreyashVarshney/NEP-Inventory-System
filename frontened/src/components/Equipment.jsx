import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
    FaBox,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaDownload,
    FaQrcode,
    FaFilter,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTruck,
    FaCalendarAlt,
    FaClock,
    FaRedo,
    FaCog,
    FaCopy
} from "react-icons/fa";
import EquipmentQrModal from "./EquipmentQrModal";
import EquipmentFormModal from "./EquipmentFormModal";
import KitManagerModal from "./KitManagerModal";

const Equipment = () => {
    const [equipmentList, setEquipmentList] = useState([]);
    const [existingKits, setExistingKits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [kitFilter, setKitFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedEquipmentForQr, setSelectedEquipmentForQr] = useState(null);
    const [isKitManagerOpen, setIsKitManagerOpen] = useState(false);

    const token = localStorage.getItem("pos-token");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [equipRes, kitsRes] = await Promise.all([
                axios.get("/api/equipment", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("/api/equipment/kits", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { kits: [] } }))
            ]);

            if (equipRes.data?.success) {
                setEquipmentList(equipRes.data.equipment || equipRes.data.products || []);
            }
            if (kitsRes.data?.success) {
                setExistingKits(kitsRes.data.kits || []);
            }
        } catch (error) {
            console.error("Error fetching equipment:", error);
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to load equipment."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const filteredEquipment = useMemo(() => {
        return equipmentList.filter((item) => {
            const matchesSearch =
                !searchTerm.trim() ||
                (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.serialNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.comments || item.comment || item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.kitComingFrom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.status || item.conditionStatus || "").toLowerCase().includes(searchTerm.toLowerCase());

            const equipStatus = item.status || item.conditionStatus || "Working Fine";
            const matchesStatus =
                statusFilter === "all" ||
                equipStatus.toLowerCase() === statusFilter.toLowerCase() ||
                (statusFilter === "Need to be sent to repair" && (equipStatus.toLowerCase() === "need to be sent to" || equipStatus.toLowerCase() === "need to be sent to repair")) ||
                (statusFilter === "Under Maintenance" && (equipStatus.toLowerCase() === "maintenance" || equipStatus.toLowerCase() === "under maintenance"));

            const equipKit = item.kitComingFrom || item.currentLocation || "";
            const matchesKit =
                kitFilter === "all" ||
                equipKit.toLowerCase() === kitFilter.toLowerCase();

            const equipDate = item.date || (item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "");
            const matchesDate = !dateFilter || equipDate === dateFilter;

            return matchesSearch && matchesStatus && matchesKit && matchesDate;
        });
    }, [equipmentList, searchTerm, statusFilter, kitFilter, dateFilter]);

    const distinctKitList = useMemo(() => {
        const set = new Set([...existingKits, ...equipmentList.map((p) => p.kitComingFrom || p.currentLocation).filter(Boolean)]);
        return Array.from(set).filter(Boolean);
    }, [existingKits, equipmentList]);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsFormModalOpen(true);
    };

    const handleDuplicate = (item) => {
        setEditingItem({
            ...item,
            _id: undefined,
            isDuplicate: true,
            serialNumber: ""
        });
        setIsFormModalOpen(true);
    };

    const handleOpenQr = (item) => {
        setSelectedEquipmentForQr(item);
        setIsQrModalOpen(true);
    };

    const handleSaveEquipment = async (payload, id) => {
        if (id) {
            const res = await axios.put(`/api/equipment/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                showMessage("success", "Equipment updated successfully!");
                fetchData();
            }
        } else {
            const res = await axios.post("/api/equipment", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                showMessage("success", "Equipment added successfully!");
                fetchData();
            }
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete equipment "${name}"?`)) return;

        try {
            await axios.delete(`/api/equipment/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage("success", "Equipment deleted successfully.");
            setEquipmentList((prev) => prev.filter((p) => p._id !== id));
        } catch (error) {
            console.error("Delete error:", error);
            showMessage("error", error.response?.data?.message || "Failed to delete equipment.");
        }
    };

    // Delete selected kit directly from dropdown
    const handleDeleteSelectedKit = async () => {
        if (kitFilter === "all") return;
        if (!window.confirm(`Are you sure you want to delete kit "${kitFilter}"? Any equipment currently assigned to this kit will be reassigned to Main Central Depot.`)) {
            return;
        }

        try {
            const res = await axios.delete(
                `/api/equipment/kits/${encodeURIComponent(kitFilter)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                showMessage("success", `Kit "${kitFilter}" deleted successfully.`);
                setKitFilter("all");
                setExistingKits(res.data.kits || []);
                fetchData();
            }
        } catch (err) {
            console.error("Error deleting kit:", err);
            showMessage("error", err.response?.data?.message || "Failed to delete kit.");
        }
    };

    const handleDownloadCSV = () => {
        if (filteredEquipment.length === 0) {
            showMessage("error", "No equipment records to download.");
            return;
        }

        const headers = [
            "Company",
            "Equipment Name",
            "Equipment Model",
            "Status",
            "Date",
            "Time",
            "Kit Coming From",
            "Serial Number / SKU"
        ];

        const escapeCSV = (field) => {
            if (field === null || field === undefined) return '""';
            const str = String(field).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = filteredEquipment.map((p) => [
            escapeCSV("NEP INDIA PVT LTD"),
            escapeCSV(p.name),
            escapeCSV(p.model || "N/A"),
            escapeCSV(p.status || p.conditionStatus || "Working Fine"),
            escapeCSV(p.date || (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "N/A")),
            escapeCSV(p.time || (p.createdAt ? new Date(p.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "N/A")),
            escapeCSV(p.kitComingFrom || p.currentLocation || "Main Central Depot"),
            escapeCSV(p.sku || p.serialNumber || "N/A")
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `NEP_INDIA_PVT_LTD_Equipment_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showMessage("success", "Equipment CSV report downloaded!");
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Working Fine":
            case "Available":
                return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "Faulty":
            case "Damaged":
                return "bg-rose-50 text-rose-700 border border-rose-200";
            case "Need to be sent to repair":
            case "Need to be sent to":
            case "Dispatched":
                return "bg-amber-50 text-amber-700 border border-amber-200";
            case "Under Maintenance":
            case "Maintenance":
            case "In Use":
                return "bg-blue-50 text-blue-700 border border-blue-200";
            default:
                return "bg-slate-50 text-slate-700 border border-slate-200";
        }
    };

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        statusFilter !== "all" ||
        kitFilter !== "all" ||
        dateFilter !== "";

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setKitFilter("all");
        setDateFilter("");
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        NEP INDIA PVT LTD
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Equipment Management • Manage models, status, kit origins & QR codes
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                    <button
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-sm transition"
                    >
                        <FaDownload className="text-slate-500 text-xs" />
                        <span>Download CSV</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition"
                    >
                        <FaPlus className="text-xs" />
                        <span>Add Equipment</span>
                    </button>
                </div>
            </div>

            {/* Notification */}
            {message.text && (
                <div
                    className={`p-4 rounded-xl flex items-center justify-between text-sm font-semibold transition animate-fadeIn ${
                        message.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {message.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        <span>{message.text}</span>
                    </div>
                    <button
                        onClick={() => setMessage({ type: "", text: "" })}
                        className="text-xs font-bold hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <FaFilter className="text-emerald-600" />
                        <span>Filter Equipment Records</span>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                        >
                            <FaRedo className="text-[10px]" />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-xs" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search model, name, kit..."
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Operational Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Operational Statuses</option>
                            <option value="Working Fine">Working Fine</option>
                            <option value="Faulty">Faulty</option>
                            <option value="Need to be sent to repair">Need to be sent to repair</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                        </select>
                    </div>

                    {/* Kit Filter with inline delete button and Manage Kits modal button */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                            <select
                                value={kitFilter}
                                onChange={(e) => setKitFilter(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Kits & Locations</option>
                                {distinctKitList.map((kit) => (
                                    <option key={kit} value={kit}>
                                        {kit}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Delete selected kit option */}
                        {kitFilter !== "all" && (
                            <button
                                onClick={handleDeleteSelectedKit}
                                className="px-2.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 shrink-0"
                                title={`Delete kit "${kitFilter}"`}
                            >
                                <FaTrash className="text-xs" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}

                        {/* Open Kit Manager Modal */}
                        <button
                            onClick={() => setIsKitManagerOpen(true)}
                            className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold transition shrink-0"
                            title="Manage / Delete Kits & Locations"
                        >
                            <FaCog />
                        </button>
                    </div>

                    <div>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            title="Filter by specific date"
                        />
                    </div>
                </div>
            </div>

            {/* Equipment Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-extrabold text-slate-900">
                            NEP INDIA PVT LTD Equipment Units
                        </h2>
                        <p className="text-xs text-slate-500">
                            Showing {filteredEquipment.length} of {equipmentList.length} registered equipment units
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600 mb-2"></div>
                        <p className="text-sm font-medium">Loading equipment records...</p>
                    </div>
                ) : filteredEquipment.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 px-4">
                        <FaBox className="text-4xl text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No equipment found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? "No items matched your filter criteria. Try resetting filters."
                                : "No equipment registered yet. Click 'Add Equipment' to create your first entry."}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={resetFilters}
                                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                Reset Filters
                            </button>
                        ) : (
                            <button
                                onClick={handleOpenAdd}
                                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                            >
                                + Add First Equipment
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <th className="py-3.5 px-4 sm:px-6">Model</th>
                                    <th className="py-3.5 px-4 sm:px-6">Equipment Name</th>
                                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                                    <th className="py-3.5 px-4 sm:px-6">Date & Time</th>
                                    <th className="py-3.5 px-4 sm:px-6">Kit Coming From</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-center">QR Code</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredEquipment.map((item) => {
                                    const equipStatus = item.status || item.conditionStatus || "Available";
                                    const equipDate = item.date || (item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "N/A");
                                    const equipTime = item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "N/A");
                                    const equipKit = item.kitComingFrom || item.currentLocation || "Main Warehouse";

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Model */}
                                            <td className="py-3.5 px-4 sm:px-6">
                                                <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-mono font-bold text-xs border border-slate-200">
                                                    {item.model || "N/A"}
                                                </span>
                                            </td>

                                            {/* Name */}
                                            <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                                                <div>{item.name}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {item.serialNumber ? (
                                                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                            SN: {item.serialNumber}
                                                        </span>
                                                    ) : item.sku ? (
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {item.sku}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {(item.comments || item.comment || item.description) && (
                                                    <div className="text-[11px] font-normal text-slate-500 italic mt-1 line-clamp-1 flex items-center gap-1" title={item.comments || item.comment || item.description}>
                                                        <span className="text-emerald-600 font-bold not-italic text-[10px]">Note:</span>
                                                        <span>{item.comments || item.comment || item.description}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4 sm:px-6">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                                                        equipStatus
                                                    )}`}
                                                >
                                                    {equipStatus}
                                                </span>
                                            </td>

                                            {/* Date & Time */}
                                            <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-600">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                    <FaCalendarAlt className="text-slate-400 text-[10px]" />
                                                    <span>{equipDate}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                                                    <FaClock className="text-slate-400 text-[10px]" />
                                                    <span>{equipTime}</span>
                                                </div>
                                            </td>

                                            {/* Kit Coming From */}
                                            <td className="py-3.5 px-4 sm:px-6">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
                                                    <FaTruck className="text-emerald-600 text-[10px]" />
                                                    <span>{equipKit}</span>
                                                </div>
                                            </td>

                                            {/* QR Code Action */}
                                            <td className="py-3.5 px-4 sm:px-6 text-center">
                                                <button
                                                    onClick={() => handleOpenQr(item)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                                                    title="Generate & View QR Code"
                                                >
                                                    <FaQrcode className="text-xs" />
                                                    <span>View QR</span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 sm:px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleDuplicate(item)}
                                                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                                        title="Duplicate Equipment (Copy specs with new Serial Number)"
                                                    >
                                                        <FaCopy className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                                        title="Edit Equipment Details"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id, item.name)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                        title="Delete Equipment"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Equipment Add & Edit Modal */}
            <EquipmentFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveEquipment}
                editingEquipment={editingItem}
                existingKits={distinctKitList}
            />

            {/* Equipment QR Code Modal */}
            <EquipmentQrModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                equipment={selectedEquipmentForQr}
            />

            {/* Kit Manager & Delete Modal */}
            <KitManagerModal
                isOpen={isKitManagerOpen}
                onClose={() => setIsKitManagerOpen(false)}
                kits={distinctKitList}
                onKitsUpdated={(updatedKits) => {
                    setExistingKits(updatedKits);
                    fetchData();
                }}
            />
        </div>
    );
};

export default Equipment;
