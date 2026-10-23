import React from 'react';
import { Outlet } from 'react-router';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
            <Sidebar />

            {/* Main Content Area */}
            {/* On mobile: ml-0 with bottom padding pb-20 to allow bottom nav; On desktop: ml-64 */}
            <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all duration-300 pb-20 md:pb-0">
                <main className="flex-1">
                    <Outlet />
                </main>

                {/* Global Footer at the end of the project */}
                <footer className="w-full py-4 px-4 sm:px-6 bg-white border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="text-slate-600 font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            NEP INDIA PVT LTD &bull; Equipment & Cable Management System
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold shadow-sm">
                            Created by Shreyash Varshney
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;