import Cable from '../models/Cable.js';
import Kit from '../models/Kit.js';

// Seed sample broadcast cables for NEP INDIA PVT LTD if collection is empty
const seedInitialCablesIfEmpty = async () => {
    try {
        const count = await Cable.countDocuments();
        if (count > 0) {
            await Cable.updateMany(
                { pairingStatus: 'Need to be Paired' },
                { pairingStatus: 'Cable Pending' }
            ).catch(() => {});
            return;
        }

        const initialCables = [
            {
                name: 'SMPTE Fiber Drum A1',
                cableTag: 'CBL-SMPTE-001',
                category: 'SMPTE 311M Hybrid Fiber',
                length: '100m',
                status: 'Working Fine',
                pairingStatus: 'Paired',
                pairedWith: 'CBL-SMPTE-002',
                kitComingFrom: 'OB Van 1 - Production Unit',
                notes: 'Primary 4K Camera 1 Fiber link'
            },
            {
                name: 'SMPTE Fiber Drum A2',
                cableTag: 'CBL-SMPTE-002',
                category: 'SMPTE 311M Hybrid Fiber',
                length: '100m',
                status: 'Working Fine',
                pairingStatus: 'Paired',
                pairedWith: 'CBL-SMPTE-001',
                kitComingFrom: 'OB Van 1 - Production Unit',
                notes: 'Paired with Drum A1 for dual redundancy'
            },
            {
                name: 'SMPTE Fiber Drum B1',
                cableTag: 'CBL-SMPTE-003',
                category: 'SMPTE 311M Hybrid Fiber',
                length: '150m',
                status: 'Working Fine',
                pairingStatus: 'Cable Pending',
                pairedWith: '',
                kitComingFrom: 'OB Van 2 - Sports Unit',
                notes: 'Awaiting match with Drum B2'
            },
            {
                name: '12G-SDI Video Reel 1',
                cableTag: 'CBL-SDI-101',
                category: '12G/3G-SDI BNC Coaxial',
                length: '50m',
                status: 'Working Fine',
                pairingStatus: 'Paired',
                pairedWith: 'CBL-SDI-102',
                kitComingFrom: 'PCR Control Room',
                notes: 'PGM Feed TX/RX Pair'
            },
            {
                name: '12G-SDI Video Reel 2',
                cableTag: 'CBL-SDI-102',
                category: '12G/3G-SDI BNC Coaxial',
                length: '50m',
                status: 'Working Fine',
                pairingStatus: 'Paired',
                pairedWith: 'CBL-SDI-101',
                kitComingFrom: 'PCR Control Room',
                notes: 'PGM Return Pair'
            },
            {
                name: '12G-SDI Video Reel 3',
                cableTag: 'CBL-SDI-103',
                category: '12G/3G-SDI BNC Coaxial',
                length: '50m',
                status: 'Faulty',
                pairingStatus: 'Cable Pending',
                pairedWith: '',
                kitComingFrom: 'Main Central Depot',
                notes: 'BNC pin bent on connector B'
            },
            {
                name: 'Audio Stage Snake 16CH A',
                cableTag: 'CBL-AUD-201',
                category: 'Audio Multi-Snake / XLR',
                length: '30m',
                status: 'Working Fine',
                pairingStatus: 'Paired',
                pairedWith: 'CBL-AUD-202',
                kitComingFrom: 'Studio Floor A',
                notes: 'Commentary & FX Pair'
            },
            {
                name: 'Audio Stage Snake 16CH B',
                cableTag: 'CBL-AUD-202',
                category: 'Audio Multi-Snake / XLR',
                length: '30m',
                status: 'Working Fine',
                pairingStatus: 'Paired',
                pairedWith: 'CBL-AUD-201',
                kitComingFrom: 'Studio Floor A',
                notes: 'Paired with Snake A'
            },
            {
                name: 'Cat6A Tactical EtherCON Reel',
                cableTag: 'CBL-ETH-301',
                category: 'Cat6A / Cat6 Tactical Ethernet',
                length: '75m',
                status: 'Working Fine',
                pairingStatus: 'Cable Pending',
                pairedWith: '',
                kitComingFrom: 'Flypack Kit 1',
                notes: 'Dante primary line, needs secondary backup cable pairing'
            },
            {
                name: 'Triax Studio Cable #4',
                cableTag: 'CBL-TRX-401',
                category: 'Triax Camera Cable',
                length: '100m',
                status: 'Under Maintenance',
                pairingStatus: 'Single / Standalone',
                pairedWith: '',
                kitComingFrom: 'Central Engineering Lab',
                notes: 'Under continuity testing'
            }
        ];

        for (const c of initialCables) {
            await Cable.create(c).catch(() => {});
        }
        console.log('Seeded initial NEP INDIA broadcast cables');
    } catch (e) {
        console.error('Error seeding cables:', e);
    }
};

