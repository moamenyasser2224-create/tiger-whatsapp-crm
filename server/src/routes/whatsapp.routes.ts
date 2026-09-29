import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
const whatsAppController = new WhatsAppController();

// 1. Meta Webhook Endpoints (Public - secured via hub.verify_token and Meta signatures)
router.get('/webhook', (req, res) => whatsAppController.verifyWebhook(req, res));
router.post('/webhook', (req, res) => whatsAppController.handleWebhook(req, res));

// 2. Authenticated CRM Endpoints
router.use(authenticate);

router.get('/status', (req, res) => whatsAppController.getStatus(req, res));
router.post('/send', (req, res, next) => whatsAppController.sendMessage(req, res, next));

export default router;
