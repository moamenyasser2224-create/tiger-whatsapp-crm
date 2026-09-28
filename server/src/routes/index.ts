import { Router } from 'express';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import templateRoutes from './template.routes.js';
import userRoutes from './user.routes.js';
import attendanceRoutes from './attendance.routes.js';
import chatRoutes from './chat.routes.js';
import optionRoutes from './option.routes.js';
import settingsRoutes from './settings.routes.js';
import deductionRoutes from './deduction.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/templates', templateRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/chat', chatRoutes);
router.use('/options', optionRoutes);
router.use('/settings', settingsRoutes);
router.use('/deductions', deductionRoutes);

export default router;