// Execute seed check
seedInitialCablesIfEmpty();

export const getCables = async (req, res) => {
    try {
        const { category, status, pairingStatus, kitComingFrom, search } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        }

        if (status && status !== 'all') {
            const escaped = status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.status = { $regex: new RegExp(`^${escaped}$`, 'i') };
        }

        if (pairingStatus && pairingStatus !== 'all') {
            if (pairingStatus === 'Cable Pending' || pairingStatus === 'Need to be Paired') {
                query.pairingStatus = { $in: ['Cable Pending', 'Need to be Paired'] };
            } else {
                const escaped = pairingStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.pairingStatus = { $regex: new RegExp(`^${escaped}$`, 'i') };
            }
        }

        if (kitComingFrom && kitComingFrom !== 'all') {
            query.kitComingFrom = { $regex: new RegExp(`^${kitComingFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { cableTag: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { pairedWith: { $regex: search, $options: 'i' } },
                { kitComingFrom: { $regex: search, $options: 'i' } },
                { length: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { comments: { $regex: search, $options: 'i' } },
                { comment: { $regex: search, $options: 'i' } }
            ];
        }

        const cables = await Cable.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            cables,
            count: cables.length
        });
    } catch (error) {
        console.error('Error fetching cables:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching cables' });
    }
};

export const getCableSummary = async (req, res) => {
    try {
        const cables = await Cable.find();

        const total = cables.length;
        const fineCount = cables.filter(c => c.status === 'Working Fine').length;
        const needPairingCount = cables.filter(c => c.pairingStatus === 'Cable Pending' || c.pairingStatus === 'Need to be Paired').length;
        const pairedCount = cables.filter(c => c.pairingStatus === 'Paired').length;
        const faultyCount = cables.filter(c => c.status === 'Faulty').length;
        const repairCount = cables.filter(c => c.status === 'Need to be sent to repair').length;
        const maintenanceCount = cables.filter(c => c.status === 'Under Maintenance').length;

        // Group by category with "how many are fine" and "cable pending"
        const categoryMap = {};
        for (const c of cables) {
            const cat = c.category || 'General Broadcast Cable';
            if (!categoryMap[cat]) {
                categoryMap[cat] = {
                    category: cat,
                    total: 0,
                    fine: 0,
                    fineCount: 0,
                    needPairing: 0,
                    needPairingCount: 0,
                    paired: 0,
                    pairedCount: 0,
                    faulty: 0,
                    faultyCount: 0
                };
            }
            categoryMap[cat].total += 1;
            if (c.status === 'Working Fine') {
                categoryMap[cat].fine += 1;
                categoryMap[cat].fineCount += 1;
            }
            if (c.pairingStatus === 'Cable Pending' || c.pairingStatus === 'Need to be Paired') {
                categoryMap[cat].needPairing += 1;
                categoryMap[cat].needPairingCount += 1;
            }
            if (c.pairingStatus === 'Paired') {
                categoryMap[cat].paired += 1;
                categoryMap[cat].pairedCount += 1;
            }
            if (c.status === 'Faulty' || c.status === 'Need to be sent to repair') {
                categoryMap[cat].faulty += 1;
                categoryMap[cat].faultyCount += 1;
            }
        }

        const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total);

        const summaryData = {
            total,
            fineCount,
            needPairingCount,
            pairedCount,
            faultyCount,
            repairCount,
            maintenanceCount,
            categoryBreakdown
        };

        return res.status(200).json({
            success: true,
            summary: summaryData,
            metrics: summaryData,
            categoryBreakdown
        });
    } catch (error) {
        console.error('Error computing cable summary:', error);
        return res.status(500).json({ success: false, message: 'Server error computing cable summary' });
    }
};

export const addCable = async (req, res) => {
    try {
        let {
            name,
            cableTag,
            category,
            length,
            status,
            pairingStatus,
            pairedWith,
            kitComingFrom,
            notes,
            comments,
            comment
        } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Cable Name is required.' });
        }

        if (!category || category.trim() === '') {
            category = 'SMPTE 311M Hybrid Fiber';
        }

        if (!cableTag || cableTag.trim() === '') {
            const prefix = category.includes('Fiber')
                ? 'SMPTE'
                : (category.includes('SDI') ? 'SDI' : (category.includes('Audio') ? 'AUD' : 'CBL'));
            const random = Math.floor(100 + Math.random() * 900);
            cableTag = `CBL-${prefix}-${random}`;
        } else {
            cableTag = cableTag.trim().toUpperCase();
        }

        // Check duplicate cableTag
        const existing = await Cable.findOne({ cableTag });
        if (existing) {
            cableTag = `${cableTag}-${Math.floor(10 + Math.random() * 90)}`;
        }

        const kit = kitComingFrom && kitComingFrom.trim() !== '' ? kitComingFrom.trim() : 'Main Central Depot';
        await Kit.findOneAndUpdate({ name: kit }, { name: kit }, { upsert: true }).catch(() => {});

        const commentVal = (comments || comment || notes || '').trim();

        const cable = new Cable({
            name: name.trim(),
            cableTag,
            category: category.trim(),
            length: length ? length.trim() : '100m',
            status: status || 'Working Fine',
            pairingStatus: pairingStatus || 'Cable Pending',
            pairedWith: pairedWith ? pairedWith.trim() : '',
            kitComingFrom: kit,
            currentLocation: kit,
            notes: commentVal,
            comments: commentVal,
            comment: commentVal
        });

        await cable.save();

        // If pairedWith was specified and exists, update the partner cable to be paired with this cable
        if (cable.pairedWith && cable.pairingStatus === 'Paired') {
            await Cable.findOneAndUpdate(
                { cableTag: cable.pairedWith },
                { pairingStatus: 'Paired', pairedWith: cable.cableTag, pairedCableId: cable._id }
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Cable added successfully',
            cable
        });
    } catch (error) {
        console.error('Error adding cable:', error);
        return res.status(500).json({ success: false, message: 'Server error adding cable' });
    }
};

export const updateCable = async (req, res) => {
    try {
        const { id } = req.params;
        let {
            name,
            cableTag,
            category,
            length,
            status,
            pairingStatus,
            pairedWith,
            kitComingFrom,
            notes,
            comments,
            comment
        } = req.body;

        const current = await Cable.findById(id);
        if (!current) {
            return res.status(404).json({ success: false, message: 'Cable not found' });
        }

        const commentVal = comments !== undefined ? comments : (comment !== undefined ? comment : notes);

        const updateData = {
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(category !== undefined ? { category: category.trim() } : {}),
            ...(length !== undefined ? { length: length.trim() } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(pairingStatus !== undefined ? { pairingStatus } : {}),
            ...(pairedWith !== undefined ? { pairedWith: pairedWith.trim() } : {}),
            ...(kitComingFrom !== undefined ? { kitComingFrom: kitComingFrom.trim(), currentLocation: kitComingFrom.trim() } : {}),
            ...(commentVal !== undefined ? { notes: commentVal.trim(), comments: commentVal.trim(), comment: commentVal.trim() } : {})
        };

        if (cableTag && cableTag.trim().toUpperCase() !== current.cableTag) {
            const duplicate = await Cable.findOne({ cableTag: cableTag.trim().toUpperCase(), _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, message: `Cable tag "${cableTag}" already in use.` });
            }
            updateData.cableTag = cableTag.trim().toUpperCase();
        }

        const updated = await Cable.findByIdAndUpdate(id, updateData, { new: true });

        // Handle bi-directional pairing link if changed
        if (pairingStatus === 'Paired' && pairedWith && pairedWith !== current.pairedWith) {
            await Cable.findOneAndUpdate(
                { cableTag: pairedWith },
                { pairingStatus: 'Paired', pairedWith: updated.cableTag, pairedCableId: updated._id }
            );
        } else if (pairingStatus !== 'Paired' && current.pairedWith) {
            await Cable.findOneAndUpdate(
                { cableTag: current.pairedWith },
                { pairingStatus: 'Cable Pending', pairedWith: '', pairedCableId: null }
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Cable updated successfully',
            cable: updated
        });
    } catch (error) {
        console.error('Error updating cable:', error);
        return res.status(500).json({ success: false, message: 'Server error updating cable' });
    }
};

// Quick pair two cables together
export const pairCables = async (req, res) => {
    try {
        const { cableId1, cableId2 } = req.body;
        if (!cableId1 || !cableId2) {
            return res.status(400).json({ success: false, message: 'Both cables are required for pairing' });
        }

        const cable1 = await Cable.findById(cableId1);
        const cable2 = await Cable.findById(cableId2);

        if (!cable1 || !cable2) {
            return res.status(404).json({ success: false, message: 'One or both cables could not be found' });
        }

        cable1.pairingStatus = 'Paired';
        cable1.pairedWith = cable2.cableTag;
        cable1.pairedCableId = cable2._id;
        await cable1.save();

        cable2.pairingStatus = 'Paired';
        cable2.pairedWith = cable1.cableTag;
        cable2.pairedCableId = cable1._id;
        await cable2.save();

        return res.status(200).json({
            success: true,
            message: `Successfully paired ${cable1.cableTag} with ${cable2.cableTag}`,
            cable1,
            cable2
        });
    } catch (error) {
        console.error('Error pairing cables:', error);
        return res.status(500).json({ success: false, message: 'Server error pairing cables' });
    }
};

// Unpair a cable
export const unpairCable = async (req, res) => {
    try {
        const { id } = req.params;
        const cable = await Cable.findById(id);
        if (!cable) {
            return res.status(404).json({ success: false, message: 'Cable not found' });
        }

        const partnerTag = cable.pairedWith;
        cable.pairingStatus = 'Cable Pending';
        cable.pairedWith = '';
        cable.pairedCableId = null;
        await cable.save();

        if (partnerTag) {
            await Cable.findOneAndUpdate(
                { cableTag: partnerTag },
                { pairingStatus: 'Cable Pending', pairedWith: '', pairedCableId: null }
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Cable unpaired successfully',
            cable
        });
    } catch (error) {
        console.error('Error unpairing cable:', error);
        return res.status(500).json({ success: false, message: 'Server error unpairing cable' });
    }
};

export const deleteCable = async (req, res) => {
    try {
        const { id } = req.params;
        const cable = await Cable.findById(id);
        if (!cable) {
            return res.status(404).json({ success: false, message: 'Cable not found' });
        }

        if (cable.pairedWith) {
            await Cable.findOneAndUpdate(
                { cableTag: cable.pairedWith },
                { pairingStatus: 'Cable Pending', pairedWith: '', pairedCableId: null }
            );
        }

        await Cable.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Cable deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting cable:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting cable' });
    }
};

export const exportCablesCSV = async (req, res) => {
    try {
        const cables = await Cable.find().sort({ category: 1, createdAt: -1 });

        const headers = [
            'Company',
            'Cable Tag / ID',
            'Cable Name',
            'Category',
            'Length',
            'Health Status',
            'Pairing Status',
            'Paired With',
            'Kit / Location',
            'Date Logged',
            'Notes'
        ];

        const escapeCSV = (field) => {
            if (field === null || field === undefined) return '""';
            const str = String(field).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = cables.map((c) => [
            escapeCSV('NEP INDIA PVT LTD'),
            escapeCSV(c.cableTag),
            escapeCSV(c.name),
            escapeCSV(c.category),
            escapeCSV(c.length || '100m'),
            escapeCSV(c.status),
            escapeCSV(c.pairingStatus === 'Need to be Paired' ? 'Cable Pending' : c.pairingStatus),
            escapeCSV(c.pairedWith || 'N/A'),
            escapeCSV(c.kitComingFrom || 'Main Central Depot'),
            escapeCSV(c.date || 'N/A'),
            escapeCSV(c.comments || c.comment || c.notes || '')
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="NEP_INDIA_Cables_${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error exporting cables CSV:', error);
        return res.status(500).json({ success: false, message: 'Server error exporting cables' });
    }
};
