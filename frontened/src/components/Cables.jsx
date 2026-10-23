import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaNetworkWired,
    FaPlus,
    FaEdit,
    FaTrash,
    FaCopy,
    FaSearch,
    FaDownload,
    FaQrcode,
    FaFilter,
    FaCheckCircle,
    FaExclamationTriangle,
    FaRedo,
    FaTools,
    FaTimes,
    FaTag,
    FaLayerGroup,
    FaTruck,
    FaClock
} from 'react-icons/fa';
import CableFormModal, { CABLE_CATEGORIES } from './CableFormModal';
import CableQrModal from './CableQrModal';
import KitManagerModal from './KitManagerModal';

const Cables = () => {
    const [cables, setCables] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        fineCount: 0,
        faultyCount: 0,
        repairCount: 0,
        maintenanceCount: 0,
        categoryBreakdown: []
    });
    const [kits, setKits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ type: '', message: '' });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [kitFilter, setKitFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all'); // all | fine | faulty

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCable, setEditingCable] = useState(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedCableForQr, setSelectedCableForQr] = useState(null);
    const [isKitManagerOpen, setIsKitManagerOpen] = useState(false);

    const token = localStorage.getItem('pos-token');
    const authHeaders = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 4500);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cablesRes, summaryRes, kitsRes] = await Promise.all([
                axios.get('/api/cables', authHeaders),
                axios.get('/api/cables/summary', authHeaders),
                axios.get('/api/equipment/kits', authHeaders).catch(() => ({ data: { kits: [] } }))
            ]);

            if (cablesRes.data?.success) {
                setCables(cablesRes.data.cables || []);
            }
            if (summaryRes.data?.success) {
                const s = summaryRes.data.summary || summaryRes.data.metrics || {};
                setSummary({
                    total: s.total || 0,
                    fineCount: s.fineCount || 0,
                    faultyCount: s.faultyCount || 0,
                    repairCount: s.repairCount || 0,
                    maintenanceCount: s.maintenanceCount || 0,
                    categoryBreakdown: summaryRes.data.categoryBreakdown || s.categoryBreakdown || []
                });
            }
            if (kitsRes.data?.success && Array.isArray(kitsRes.data.kits)) {
                setKits(kitsRes.data.kits);
            }
        } catch (err) {
            console.error('Failed to load cables:', err);
            showNotification('error', 'Failed to load cables from server. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'all') {
            setStatusFilter('all');
        } else if (tab === 'fine') {
            setStatusFilter('Working Fine');
        } else if (tab === 'faulty') {
            setStatusFilter('Faulty');
        }
    };

    // Client-side combined filtering
    const filteredCables = useMemo(() => {
        return cables.filter((c) => {
            // Category filter
            if (categoryFilter !== 'all' && c.category !== categoryFilter) {
                return false;
            }
            // Status filter
            if (statusFilter !== 'all' && c.status !== statusFilter) {
                return false;
            }
            // Kit filter
            if (kitFilter !== 'all' && (c.kitComingFrom || 'Main Central Depot') !== kitFilter) {
                return false;
            }
            // Search text
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchTag = (c.cableTag || '').toLowerCase().includes(q);
                const matchName = (c.name || '').toLowerCase().includes(q);
                const matchCategory = (c.category || '').toLowerCase().includes(q);
                const matchKit = (c.kitComingFrom || '').toLowerCase().includes(q);
                const matchNotes = (c.comments || c.comment || c.notes || '').toLowerCase().includes(q);
                if (!matchTag && !matchName && !matchCategory && !matchKit && !matchNotes) {
                    return false;
                }
            }
            return true;
        });
    }, [cables, categoryFilter, statusFilter, kitFilter, searchTerm]);

    // Handle Save (Add, Edit, or Duplicate)
    const handleSaveCable = async (cableData, cableId) => {
        try {
            const isUpdate = cableId || (editingCable && !editingCable.isDuplicate && editingCable._id);
            if (isUpdate) {
                const targetId = cableId || editingCable._id;
                const res = await axios.put(
                    `/api/cables/${targetId}`,
                    cableData,
                    authHeaders
                );
                if (res.data?.success) {
                    showNotification('success', `Cable ${cableData.cableTag || ''} updated successfully.`);
                }
            } else {
                const res = await axios.post(
                    '/api/cables',
                    cableData,
                    authHeaders
                );
                if (res.data?.success) {
                    showNotification('success', `Cable ${cableData.cableTag || res.data?.cable?.cableTag || 'New Cable'} registered successfully.`);
                }
            }
            fetchData();
        } catch (err) {
            console.error('Error saving cable:', err);
            const errorMsg = err.response?.data?.message || 'Error saving cable';
            showNotification('error', errorMsg);
            throw err;
        }
    };

    // Handle Duplicate Cable
    const handleDuplicate = (cable) => {
        setEditingCable({
            ...cable,
            _id: undefined,
            isDuplicate: true,
            cableTag: ''
        });
        setIsFormModalOpen(true);
    };


    // Handle Delete
    const handleDeleteCable = async (cable) => {
        if (!window.confirm(`Are you sure you want to permanently delete cable "${cable.cableTag}" (${cable.name})?`)) return;

        try {
            const res = await axios.delete(
                `/api/cables/${cable._id}`,
                authHeaders
            );
            if (res.data?.success) {
                showNotification('success', `Cable ${cable.cableTag} deleted.`);
                fetchData();
            }
        } catch (err) {
            console.error('Error deleting cable:', err);
            showNotification('error', err.response?.data?.message || 'Failed to delete cable.');
        }
    };

    // Handle CSV Export
    const handleExportCSV = () => {
        try {
            window.open('/api/cables/export', '_blank');
            showNotification('success', 'Exporting cables CSV...');
        } catch (err) {
            console.error('Export error:', err);
            showNotification('error', 'Failed to trigger CSV export.');
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setStatusFilter('all');
        setKitFilter('all');
        setActiveTab('all');
    };

    // Percentage of fine cables
    const finePercentage = summary.total > 0
        ? Math.round((summary.fineCount / summary.total) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 space-y-6">
            {/* Top Notification Banner */}
            {notification.message && (
                <div
                    className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-slideIn ${
                        notification.type === 'success'
                            ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
                            : 'bg-rose-950 text-rose-200 border-rose-800'
                    }`}
                >
                    {notification.type === 'success' ? (
                        <FaCheckCircle className="text-emerald-400 text-lg flex-shrink-0" />
                    ) : (
                        <FaExclamationTriangle className="text-rose-400 text-lg flex-shrink-0" />
                    )}
                    <span>{notification.message}</span>
                    <button
                        onClick={() => setNotification({ type: '', message: '' })}
                        className="ml-2 text-slate-400 hover:text-white"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Header with NEP INDIA Branding */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            NEP INDIA PVT LTD
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                            • Broadcast Cabling & Infrastructure System
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                        <FaNetworkWired className="text-emerald-400 text-xl sm:text-2xl" />
                        Cable Management
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                        Monitor category allocations, origin locations, and operational cable health condition.
                    </p>
                </div>

                {/* Header CTA Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <button
                        id="refresh-cables-btn"
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/70 text-slate-200 text-xs sm:text-sm font-semibold transition"
                        title="Reload latest data"
                    >
                        <FaRedo className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        id="manage-kits-btn"
                        onClick={() => setIsKitManagerOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/70 text-slate-200 text-xs sm:text-sm font-semibold transition"
                        title="Manage Kits & Origin Locations (Add & Delete)"
                    >
                        <FaTruck className="text-emerald-400 text-xs sm:text-sm" />
                        <span>Manage Kits</span>
                    </button>

                    <button
                        id="export-cables-btn"
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
                    >
                        <FaDownload />
                        <span>Export CSV</span>
                    </button>

                    <button
                        id="add-cable-btn"
                        onClick={() => {
                            setEditingCable(null);
                            setIsFormModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                    >
                        <FaPlus />
                        <span>Register Cable</span>
                    </button>
                </div>
            </header>

            {/* Top Metric Cards - How Many Are Fine & Cable Fleet Health */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {/* 1. HOW MANY ARE FINE */}
                <div
                    onClick={() => handleTabChange('fine')}
                    className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
                        activeTab === 'fine'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-white border-slate-200/80 hover:border-emerald-300'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                How Many Are Fine
                            </span>
                            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-2">
                                <span>{summary.fineCount}</span>
                                <span className="text-xs sm:text-sm font-semibold text-slate-400">
                                    / {summary.total} fine ({finePercentage}%)
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Operational, tested & ready for production
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition">
                            <FaCheckCircle />
                        </div>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${finePercentage}%` }}
                        />
                    </div>
                </div>

                {/* 2. TOTAL REGISTERED CABLES */}
                <div
                    onClick={() => handleTabChange('all')}
                    className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
                        activeTab === 'all'
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'bg-white border-slate-200/80 hover:border-indigo-300'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                                Total Broadcast Cables
                            </span>
                            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-2">
                                <span>{summary.total}</span>
                                <span className="text-xs sm:text-sm font-semibold text-indigo-600">
                                    cables registered
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Across all active kits & depot locations
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition">
                            <FaNetworkWired />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                        <span>View all inventory →</span>
                    </div>
                </div>

                {/* 3. FAULTY & IN REPAIR */}
                <div
                    onClick={() => handleTabChange('faulty')}
                    className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
                        activeTab === 'faulty'
                            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/30'
                            : 'bg-white border-slate-200/80 hover:border-rose-300'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                Faulty / In Repair
                            </span>
                            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-2">
                                <span>{(summary.faultyCount || 0) + (summary.repairCount || 0) + (summary.maintenanceCount || 0)}</span>
                                <span className="text-xs sm:text-sm font-semibold text-rose-600">
                                    attention
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {summary.faultyCount || 0} faulty • {summary.repairCount || 0} in repair • {summary.maintenanceCount || 0} test
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition">
                            <FaTools />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-rose-600">
                        <span>Non-operational cables</span>
                    </div>
                </div>
            </section>

            {/* CATEGORY BREAKDOWN CARDS - Direct visualization of "their category" and "how many are fine" per category */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                            <FaLayerGroup />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Cable Categories & Health Breakdown
                            </h2>
                            <p className="text-xs text-slate-500">
                                Total count, healthy operational cables ("Fine"), and operational health per category.
                            </p>
                        </div>
                    </div>
                    {categoryFilter !== 'all' && (
                        <button
                            onClick={() => setCategoryFilter('all')}
                            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
                        >
                            <span>Clear category filter ({categoryFilter})</span>
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {summary.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                        summary.categoryBreakdown.map((cat) => {
                            const isSelected = categoryFilter === cat.category;
                            const fineCount = cat.fineCount !== undefined ? cat.fineCount : (cat.fine || 0);
                            const isAllFine = fineCount === cat.total && cat.total > 0;
                            return (
                                <div
                                    key={cat.category}
                                    onClick={() => setCategoryFilter(isSelected ? 'all' : cat.category)}
                                    className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left flex flex-col justify-between ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-1">
                                            <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                                                {cat.category}
                                            </h3>
                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                                {cat.total} total
                                            </span>
                                        </div>
                                    </div>

                                    {/* Health Indicators */}
                                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold gap-1">
                                        <span
                                            className={`px-2 py-0.5 rounded-md ${
                                                isAllFine
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}
                                        >
                                            ✓ {fineCount}/{cat.total} Fine
                                        </span>

                                        {isAllFine ? (
                                            <span className="text-emerald-700 font-bold text-[10px]">
                                                100% Operational
                                            </span>
                                        ) : (
                                            <span className="text-rose-600 font-bold text-[10px]">
                                                {cat.total - fineCount} Need Attention
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-4 text-center text-xs text-slate-400">
                            No category data available yet.
                        </div>
                    )}
                </div>
            </section>

            {/* Main Inventory Card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Filter and Search Bar */}
                <div className="p-4 md:p-5 border-b border-slate-200/80 space-y-4">
                    {/* Search and Quick Actions */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                id="cable-search-input"
                                type="text"
                                placeholder="Search by Cable Tag (e.g., CBL-SMPTE-001), Model/Name, Category, or Kit..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Quick Reset */}
                        {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || kitFilter !== 'all') && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
                            >
                                <FaTimes />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. Category Filter */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Category
                            </label>
                            <select
                                id="category-filter-select"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Categories ({cables.length})</option>
                                {CABLE_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Condition / Fine Filter */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Health Condition (Fine)
                            </label>
                            <select
                                id="status-filter-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setActiveTab('custom');
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Conditions</option>
                                <option value="Working Fine">Working Fine (Healthy)</option>
                                <option value="Faulty">Faulty (Broken)</option>
                                <option value="Need to be sent to repair">Need to be sent to repair</option>
                                <option value="Under Maintenance">Under Maintenance</option>
                            </select>
                        </div>

                        {/* 3. Kit Location with Add/Delete trigger */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Assigned Kit / Origin
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsKitManagerOpen(true)}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                    title="Add or Delete Kit Origin Locations"
                                >
                                    <FaTruck className="text-[9px]" />
                                    <span>Add / Delete</span>
                                </button>
                            </div>
                            <select
                                id="kit-filter-select"
                                value={kitFilter}
                                onChange={(e) => setKitFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Kits & Locations</option>
                                <option value="Main Central Depot">Main Central Depot</option>
                                {kits.map((k) => {
                                    const kitName = typeof k === 'string' ? k : k.name;
                                    return (
                                        <option key={kitName} value={kitName}>{kitName}</option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Cable Fleet Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 border-collapse">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-4">Tag & Name</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Condition (Fine?)</th>
                                <th className="py-3.5 px-4">Kit / Location</th>
                                <th className="py-3.5 px-4 text-center">QR Tag</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <FaRedo className="animate-spin text-emerald-600" />
                                            <span>Loading broadcast cables...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCables.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <FaNetworkWired className="mx-auto text-3xl text-slate-300" />
                                            <p className="font-semibold text-slate-600">No cables match your current filters</p>
                                            <p className="text-xs text-slate-400">
                                                Try adjusting search keywords or clearing your active filters.
                                            </p>
                                            <button
                                                onClick={resetFilters}
                                                className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCables.map((cable) => {
                                    const isFine = cable.status === 'Working Fine';

                                    return (
                                        <tr
                                            key={cable._id}
                                            className="hover:bg-slate-50/80 transition-colors duration-150"
                                        >
                                            {/* Tag & Name & Length */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-indigo-700">
                                                        {cable.cableTag}
                                                    </span>
                                                    {cable.length && (
                                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                            {cable.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-slate-800 text-xs mt-1">
                                                    {cable.name}
                                                </div>
                                                {(cable.comments || cable.comment || cable.notes) && (
                                                    <div className="text-[11px] font-normal text-slate-500 italic mt-1 line-clamp-1 flex items-center gap-1" title={cable.comments || cable.comment || cable.notes}>
                                                        <span className="text-emerald-600 font-bold not-italic text-[10px]">Note:</span>
                                                        <span>{cable.comments || cable.comment || cable.notes}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="py-3.5 px-4">
                                                <span className="inline-block text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                    {cable.category}
                                                </span>
                                            </td>

                                            {/* Condition / How Many Are Fine */}
                                            <td className="py-3.5 px-4">
                                                {isFine ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <FaCheckCircle className="text-emerald-600" />
                                                        Working Fine
                                                    </span>
                                                ) : cable.status === 'Faulty' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                        <FaExclamationTriangle className="text-rose-600" />
                                                        Faulty
                                                    </span>
                                                ) : cable.status === 'Need to be sent to repair' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                        <FaTools className="text-amber-600" />
                                                        Need to be sent to repair
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                        <FaRedo className="text-blue-600" />
                                                        Under Maintenance
                                                    </span>
                                                )}
                                            </td>

                                            {/* Kit / Location */}
                                            <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                                                {cable.kitComingFrom || 'Main Central Depot'}
                                            </td>

                                            {/* QR Code Action */}
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCableForQr(cable);
                                                        setIsQrModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Generate and Print Cable QR Asset Sticker"
                                                >
                                                    <FaQrcode className="text-base" />
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleDuplicate(cable)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Duplicate Cable (Copy specs with new Cable Tag / Serial)"
                                                    >
                                                        <FaCopy className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCable(cable);
                                                            setIsFormModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                        title="Edit Cable Details"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCable(cable)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        title="Delete Cable"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs font-semibold text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div>
                        Showing <strong className="text-slate-800">{filteredCables.length}</strong> of{' '}
                        <strong className="text-slate-800">{cables.length}</strong> registered broadcast cables
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            Fine: <strong>{summary.fineCount}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                            Faulty: <strong>{summary.faultyCount || 0}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                            In Repair / Test: <strong>{(summary.repairCount || 0) + (summary.maintenanceCount || 0)}</strong>
                        </span>
                    </div>
                </div>
            </section>

            {/* Modals */}
            <CableFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingCable(null);
                }}
                onSave={handleSaveCable}
                editingCable={editingCable}
                availableCables={cables}
                kits={kits}
                onOpenKitManager={() => setIsKitManagerOpen(true)}
            />

            <CableQrModal
                isOpen={isQrModalOpen}
                onClose={() => {
                    setIsQrModalOpen(false);
                    setSelectedCableForQr(null);
                }}
                cable={selectedCableForQr}
            />

            <KitManagerModal
                isOpen={isKitManagerOpen}
                onClose={() => setIsKitManagerOpen(false)}
                kits={kits}
                onKitsUpdated={(updatedKits) => {
                    setKits(updatedKits);
                    fetchData();
                }}
            />

            {/* Created by Shreyash Varshney Footer Credit */}
            <footer className="pt-6 pb-3 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                NEP INDIA PVT LTD &bull; Cable Management &bull; <span className="font-bold text-slate-800">Created by Shreyash Varshney</span>
            </footer>
        </div>
    );
};

export default Cables;
