import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
const attendanceController = new AttendanceController();

router.use(authenticate);

router.post('/check-in', (req, res, next) => attendanceController.checkIn(req, res, next));
router.post('/check-out', (req, res, next) => attendanceController.checkOut(req, res, next));
router.get('/today', (req, res, next) => attendanceController.getToday(req, res, next));
router.get('/my-status', (req, res, next) => attendanceController.getMyStatus(req, res, next));

export default router;
