import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';
import { prisma } from '../config/prisma.js';

const router = Router();
router.use(authenticate);

// 1. Departments
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { users: true, channels: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, managerId } = req.body;
    const department = await prisma.department.create({
      data: {
        name,
        managerId: managerId || null,
      },
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
});

// 2. Branches
router.get('/branches', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
});

router.post('/branches', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address } = req.body;
    const branch = await prisma.branch.create({
      data: {
        name,
        address: address || null,
      },
    });
    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
});

// 3. User Assignment & RBAC Update
router.patch('/users/:userId/assignment', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, branchId, role } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        departmentId: departmentId !== undefined ? departmentId : undefined,
        branchId: branchId !== undefined ? branchId : undefined,
        role: role !== undefined ? role : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        branchId: true,
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
