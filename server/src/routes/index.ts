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
import notificationRoutes from './notification.routes.js';
import crmRoutes from './crm.routes.js';
import departmentRoutes from './department.routes.js';
import whatsappRoutes from './whatsapp.routes.js';
import aiRoutes from './ai.routes.js';

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
router.use('/notifications', notificationRoutes);
router.use('/crm', crmRoutes);
router.use('/departments', departmentRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/ai', aiRoutes);

export default router;

