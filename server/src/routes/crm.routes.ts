import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { crmService } from '../services/crm.service.js';
import { prisma } from '../config/prisma.js';

const router = Router();
router.use(authenticate);

// 1. Customer Activities (Timeline)
router.get('/customers/:id/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await crmService.getActivities(req.params.id);
    res.json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
});

router.post('/customers/:id/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, content, metadata } = req.body;
    const activity = await crmService.createActivity({
      customerId: req.params.id,
      userId: req.user!.id,
      type: type || 'note',
      content,
      metadata,
    });
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

// 2. Customer Tasks
router.get('/customers/:id/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await crmService.getTasks(req.params.id);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

router.post('/customers/:id/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, dueAt, assigneeId } = req.body;
    const task = await crmService.createTask({
      customerId: req.params.id,
      assigneeId: assigneeId || req.user!.id,
      title,
      dueAt: new Date(dueAt),
    });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

router.patch('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { done } = req.body;
    const task = await crmService.updateTask(req.params.taskId, Boolean(done));
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// 3. Pipeline Metrics
router.get('/pipeline', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await crmService.getPipeline();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

// 4. Commission Rules
router.get('/commissions/rules', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await prisma.commissionRule.findMany({
      orderBy: { percent: 'desc' },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

router.post('/commissions/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, percent, clawbackDays } = req.body;
    const rule = await prisma.commissionRule.upsert({
      where: { role },
      update: {
        percent: parseFloat(percent),
        clawbackDays: clawbackDays ? parseInt(clawbackDays) : 30,
        isActive: true,
      },
      create: {
        role,
        percent: parseFloat(percent),
        clawbackDays: clawbackDays ? parseInt(clawbackDays) : 30,
        isActive: true,
      },
    });
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

export default router;
