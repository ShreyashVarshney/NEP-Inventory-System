import express from 'express';
import {
    addEquipment,
    getEquipment,
    getDistinctKits,
    addKit,
    deleteKit,
    updateEquipment,
    deleteEquipment,
    exportEquipmentCSV
} from '../controllers/EquipmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/export', authMiddleware, exportEquipmentCSV);
router.get('/kits', authMiddleware, getDistinctKits);
router.post('/kits', authMiddleware, addKit);
router.delete('/kits/:kitName', authMiddleware, deleteKit);
router.post('/add', authMiddleware, addEquipment);
router.post('/', authMiddleware, addEquipment);
router.get('/', authMiddleware, getEquipment);
router.put('/:id', authMiddleware, updateEquipment);
router.delete('/:id', authMiddleware, deleteEquipment);

export default router;
