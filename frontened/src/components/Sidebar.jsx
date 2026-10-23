import React from 'react';
import {
  FaBox,
  FaCog,
  FaChartPie,
  FaSignOutAlt,
  FaUsers,
  FaUserShield,
  FaNetworkWired
} from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.role === "admin";

    const menuItems = [
        { name: "Summary", path: "/admin-dashboard", icon: <FaChartPie />, isParent: true },
        { name: "Equipment", path: "/admin-dashboard/equipment", icon: <FaBox />, isParent: false },
        { name: "Cables", path: "/admin-dashboard/cables", icon: <FaNetworkWired />, isParent: false },
        ...(isAdmin ? [{ name: "Users", path: "/admin-dashboard/users", icon: <FaUsers />, isParent: false }] : []),
        { name: "Profile", path: "/admin-dashboard/profile", icon: <FaCog />, isParent: false },
    ];

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to sign out of NEP INDIA portal?")) {
            logout();
            navigate("/login");
        }
    };

    return (
        <>
            {/* ============================================================== */}
            {/* 1. DESKTOP / TABLET SIDEBAR (Hidden on mobile < md)          */}
            {/* ============================================================== */}
            <aside className="hidden md:flex flex-col h-screen bg-slate-900 text-slate-100 w-64 fixed left-0 top-0 z-40 shadow-xl border-r border-slate-800 transition-all duration-300">
                {/* Brand Header */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/70">
                    <div>
                        <h1 className="font-black text-sm tracking-widest text-white uppercase">
                            NEP INDIA PVT LTD
                        </h1>
                        <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                            Equipment & Cabling Portal
                        </p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Portal Navigation
                    </p>
                    <ul className="space-y-1.5">
                        {menuItems.map((item) => (
                            <li key={item.name}>
                                <NavLink
                                    end={item.isParent}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                                            isActive
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold"
                                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                        }`
                                    }
                                    title={item.name}
                                >
                                    <span className="text-lg shrink-0">{item.icon}</span>
                                    <span className="truncate">{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* System Information Box */}
                    <div className="mt-8 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px]">
                        <div className="font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            NEP INDIA SYSTEM
                        </div>
                        <div className="text-slate-400 mt-1 leading-relaxed">
                            Equipment inventory, kit origin tracking, and broadcast cable management.
                        </div>
                    </div>
                </div>

                {/* User Profile & Logout */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/80">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user?.name ? user.name.charAt(0).toUpperCase() : <FaUserShield />}
                        </div>
                        <div className="truncate flex-1">
                            <p className="text-xs font-bold text-white truncate">{user?.name || "NEP Operator"}</p>
                            <p className="text-[10px] text-emerald-400 truncate font-mono">{user?.email || "operator@nep.com"}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition duration-150 font-semibold"
                        title="Sign Out"
                    >
                        <FaSignOutAlt className="text-lg shrink-0" />
                        <span>Logout</span>
                    </button>

                    {/* Creator signature */}
                    <div className="mt-2 text-center text-[10px] text-slate-500 font-medium">
                        Created by <span className="text-slate-300 font-bold">Shreyash Varshney</span>
                    </div>
                </div>
            </aside>

            {/* ============================================================== */}
            {/* 2. MOBILE TOP APP BAR (Visible only on mobile screens < md)   */}
            {/* ============================================================== */}
            <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <div>
                        <h1 className="font-black text-xs uppercase tracking-wider text-white">
                            NEP INDIA PVT LTD
                        </h1>
                        <p className="text-[9px] text-emerald-400 font-semibold tracking-wide uppercase">
                            Mobile App
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-sm"
                        title="Sign Out"
                    >
                        <FaSignOutAlt />
                    </button>
                </div>
            </header>

            {/* ============================================================== */}
            {/* 3. MOBILE BOTTOM NAVIGATION BAR (Native App Experience)      */}
            {/* ============================================================== */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.name}
                        end={item.isParent}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-h-[46px] min-w-[54px] ${
                                isActive
                                    ? "text-emerald-400 font-black scale-105"
                                    : "text-slate-400 hover:text-slate-200 font-medium"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`text-base sm:text-lg mb-0.5 ${isActive ? "text-emerald-400 drop-shadow-md" : ""}`}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] tracking-tight">
                                    {item.name}
                                </span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5"></span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </>
    );
};

export default Sidebar;