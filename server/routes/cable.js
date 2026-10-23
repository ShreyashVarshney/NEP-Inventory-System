import express from 'express';
import {
    getCables,
    getCableSummary,
    addCable,
    updateCable,
    deleteCable,
    pairCables,
    unpairCable,
    exportCablesCSV
} from '../controllers/CableController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', authMiddleware, getCableSummary);
router.get('/export', authMiddleware, exportCablesCSV);
router.post('/pair', authMiddleware, pairCables);
router.put('/:id/unpair', authMiddleware, unpairCable);
router.get('/', authMiddleware, getCables);
router.post('/', authMiddleware, addCable);
router.put('/:id', authMiddleware, updateCable);
router.delete('/:id', authMiddleware, deleteCable);

export default router;
