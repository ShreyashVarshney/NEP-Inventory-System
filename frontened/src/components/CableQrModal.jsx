import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FaTimes, FaDownload, FaPrint } from 'react-icons/fa';

const CableQrModal = ({ isOpen, onClose, cable }) => {
    if (!isOpen || !cable) return null;

    const cableName = cable.name || "Broadcast Cable";
    const cableTag = cable.cableTag || "CBL-001";
    const category = cable.category || "SMPTE 311M Hybrid Fiber";
    const length = cable.length || "100m";
    const kit = cable.kitComingFrom || "Main Central Depot";
    const date = cable.date || new Date().toISOString().slice(0, 10);
    const comments = cable.comments || cable.comment || cable.notes || "";

    const qrPayload = JSON.stringify({
        company: "NEP INDIA PVT LTD",
        assetType: "Broadcast Cable",
        tag: cableTag,
        name: cableName,
        category,
        length,
        status,
        kitComingFrom: kit,
        date,
        comments
    }, null, 2);

    const handleDownloadQr = () => {
        const canvas = document.getElementById("cable-qr-canvas");
        if (!canvas) return;

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        const safeTag = cableTag.replace(/[^a-zA-Z0-9_-]/g, "_");
        downloadLink.href = pngUrl;
        downloadLink.download = `NEP_CABLE_${safeTag}_QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
    };

    const handlePrintTag = () => {
        const printWindow = window.open('', '', 'width=650,height=750');
        const canvas = document.getElementById("cable-qr-canvas");
        const qrDataUrl = canvas ? canvas.toDataURL("image/png") : "";

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>NEP INDIA PVT LTD - Cable Asset Tag ${cableTag}</title>
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
                        width: 170px;
                        height: 170px;
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
                            <div class="company-sub">Broadcast Cable Asset Tag</div>
                        </div>
                        <div style="font-weight: 800; font-size: 14px; background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 6px; font-family: monospace;">
                            ${cableTag}
                        </div>
                    </div>

                    <div class="qr-section">
                        <img src="${qrDataUrl}" alt="Cable QR Code" />
                        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Scan to verify cable assignment & health status</div>
                    </div>

                    <div class="grid">
                        <div class="item-full">
                            <div class="label">Cable Name</div>
                            <div class="val">${cableName}</div>
                        </div>
                        <div class="item">
                            <div class="label">Category</div>
                            <div class="val">${category}</div>
                        </div>
                        <div class="item">
                            <div class="label">Length</div>
                            <div class="val">${length}</div>
                        </div>
                        <div class="item">
                            <div class="label">Health Status</div>
                            <div class="val" style="color: ${status === 'Working Fine' ? '#16a34a' : '#dc2626'};">${status}</div>
                        </div>
                        <div class="item">
                            <div class="label">Kit / Location</div>
                            <div class="val">${kit}</div>
                        </div>
                        ${comments ? `
                        <div class="item-full">
                            <div class="label">Comments / Inspection Notes</div>
                            <div class="val" style="font-style: italic; color: #475569;">${comments}</div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="footer">
                        NEP INDIA PVT LTD • Cable Logistics System
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            NEP INDIA PVT LTD
                        </div>
                        <h2 className="text-base font-black text-white mt-0.5">
                            Cable Asset Tag & QR
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
                <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div>
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                                {cableTag}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 mt-1">{cableName}</h3>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            status === "Working Fine"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}>
                            {status}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center shrink-0">
                            <QRCodeCanvas
                                id="cable-qr-canvas"
                                value={qrPayload}
                                size={140}
                                level="H"
                                includeMargin={true}
                            />
                            <span className="mt-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                                {cableTag}
                            </span>
                        </div>

                        <div className="flex-1 w-full space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Category:</span>
                                <span className="font-bold text-slate-900 text-right">{category}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Length:</span>
                                <span className="font-bold text-slate-900">{length}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">Kit / Location:</span>
                                <span className="font-semibold text-slate-800 text-right">{kit}</span>
                            </div>
                            {comments && (
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500 font-medium">Comments:</span>
                                    <span className="font-medium text-slate-700 text-right max-w-[200px] truncate" title={comments}>
                                        {comments}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadQr}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm"
                        >
                            <FaDownload className="text-xs" />
                            <span>Download QR (PNG)</span>
                        </button>
                        <button
                            onClick={handlePrintTag}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm"
                        >
                            <FaPrint className="text-xs" />
                            <span>Print Asset Tag</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CableQrModal;
