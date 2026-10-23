import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
    FaBox,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaDownload,
    FaPrint,
    FaQrcode,
    FaFilter,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTools,
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

const EquipmentSummary = () => {
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
            console.error("Error loading equipment summary:", error);
            showMessage("error", error.response?.data?.message || "Failed to load equipment data.");
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

    // Filtered Equipment List
    const filteredEquipment = useMemo(() => {
        return equipmentList.filter((item) => {
            const matchesSearch =
                !searchTerm.trim() ||
                (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // KPI Metrics: Total, Working Fine, Faulty, Need to be sent to repair, Under Maintenance
    const metrics = useMemo(() => {
        const total = equipmentList.length;
        const workingFine = equipmentList.filter(
            (p) => (p.status || p.conditionStatus) === "Working Fine" || (p.status || p.conditionStatus) === "Available"
        ).length;
        const faulty = equipmentList.filter(
            (p) => (p.status || p.conditionStatus) === "Faulty" || (p.status || p.conditionStatus) === "Damaged"
        ).length;
        const needToRepair = equipmentList.filter(
            (p) =>
                (p.status || p.conditionStatus) === "Need to be sent to repair" ||
                (p.status || p.conditionStatus) === "Need to be sent to" ||
                (p.status || p.conditionStatus) === "Dispatched"
        ).length;
        const underMaintenance = equipmentList.filter(
            (p) =>
                (p.status || p.conditionStatus) === "Under Maintenance" ||
                (p.status || p.conditionStatus) === "Maintenance" ||
                (p.status || p.conditionStatus) === "In Use"
        ).length;

        return { total, workingFine, faulty, needToRepair, underMaintenance };
    }, [equipmentList]);

    const distinctKitList = useMemo(() => {
        const set = new Set([...existingKits, ...equipmentList.map((p) => p.kitComingFrom || p.currentLocation).filter(Boolean)]);
        return Array.from(set).filter(Boolean);
    }, [existingKits, equipmentList]);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
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

    const handleOpenQrModal = (item) => {
        setSelectedEquipmentForQr(item);
        setIsQrModalOpen(true);
    };

    // Download CSV
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
        link.setAttribute("download", `NEP_INDIA_PVT_LTD_Equipment_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showMessage("success", "Equipment summary CSV report downloaded!");
    };

    // Print Summary Report
    const handlePrintSummary = () => {
        const printWindow = window.open("", "", "width=900,height=800");
        const dateStr = new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        const rowsHtml = filteredEquipment
            .map(
                (p, idx) => `
                <tr>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${idx + 1}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px;">${p.name}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; font-weight: 600;">${p.model || "N/A"}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; background: #f1f5f9; color: #0f172a;">
                            ${p.status || p.conditionStatus || "Working Fine"}
                        </span>
                    </td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${p.date || "N/A"}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${p.time || "N/A"}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #059669;">${p.kitComingFrom || p.currentLocation || "Main Central Depot"}</td>
                </tr>
            `
            )
            .join("");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>NEP INDIA PVT LTD - Equipment Summary Report</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        padding: 30px;
                        color: #0f172a;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 3px solid #0f172a;
                        padding-bottom: 16px;
                        margin-bottom: 20px;
                    }
                    .company-name {
                        font-size: 26px;
                        font-weight: 900;
                        margin: 0;
                        color: #0f172a;
                        letter-spacing: -0.5px;
                    }
                    .company-sub {
                        font-size: 11px;
                        font-weight: 700;
                        color: #059669;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                    }
                    .stats-box {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                    .stat-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 10px 14px;
                        text-align: center;
                    }
                    .stat-num {
                        font-size: 20px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .stat-label {
                        font-size: 11px;
                        color: #64748b;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th {
                        background: #0f172a;
                        color: #ffffff;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        padding: 10px 12px;
                        text-align: left;
                    }
                    .footer {
                        margin-top: 30px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 12px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #64748b;
                    }
                    @media print {
                        body { padding: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="company-name">NEP INDIA PVT LTD</h1>
                        <div class="company-sub">Equipment Inventory & Summary Report</div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #64748b;">
                        <div><strong>Report Generated:</strong> ${dateStr}</div>
                        <div><strong>Total Records:</strong> ${filteredEquipment.length}</div>
                    </div>
                </div>

                <div class="stats-box" style="grid-template-columns: repeat(5, 1fr);">
                    <div class="stat-card">
                        <div class="stat-num">${metrics.total}</div>
                        <div class="stat-label">Total Gear</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num" style="color: #16a34a;">${metrics.workingFine}</div>
                        <div class="stat-label">Working Fine</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num" style="color: #e11d48;">${metrics.faulty}</div>
                        <div class="stat-label">Faulty</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num" style="color: #d97706;">${metrics.needToRepair}</div>
                        <div class="stat-label">Need Repair</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num" style="color: #2563eb;">${metrics.underMaintenance}</div>
                        <div class="stat-label">Under Maintenance</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th>Equipment Name</th>
                            <th>Model</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Kit Coming From</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="footer">
                    <div>NEP INDIA PVT LTD • Asset Logistics System</div>
                    <div>Page 1 of 1</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Color-coded badges for: Working Fine, Faulty, Need to be sent to repair, Under Maintenance
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
            {/* Top Header with clean NEP INDIA PVT LTD typography */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        NEP INDIA PVT LTD
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Equipment Summary • Operational inventory tracking, kit movements & QR generation
                    </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center flex-wrap gap-2.5">
                    <button
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-sm transition"
                        title="Download CSV Inventory Report"
                    >
                        <FaDownload className="text-slate-500 text-xs" />
                        <span>Download CSV</span>
                    </button>

                    <button
                        onClick={handlePrintSummary}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-sm transition"
                        title="Print / PDF Summary Report"
                    >
                        <FaPrint className="text-slate-500 text-xs" />
                        <span>Print Report</span>
                    </button>

                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition"
                    >
                        <FaPlus className="text-xs" />
                        <span>Add Equipment</span>
                    </button>
                </div>
            </div>

            {/* Notification alert */}
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

            {/* KPI Summary Cards: Total Gear, Working Fine, Faulty, Need to be sent to repair, Under Maintenance (Active Kits removed) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FaBox className="text-lg" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gear</div>
                        <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FaCheckCircle className="text-lg" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Working Fine</div>
                        <div className="text-2xl font-black text-slate-900">{metrics.workingFine}</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <FaExclamationTriangle className="text-lg" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Faulty</div>
                        <div className="text-2xl font-black text-slate-900">{metrics.faulty}</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <FaTruck className="text-lg" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Need Repair</div>
                        <div className="text-2xl font-black text-slate-900">{metrics.needToRepair}</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5 col-span-2 sm:col-span-1">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FaTools className="text-lg" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Under Maintenance</div>
                        <div className="text-2xl font-black text-slate-900">{metrics.underMaintenance}</div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <FaFilter className="text-emerald-600" />
                        <span>Filter Equipment</span>
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
                    {/* Search */}
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

                    {/* Status Filter: Working Fine, Faulty, Need to be sent to repair, Under Maintenance */}
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

                    {/* Kit Filter with inline delete option and Manage Kits button */}
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

                    {/* Date Filter */}
                    <div className="relative">
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
                            NEP INDIA PVT LTD Equipment Records
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
                                onClick={handleOpenAddModal}
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
                                    const equipStatus = item.status || item.conditionStatus || "Working Fine";
                                    const equipDate = item.date || (item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "N/A");
                                    const equipTime = item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "N/A");
                                    const equipKit = item.kitComingFrom || item.currentLocation || "Main Central Depot";

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
                                                    onClick={() => handleOpenQrModal(item)}
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
                                                        onClick={() => handleOpenEditModal(item)}
                                                        className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                                        title="Edit Information"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id, item.name)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                        title="Delete Record"
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

            {/* Kit Manager Modal (Delete & Add Kits) */}
            <KitManagerModal
                isOpen={isKitManagerOpen}
                onClose={() => setIsKitManagerOpen(false)}
                kits={existingKits}
                onKitsUpdated={(updatedKits) => {
                    setExistingKits(updatedKits);
                    fetchData();
                }}
            />
        </div>
    );
};

export default EquipmentSummary;
