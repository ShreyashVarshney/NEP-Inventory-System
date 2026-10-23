import Equipment from '../models/Equipment.js';
import Kit from '../models/Kit.js';
import Cable from '../models/Cable.js';

export const addEquipment = async (req, res) => {
    try {
        let {
            name,
            model,
            status,
            conditionStatus,
            date,
            time,
            kitComingFrom,
            serialNumber,
            sku,
            currentLocation,
            quantity,
            description,
            comments,
            comment,
            notes
        } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Equipment Name is required.' });
        }

        const equipStatus = status || conditionStatus || 'Working Fine';
        const condStatus = conditionStatus || status || 'Working Fine';

        const equipDate = date && date.trim() !== '' ? date.trim() : new Date().toISOString().slice(0, 10);
        const equipTime = time && time.trim() !== '' ? time.trim() : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const kitFrom = kitComingFrom && kitComingFrom.trim() !== '' ? kitComingFrom.trim() : (currentLocation || 'Main Central Depot');

        // Ensure kit is saved in Kit collection
        if (kitFrom) {
            await Kit.findOneAndUpdate(
                { name: kitFrom },
                { name: kitFrom },
                { upsert: true, returnDocument: 'after' }
            ).catch(() => {});
        }

        if (!sku || sku.trim() === '') {
            const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'EQP';
            const random = Math.floor(1000 + Math.random() * 9000);
            sku = `NEP-${prefix}-${random}`;
        } else {
            sku = sku.trim().toUpperCase();
        }

        if (!serialNumber || serialNumber.trim() === '') {
            serialNumber = `SN-NEP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
        } else {
            serialNumber = serialNumber.trim();
        }

        const existing = await Equipment.findOne({ sku });
        if (existing) {
            sku = `${sku}-${Math.floor(10 + Math.random() * 90)}`;
        }

        const commentVal = (comments || comment || notes || description || '').trim();

        const equipment = new Equipment({
            name: name.trim(),
            model: model ? model.trim() : '',
            status: equipStatus,
            conditionStatus: condStatus,
            date: equipDate,
            time: equipTime,
            kitComingFrom: kitFrom,
            currentLocation: kitFrom,
            serialNumber,
            sku,
            quantity: quantity !== undefined && quantity !== '' ? Number(quantity) : 1,
            description: commentVal,
            comments: commentVal,
            comment: commentVal
        });

        await equipment.save();

        return res.status(201).json({
            success: true,
            message: 'Equipment added successfully',
            product: equipment,
            equipment
        });
    } catch (error) {
        console.error('Error adding equipment:', error);
        return res.status(500).json({ success: false, message: 'Server error adding equipment' });
    }
};

export const getEquipment = async (req, res) => {
    try {
        const { status, conditionStatus, kitComingFrom, date, search } = req.query;
        let query = {};

        const targetStatus = status || conditionStatus;
        if (targetStatus && targetStatus !== 'all') {
            const escaped = targetStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const statusOr = [
                { status: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { conditionStatus: { $regex: new RegExp(`^${escaped}$`, 'i') } }
            ];

            if (targetStatus.toLowerCase().includes('repair') || targetStatus.toLowerCase() === 'need to be sent to') {
                statusOr.push(
                    { status: { $regex: /need to be sent/i } },
                    { conditionStatus: { $regex: /need to be sent/i } }
                );
            } else if (targetStatus.toLowerCase().includes('maintenance')) {
                statusOr.push(
                    { status: { $regex: /maintenance/i } },
                    { conditionStatus: { $regex: /maintenance/i } }
                );
            }

            query.$or = statusOr;
        }

        if (kitComingFrom && kitComingFrom !== 'all') {
            query.kitComingFrom = { $regex: new RegExp(`^${kitComingFrom}$`, 'i') };
        }

        if (date && date !== 'all') {
            query.date = date;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } },
                { kitComingFrom: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
                { comments: { $regex: search, $options: 'i' } },
                { comment: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const equipmentList = await Equipment.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            products: equipmentList,
            equipment: equipmentList
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching equipment' });
    }
};

export const getDistinctKits = async (req, res) => {
    try {
        const defaultKits = [
            'OB Van 1 - Production Unit',
            'OB Van 2 - Sports Unit',
            'Studio Floor A',
            'Studio Floor B',
            'PCR Control Room',
            'Main Central Depot',
            'Flypack Kit 1',
            'Client Return / Rental'
        ];

        const count = await Kit.countDocuments();
        if (count === 0) {
            for (const d of defaultKits) {
                await Kit.create({ name: d }).catch(() => {});
            }
        }

        const dbKits = await Kit.find().sort({ name: 1 });
        const equipKits = await Equipment.distinct('kitComingFrom');

        const allKits = Array.from(new Set([
            ...dbKits.map(k => k.name),
            ...equipKits.filter(Boolean)
        ]));

        return res.status(200).json({ success: true, kits: allKits });
    } catch (error) {
        console.error('Error fetching kits:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching kits' });
    }
};

export const addKit = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Kit name is required' });
        }
        const trimmed = name.trim();
        await Kit.findOneAndUpdate(
            { name: trimmed },
            { name: trimmed },
            { upsert: true, returnDocument: 'after' }
        );
        const all = await Kit.find().sort({ name: 1 });
        return res.status(201).json({ success: true, message: 'Kit added successfully', kits: all.map(k => k.name) });
    } catch (error) {
        console.error('Error adding kit:', error);
        return res.status(500).json({ success: false, message: 'Server error adding kit' });
    }
};

export const deleteKit = async (req, res) => {
    try {
        const { kitName } = req.params;
        const decodedKit = decodeURIComponent(kitName).trim();

        const escaped = decodedKit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 1. Delete from Kit collection
        await Kit.deleteMany({ name: { $regex: new RegExp(`^${escaped}$`, 'i') } });

        // 2. Reassign equipment and cables that were mapped to this kit to 'Main Central Depot'
        await Equipment.updateMany(
            {
                $or: [
                    { kitComingFrom: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                    { currentLocation: { $regex: new RegExp(`^${escaped}$`, 'i') } }
                ]
            },
            { $set: { kitComingFrom: 'Main Central Depot', currentLocation: 'Main Central Depot' } }
        );

        await Cable.updateMany(
            {
                $or: [
                    { kitComingFrom: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                    { currentLocation: { $regex: new RegExp(`^${escaped}$`, 'i') } }
                ]
            },
            { $set: { kitComingFrom: 'Main Central Depot', currentLocation: 'Main Central Depot' } }
        ).catch(() => {});

        // Ensure 'Main Central Depot' exists
        await Kit.findOneAndUpdate(
            { name: 'Main Central Depot' },
            { name: 'Main Central Depot' },
            { upsert: true }
        ).catch(() => {});

        // 3. Fetch remaining distinct kits
        const dbKits = await Kit.find().sort({ name: 1 });
        const equipKits = await Equipment.distinct('kitComingFrom');
        const remainingKits = Array.from(new Set([
            ...dbKits.map(k => k.name),
            ...equipKits.filter(Boolean)
        ]));

        return res.status(200).json({
            success: true,
            message: `Kit "${decodedKit}" deleted successfully`,
            kits: remainingKits
        });
    } catch (error) {
        console.error('Error deleting kit:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting kit' });
    }
};

export const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        let {
            name,
            model,
            status,
            conditionStatus,
            date,
            time,
            kitComingFrom,
            serialNumber,
            sku,
            currentLocation,
            quantity,
            description,
            comments,
            comment,
            notes
        } = req.body;

        if (sku) {
            sku = sku.trim().toUpperCase();
            const duplicate = await Equipment.findOne({ sku, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, message: `Another item with SKU "${sku}" exists.` });
            }
        }

        const equipStatus = status || conditionStatus;
        const condStatus = conditionStatus || status;

        if (kitComingFrom && kitComingFrom.trim() !== '') {
            await Kit.findOneAndUpdate(
                { name: kitComingFrom.trim() },
                { name: kitComingFrom.trim() },
                { upsert: true, returnDocument: 'after' }
            ).catch(() => {});
        }

        const commentVal = comments !== undefined ? comments : (comment !== undefined ? comment : (notes !== undefined ? notes : description));

        const updateData = {
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(model !== undefined ? { model: model.trim() } : {}),
            ...(equipStatus !== undefined ? { status: equipStatus, conditionStatus: condStatus } : {}),
            ...(date !== undefined ? { date: date.trim() } : {}),
            ...(time !== undefined ? { time: time.trim() } : {}),
            ...(kitComingFrom !== undefined ? { kitComingFrom: kitComingFrom.trim(), currentLocation: kitComingFrom.trim() } : {}),
            ...(serialNumber !== undefined ? { serialNumber: serialNumber.trim() } : {}),
            ...(sku ? { sku } : {}),
            ...(currentLocation !== undefined ? { currentLocation: currentLocation.trim() } : {}),
            ...(quantity !== undefined && quantity !== '' ? { quantity: Number(quantity) } : {}),
            ...(commentVal !== undefined ? { description: commentVal.trim(), comments: commentVal.trim(), comment: commentVal.trim() } : {})
        };

        const updated = await Equipment.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Equipment updated successfully',
            product: updated,
            equipment: updated
        });
    } catch (error) {
        console.error('Error updating equipment:', error);
        return res.status(500).json({ success: false, message: 'Server error updating equipment' });
    }
};

export const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Equipment.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        return res.status(200).json({ success: true, message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting equipment' });
    }
};

export const exportEquipmentCSV = async (req, res) => {
    try {
        const equipmentList = await Equipment.find().sort({ createdAt: -1 });

        const headers = [
            'Company',
            'Equipment Name',
            'Model',
            'Equipment Model',
            'Status',
            'Condition Status',
            'Date',
            'Time',
            'Kit Coming From',
            'Serial Number',
            'SKU',
            'Last Updated'
        ];

        const escapeCSV = (field) => {
            if (field === null || field === undefined) return '""';
            const str = String(field).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = equipmentList.map((p) => [
            escapeCSV('NEP INDIA PVT LTD'),
            escapeCSV(p.name),
            escapeCSV(p.model || 'N/A'),
            escapeCSV(p.model || 'N/A'),
            escapeCSV(p.status || p.conditionStatus || 'Working Fine'),
            escapeCSV(p.conditionStatus || p.status || 'Working Fine'),
            escapeCSV(p.date || (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : 'N/A')),
            escapeCSV(p.time || (p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A')),
            escapeCSV(p.kitComingFrom || p.currentLocation || 'Main Central Depot'),
            escapeCSV(p.serialNumber || 'N/A'),
            escapeCSV(p.sku || 'N/A'),
            escapeCSV(p.updatedAt ? new Date(p.updatedAt).toLocaleString() : 'N/A')
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="NEP_INDIA_PVT_LTD_Equipment_${Date.now()}.csv"`);
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error exporting equipment CSV:', error);
        return res.status(500).json({ success: false, message: 'Server error exporting CSV' });
    }
};

// Aliases for backward compatibility
export const addProduct = addEquipment;
export const getProducts = getEquipment;
export const updateProduct = updateEquipment;
export const deleteProduct = deleteEquipment;
export const exportProductsCSV = exportEquipmentCSV;
