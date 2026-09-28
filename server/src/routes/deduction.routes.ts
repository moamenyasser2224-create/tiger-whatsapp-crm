import { Router } from 'express';
import { DeductionController } from '../controllers/deduction.controller.js';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';

const router = Router();
const controller = new DeductionController();

router.use(authenticate);

// Employee routes
router.get('/my', (req, res, next) => controller.getMyDeductions(req, res, next));
router.get('/salary', (req, res, next) => controller.getMySalary(req, res, next));
router.get('/my-adjustments', (req, res, next) => controller.getMyAdjustments(req, res, next));
router.get('/period-status', (req, res, next) => controller.getPeriodStatus(req, res, next));
router.post('/:id/dispute', (req, res, next) => controller.createDispute(req, res, next));

// Admin routes
router.get('/admin/payroll-summary', requireAdmin, (req, res, next) => controller.getPayrollSummary(req, res, next));
router.get('/admin/all', requireAdmin, (req, res, next) => controller.getAllDeductions(req, res, next));
router.post('/admin/approve', requireAdmin, (req, res, next) => controller.approveDeductions(req, res, next));
router.post('/admin/batch-approve', requireAdmin, (req, res, next) => controller.approveDeductions(req, res, next));
router.post('/admin/dispute/:id/review', requireAdmin, (req, res, next) => controller.reviewDispute(req, res, next));
router.post('/:id/review-dispute', requireAdmin, (req, res, next) => controller.reviewDispute(req, res, next));
router.post('/admin/adjustment', requireAdmin, (req, res, next) => controller.createAdjustment(req, res, next));
router.post('/admin/close-month', requireAdmin, (req, res, next) => controller.closePayrollPeriod(req, res, next));
router.post('/admin/close-period', requireAdmin, (req, res, next) => controller.closePayrollPeriod(req, res, next));

// Deduction Rules CRUD (Admin)
router.get('/admin/rules', requireAdmin, (req, res, next) => controller.listRules(req, res, next));
router.post('/admin/rules', requireAdmin, (req, res, next) => controller.createRule(req, res, next));
router.put('/admin/rules/:id', requireAdmin, (req, res, next) => controller.updateRule(req, res, next));
router.delete('/admin/rules/:id', requireAdmin, (req, res, next) => controller.deleteRule(req, res, next));

export default router;
