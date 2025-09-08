import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import generateAIResponse from '../utils/ai.js';
import rateLimit from '../middleware/rateLimit.js';

/**
 * Create new chat
 */
export const createChat = async (req, res, next) => {
  try {
    const { title, subject, grade, type = 'ai' } = req.body;
    const userId = req.user.id;

    // Check user's subscription for AI chat limits
    if (type === 'ai') {
      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] }
      });

      if (!subscription) {
        // Free plan limits
        const dailyChats = await Chat.countDocuments({
          userId,
          type: 'ai',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (dailyChats >= 5) {
          return res.status(429).json({
            success: false,
            message: 'Daily AI chat limit reached. Upgrade your plan for unlimited access.'
          });
        }
      } else {
        // Check subscription limits
        const plan = subscription.plan;
        if (plan.limits.dailyAIQuestions !== -1) {
          const dailyChats = await Chat.countDocuments({
            userId,
            type: 'ai',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });

          if (dailyChats >= plan.limits.dailyAIQuestions) {
            return res.status(429).json({
              success: false,
              message: 'Daily AI chat limit reached for your current plan.'
            });
          }
        }
      }
    }

    const chat = new Chat({
      userId,
      title: title || 'New Chat',
      subject,
      grade,
      type,
      status: 'active'
    });

    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: { chat }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user chats
 */
export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, status } = req.query;

    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const chats = await Chat.find(query)
      .populate('lastMessage', 'content createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const total = await Chat.countDocuments(query);

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalChats: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single chat with messages
 */
export const getChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({ chat: id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments({ chat: id });

    res.json({
      success: true,
      data: {
        chat,
        messages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Send message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if chat is active
    if (chat.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Chat is not active'
      });
    }

    // Create user message
    const userMessage = new Message({
      chatId,
      userId,
      content,
      messageType: type,
      role: 'user'
    });

    await userMessage.save();

    // Update chat with last message
    chat.lastMessage = userMessage._id;
    chat.updatedAt = new Date();
    await chat.save();

    let aiResponse = null;

    // Generate AI response if it's an AI chat
    if (chat.type === 'ai') {
      try {
        // Generate AI response using the AI utility
        const aiResult = await generateAIResponse(content, chat.subject, chat.grade);
        
        if (aiResult.success) {
          const aiAnswer = aiResult.answer || 
            "I've processed your question, but couldn't generate a detailed response.";
          
          const aiMessage = new Message({
            chatId,
            userId: req.user.id, // or null/system ID if you prefer
            content: aiAnswer,
            messageType: 'text',
            role: 'assistant'
          });

          await aiMessage.save();

          // Update chat with AI message
          chat.lastMessage = aiMessage._id;
          chat.updatedAt = new Date();
          await chat.save();

          aiResponse = {
            content: aiAnswer,
            messageId: aiMessage._id
          };
        } else {
          // Handle AI generation failure
          console.error('AI response generation failed:', aiResult.error);
        }
      } catch (aiError) {
        console.error('AI response generation failed:', aiError);
        // Continue without AI response
      }
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        userMessage,
        aiResponse
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get AI response
 */
export const getAIResponse = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if it's an AI chat
    if (chat.type !== 'ai') {
      return res.status(400).json({
        success: false,
        message: 'This is not an AI chat'
      });
    }

    // Check rate limits
    const rateLimitKey = `ai_chat:${userId}`;
    const isRateLimited = await rateLimit(rateLimitKey, 10, 60); // 10 requests per minute

    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    // Check subscription limits
    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!subscription) {
      // Free plan limits
      const dailyAIRequests = await Message.countDocuments({
        chat: { $in: await Chat.find({ userId, type: 'ai' }).distinct('_id') },
        role: 'user',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (dailyAIRequests >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Daily AI request limit reached. Upgrade your plan for unlimited access.'
        });
      }
    } else {
      // Check subscription limits
      const plan = subscription.plan;
      if (plan.limits.dailyAIQuestions !== -1) {
        const dailyAIRequests = await Message.countDocuments({
          chat: { $in: await Chat.find({ userId, type: 'ai' }).distinct('_id') },
          role: 'user',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (dailyAIRequests >= plan.limits.dailyAIQuestions) {
          return res.status(429).json({
            success: false,
            message: 'Daily AI request limit reached for your current plan.'
          });
        }
      }
    }

    // Generate AI response
    const aiResult = await generateAIResponse(message, chat.subject, chat.grade);
    const aiResponse = aiResult.answer || aiResult.response || 
                      "Sorry, I couldn't find an answer that matches your question.";

    // Create AI message
    const aiMessage = new Message({
      chat: chatId,
      sender: 'ai',
      content: aiResponse,
      type: 'text',
      role: 'assistant'
    });

    await aiMessage.save();

    // Update chat
    chat.lastMessage = aiMessage._id;
    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      data: {
        response: aiResponse,
        messageId: aiMessage._id
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Direct AI response without chat session
 */
export const getDirectAIResponse = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Check rate limits
    const rateLimitKey = `ai_chat:${userId}`;
    const isRateLimited = await rateLimit(rateLimitKey, 10, 60); // 10 requests per minute

    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    // Check subscription limits
    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!subscription) {
      // Free plan limits
      const dailyAIRequests = await Message.countDocuments({
        chat: { $in: await Chat.find({ userId, type: 'ai' }).distinct('_id') },
        role: 'user',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (dailyAIRequests >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Daily AI request limit reached. Upgrade your plan for unlimited access.'
        });
      }
    } else {
      // Check subscription limits
      const plan = subscription.plan;
      if (plan.limits.dailyAIQuestions !== -1) {
        const dailyAIRequests = await Message.countDocuments({
          chat: { $in: await Chat.find({ userId, type: 'ai' }).distinct('_id') },
          role: 'user',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (dailyAIRequests >= plan.limits.dailyAIQuestions) {
          return res.status(429).json({
            success: false,
            message: 'Daily AI request limit reached for your current plan.'
          });
        }
      }
    }

    // Generate AI response
    const aiResult = await generateAIResponse(message, 'General', 'General');
    const aiResponse = aiResult.answer || aiResult.response || 
                      "Sorry, I couldn't find an answer that matches your question.";

    res.json({
      success: true,
      data: {
        response: aiResponse,
        messageId: Date.now().toString()
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update chat
 */
export const updateChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.user;
    delete updateData.type;
    delete updateData.createdAt;

    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Chat updated successfully',
      data: { chat: updatedChat }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete chat
 */
export const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: id });

    // Delete the chat
    await Chat.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Archive chat
 */
export const archiveChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    chat.status = 'archived';
    chat.archivedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: 'Chat archived successfully',
      data: { chat }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Restore archived chat
 */
export const restoreChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    chat.status = 'active';
    chat.archivedAt = undefined;
    await chat.save();

    res.json({
      success: true,
      message: 'Chat restored successfully',
      data: { chat }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Search chat messages
 */
export const searchMessages = async (req, res, next) => {
  try {
    const { q, chatId, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      content: { $regex: q, $options: 'i' },
      sender: userId
    };

    if (chatId) {
      query.chat = chatId;
    }

    const messages = await Message.find(query)
      .populate('chat', 'title subject grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get chat statistics
 */
export const getChatStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalChats, totalMessages, aiChats, groupChats, archivedChats] = await Promise.all([
      Chat.countDocuments({ userIdId }),
      Message.countDocuments({ sender: userId }),
      Chat.countDocuments({ userIdId, type: 'ai' }),
      Chat.countDocuments({ userIdId, type: 'group' }),
      Chat.countDocuments({ userIdId, status: 'archived' })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalChats,
          totalMessages,
          aiChats,
          groupChats,
          archivedChats,
          activeChats: totalChats - archivedChats
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Export chat
 */
export const exportChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ chat: id })
      .populate('sender', 'profile.firstName profile.lastName')
      .sort({ createdAt: 1 });

    if (format === 'txt') {
      let exportContent = `Chat: ${chat.title}\n`;
      exportContent += `Subject: ${chat.subject || 'N/A'}\n`;
      exportContent += `Grade: ${chat.grade || 'N/A'}\n`;
      exportContent += `Created: ${chat.createdAt.toISOString()}\n\n`;
      exportContent += 'Messages:\n';
      exportContent += '='.repeat(50) + '\n\n';

      messages.forEach((message, index) => {
        const sender = message.sender === 'ai' ? 'AI Assistant' : 
          `${message.sender.profile.firstName} ${message.sender.profile.lastName}`;
        exportContent += `${index + 1}. ${sender} (${message.createdAt.toISOString()})\n`;
        exportContent += `${message.content}\n\n`;
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat_${id}.txt"`);
      res.send(exportContent);
    } else {
      // JSON format
      const exportData = {
        chat: {
          id: chat._id,
          title: chat.title,
          subject: chat.subject,
          grade: chat.grade,
          type: chat.type,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        },
        messages: messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          type: msg.type,
          role: msg.role,
          sender: msg.sender === 'ai' ? 'AI Assistant' : 
            `${msg.sender.profile.firstName} ${msg.sender.profile.lastName}`,
          createdAt: msg.createdAt
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="chat_${id}.json"`);
      res.json(exportData);
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Get AI chat suggestions
 */
export const getAIChatSuggestions = async (req, res, next) => {
  try {
    const { subject, grade } = req.query;

    const suggestions = [
      {
        title: 'Explain a concept',
        prompt: `Can you explain ${subject || 'this topic'} in simple terms for a ${grade || 'student'}?`,
        category: 'learning'
      },
      {
        title: 'Practice problems',
        prompt: `Can you give me some practice problems on ${subject || 'this topic'} for ${grade || 'my grade'}?`,
        category: 'practice'
      },
      {
        title: 'Study tips',
        prompt: `What are the best study strategies for ${subject || 'this subject'}?`,
        category: 'study'
      },
      {
        title: 'Real-world examples',
        prompt: `Can you give me real-world examples of ${subject || 'this concept'}?`,
        category: 'examples'
      },
      {
        title: 'Common mistakes',
        prompt: `What are common mistakes students make when learning ${subject || 'this topic'}?`,
        category: 'mistakes'
      }
    ];

    res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Rate AI response
 */
export const rateAIResponse = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if message is from AI
    if (message.role !== 'assistant') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate AI responses'
      });
    }

    // Check if user owns the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update message with rating
    message.rating = {
      score: rating,
      feedback,
      ratedBy: userId,
      ratedAt: new Date()
    };

    await message.save();

    res.json({
      success: true,
      message: 'Response rated successfully',
      data: { message }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get chat insights
 */
export const getChatInsights = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ chat: id });

    const insights = {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      aiMessages: messages.filter(m => m.role === 'assistant').length,
      averageMessageLength: messages.length > 0 ? 
        Math.round(messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length) : 0,
      chatDuration: messages.length > 1 ? 
        Math.round((messages[messages.length - 1].createdAt - messages[0].createdAt) / (1000 * 60)) : 0, // in minutes
      topics: extractTopics(messages),
      learningProgress: calculateLearningProgress(messages)
    };

    res.json({
      success: true,
      data: { insights }
    });

  } catch (error) {
    next(error);
  }
};

// Helper functions
function extractTopics(messages) {
  // Simple topic extraction based on message content
  const topics = new Set();
  messages.forEach(message => {
    if (message.content.includes('math') || message.content.includes('mathematics')) topics.add('Mathematics');
    if (message.content.includes('science')) topics.add('Science');
    if (message.content.includes('english')) topics.add('English');
    if (message.content.includes('history')) topics.add('History');
    if (message.content.includes('geography')) topics.add('Geography');
  });
  return Array.from(topics);
}

function calculateLearningProgress(messages) {
  // Simple learning progress calculation
  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'assistant');
  
  if (userMessages.length === 0) return 0;
  
  // Calculate based on message complexity and interaction depth
  const complexity = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
  const interactionDepth = aiMessages.length / userMessages.length;
  
  return Math.min(100, Math.round((complexity / 100 + interactionDepth) * 50));
}



