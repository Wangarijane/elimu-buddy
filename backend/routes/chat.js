import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createChat,
  getUserChats,
  getChat,
  sendMessage,
  getAIResponse,
  getDirectAIResponse,
  updateChat,
  deleteChat,
  archiveChat,
  restoreChat,
  searchMessages,
  getChatStats,
  exportChat,
  getAIChatSuggestions,
  rateAIResponse,
  getChatInsights
} from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);

// Chat management
router.post('/', createChat);
router.get('/', getUserChats);
router.get('/stats', getChatStats);
router.get('/search', searchMessages);

// Individual chat operations
router.get('/:id', getChat);
router.post('/:chatId/message', sendMessage);
router.post('/:chatId/ai-response', getAIResponse);
router.put('/:id', updateChat);
router.delete('/:id', deleteChat);
router.put('/:id/archive', archiveChat);
router.put('/:id/restore', restoreChat);

// Direct AI response without chat session
router.post('/ai/direct-response', getDirectAIResponse);

// Export & insights
router.get('/:id/export', exportChat);
router.get('/:id/insights', getChatInsights);

// AI Chat helpers
router.get('/ai/suggestions', getAIChatSuggestions);
router.post('/:messageId/rate', rateAIResponse);

export default router;