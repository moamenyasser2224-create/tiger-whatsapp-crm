import type { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service.js';

const customerService = new CustomerService();

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.createCustomer(
        req.user!.id,
        req.body,
        { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );

      res.status(201).json({
        success: true,
        message: 'Customer added successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerService.getCustomers(req.user!.id, req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDueToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await customerService.getDueToday(req.user!.id);
      res.status(200).json({
        success: true,
        count: customers.length,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await customerService.getDashboardStats(req.user!.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getCustomerById(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await customerService.updateCustomer(
        req.params.id,
        req.user!.id,
        req.body,
        { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerService.deleteCustomer(req.params.id, req.user!.id, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvContent = await customerService.exportCustomersCsv(req.user!.id);
      const filename = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  async importCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerService.importCustomersCsv(
        req.user!.id,
        req.body.csvText,
        { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );

      res.status(200).json({
        success: true,
        message: `Successfully imported ${result.importedCount} customers (${result.skippedCount} skipped due to duplicates or invalid data)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
