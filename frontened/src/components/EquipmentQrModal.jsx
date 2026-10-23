import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FaTimes, FaDownload, FaPrint, FaQrcode, FaCalendarAlt, FaClock, FaBox } from 'react-icons/fa';

const EquipmentQrModal = ({ isOpen, onClose, equipment }) => {
    const qrCanvasRef = useRef(null);

    if (!isOpen || !equipment) return null;

    const equipName = equipment.name || "Equipment";
    const equipModel = equipment.model || "N/A";
    const equipStatus = equipment.status || equipment.conditionStatus || "Available";
    const equipDate = equipment.date || (equipment.createdAt ? new Date(equipment.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const equipTime = equipment.time || (equipment.createdAt ? new Date(equipment.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "12:00");
    const equipKit = equipment.kitComingFrom || equipment.currentLocation || "Main Warehouse";
    const equipSerial = equipment.serialNumber || equipment.sku || "N/A";
    const equipId = equipment.serialNumber || equipment.sku || equipment._id?.slice(-6) || "NEP-EQP";
    const equipComments = equipment.comments || equipment.comment || equipment.description || "";

    // Structured JSON payload encoded in QR code
    const qrPayload = JSON.stringify({
        company: "NEP INDIA PVT LTD",
        id: equipId,
        serialNumber: equipSerial,
        model: equipModel,
        name: equipName,
        status: equipStatus,
        date: equipDate,
        time: equipTime,
        kitComingFrom: equipKit,
        comments: equipComments
    }, null, 2);

    // Download QR Code as PNG image
    const handleDownloadQr = () => {
        const canvas = document.getElementById("equipment-qr-canvas");
        if (!canvas) return;

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        const safeModel = equipModel.replace(/[^a-zA-Z0-9_-]/g, "_");
        downloadLink.href = pngUrl;
        downloadLink.download = `NEP_${safeModel}_QR_${equipDate}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
    };

    // Print Equipment Asset Tag
    const handlePrintTag = () => {
        const printWindow = window.open('', '', 'width=650,height=750');
        const canvas = document.getElementById("equipment-qr-canvas");
        const qrDataUrl = canvas ? canvas.toDataURL("image/png") : "";

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>NEP INDIA PVT LTD - Asset Tag ${equipId}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        margin: 0;
                        padding: 30px;
                        background: #fff;
                        color: #0f172a;
                    }
                    .tag-card {
                        border: 3px solid #0f172a;
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 480px;
                        margin: 0 auto;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #0f172a;
                        padding-bottom: 12px;
                        margin-bottom: 16px;
                    }
                    .company-title {
                        font-size: 22px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 0;
                        letter-spacing: -0.5px;
                    }
                    .company-sub {
                        font-size: 10px;
                        font-weight: 700;
                        color: #059669;
                        letter-spacing: 1.5px;
                        text-transform: uppercase;
                    }
                    .qr-section {
                        text-align: center;
                        margin: 16px 0;
                    }
                    .qr-section img {
                        width: 180px;
                        height: 180px;
                        border: 1px solid #e2e8f0;
                        padding: 8px;
                        border-radius: 8px;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        font-size: 13px;
                    }
                    .item {
                        padding: 6px 10px;
                        background: #f8fafc;
                        border-radius: 6px;
                        border-left: 3px solid #0f172a;
                    }
                    .item-full {
                        grid-column: span 2;
                        padding: 6px 10px;
                        background: #f8fafc;
                        border-radius: 6px;
                        border-left: 3px solid #0f172a;
                    }
                    .label {
                        font-size: 10px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #64748b;
                        margin-bottom: 2px;
                    }
                    .val {
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .footer {
                        text-align: center;
                        font-size: 10px;
                        color: #94a3b8;
                        margin-top: 18px;
                        border-top: 1px dashed #cbd5e1;
                        padding-top: 8px;
                    }
                    @media print {
                        body { padding: 0; }
                        .tag-card { border: 2px solid #000; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="tag-card">
                    <div class="header">
                        <div>
                            <h1 class="company-title">NEP INDIA PVT LTD</h1>
                            <div class="company-sub">Equipment Asset Verification</div>
                        </div>
                        <div style="font-weight: 800; font-size: 14px; background: #f1f5f9; color: #0f172a; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                            ${equipId}
                        </div>
                    </div>

                    <div class="qr-section">
                        <img src="${qrDataUrl}" alt="Equipment QR Code" />
                        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Scan for full equipment verification & dispatch history</div>
                    </div>

                    <div class="grid">
                        <div class="item-full">
                            <div class="label">Equipment Name</div>
                            <div class="val" style="font-size: 15px;">${equipName}</div>
                        </div>
                        <div class="item">
                            <div class="label">Model</div>
                            <div class="val">${equipModel}</div>
                        </div>
                        <div class="item">
                            <div class="label">Serial Number</div>
                            <div class="val" style="font-family: monospace;">${equipSerial}</div>
                        </div>
                        <div class="item">
                            <div class="label">Operational Status</div>
                            <div class="val" style="color: ${equipStatus === 'Working Fine' ? '#16a34a' : (equipStatus === 'Faulty' ? '#dc2626' : (equipStatus === 'Under Maintenance' ? '#2563eb' : '#d97706'))};">
                                ${equipStatus}
                            </div>
                        </div>
                        <div class="item">
                            <div class="label">Kit Coming From</div>
                            <div class="val">${equipKit}</div>
                        </div>
                        <div class="item">
                            <div class="label">Date Logged</div>
                            <div class="val">${equipDate}</div>
                        </div>
                        <div class="item">
                            <div class="label">Time</div>
                            <div class="val">${equipTime}</div>
                        </div>
                        ${equipComments ? `
                        <div class="item-full">
                            <div class="label">Comments / Notes</div>
                            <div class="val" style="font-style: italic; color: #475569;">${equipComments}</div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="footer">
                        NEP INDIA PVT LTD • Equipment Logistics System
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() { window.close(); }
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Working Fine":
            case "Available":
                return "bg-emerald-100 text-emerald-800 border-emerald-300";
            case "Faulty":
            case "Damaged":
                return "bg-rose-100 text-rose-800 border-rose-300";
            case "Need to be sent to repair":
            case "Need to be sent to":
            case "Dispatched":
                return "bg-amber-100 text-amber-800 border-amber-300";
            case "Under Maintenance":
            case "Maintenance":
            case "In Use":
                return "bg-blue-100 text-blue-800 border-blue-300";
            default:
                return "bg-slate-100 text-slate-800 border-slate-300";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
                {/* Header Banner - Clean text without logo */}
                <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
                    <div>
                        <div className="text-base font-black tracking-wider text-white">
                            NEP INDIA PVT LTD
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                            Equipment QR Tracking
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                Official Asset Tag
                            </span>
                            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{equipName}</h3>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(equipStatus)}`}>
                            {equipStatus}
                        </span>
                    </div>

                    {/* QR Code and Tag View */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
                        {/* Canvas QR Code */}
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                            <QRCodeCanvas
                                id="equipment-qr-canvas"
                                value={qrPayload}
                                size={140}
                                level="H"
                                includeMargin={true}
                            />
                            <span className="mt-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                                {equipId}
                            </span>
                        </div>

                        {/* Equipment Details Metadata */}
                        <div className="flex-1 w-full space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Model:</span>
                                <span className="font-bold text-slate-900">{equipModel}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Serial Number:</span>
                                <span className="font-mono font-bold text-slate-800">{equipSerial}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Kit Coming From:</span>
                                <span className="font-bold text-emerald-700 text-right">{equipKit}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Date:</span>
                                <span className="font-semibold text-slate-800">{equipDate}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Time:</span>
                                <span className="font-semibold text-slate-800">{equipTime}</span>
                            </div>
                            {equipComments && (
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500 font-medium">Comments:</span>
                                    <span className="font-medium text-slate-700 text-right max-w-[200px] truncate" title={equipComments}>
                                        {equipComments}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadQr}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow"
                        >
                            <FaDownload className="text-xs" />
                            <span>Download QR (PNG)</span>
                        </button>
                        <button
                            onClick={handlePrintTag}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow"
                        >
                            <FaPrint className="text-xs" />
                            <span>Print Asset Tag</span>
                        </button>
                    </div>
                </div>

                {/* Footer Tagline */}
                <div className="bg-slate-100/70 px-6 py-2.5 border-t border-slate-200/60 text-center text-[11px] text-slate-500 font-medium">
                    NEP INDIA PVT LTD • Equipment Logistics System
                </div>
            </div>
        </div>
    );
};

export default EquipmentQrModal;
