import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';

const router = Router();
const attendanceController = new AttendanceController();

router.use(authenticate);

// Check in & Check out & Status
router.post('/check-in', (req, res, next) => attendanceController.checkIn(req, res, next));
router.post('/check-out', (req, res, next) => attendanceController.checkOut(req, res, next));
router.get('/today', (req, res, next) => attendanceController.getToday(req, res, next));
router.get('/my-status', (req, res, next) => attendanceController.getMyStatus(req, res, next));
router.get('/monthly', (req, res, next) => attendanceController.getMonthly(req, res, next));

// Attendance Corrections
router.post('/corrections', (req, res, next) => attendanceController.requestCorrection(req, res, next));
router.get('/corrections', (req, res, next) => attendanceController.listCorrections(req, res, next));
router.put('/corrections/:id/review', requireAdmin, (req, res, next) => attendanceController.reviewCorrection(req, res, next));

// Leaves
router.post('/leaves', (req, res, next) => attendanceController.createLeave(req, res, next));
router.get('/leaves', (req, res, next) => attendanceController.listLeaves(req, res, next));
router.put('/leaves/:id/review', requireAdmin, (req, res, next) => attendanceController.reviewLeave(req, res, next));

// Shifts (Admin)
router.get('/shifts', (req, res, next) => attendanceController.listShifts(req, res, next));
router.post('/shifts', requireAdmin, (req, res, next) => attendanceController.createShift(req, res, next));

// Holidays (Admin)
router.get('/holidays', (req, res, next) => attendanceController.listHolidays(req, res, next));
router.post('/holidays', requireAdmin, (req, res, next) => attendanceController.createHoliday(req, res, next));
router.delete('/holidays/:id', requireAdmin, (req, res, next) => attendanceController.deleteHoliday(req, res, next));

// Trigger Absence Detection Job (Admin only)
router.post('/trigger-absence-job', requireAdmin, (req, res, next) => attendanceController.triggerAbsenceJob(req, res, next));

export default router;
