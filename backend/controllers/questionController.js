import Question from '../models/Question.js';
import User from '../models/User.js';
import { generateAIResponse, checkAIUsageLimits } from '../utils/ai.js';
import analyzeQuestionComplexity from '../utils/ai.js';

/**
 * Create a new question
 */
export const createQuestion = async (req, res, next) => {
  try {
    const { title, content, subject, grade, topic, complexity, language, budget, deadline } = req.body;
    const studentId = req.user.id;

    // Check if student has exceeded AI question limits
    const usageCheck = await checkAIUsageLimits(req.user);
    if (!usageCheck.canAsk) {
      return res.status(403).json({
        success: false,
        message: `Daily AI question limit reached. You have used ${usageCheck.usedToday}/${usageCheck.dailyLimit} questions today.`,
        data: usageCheck
      });
    }

    // Analyze question complexity if not provided
    let questionComplexity = complexity;
    if (!complexity) {
      const complexityAnalysis = await analyzeQuestionComplexity(content, subject, grade);
      if (complexityAnalysis.success) {
        questionComplexity = complexityAnalysis.analysis.complexity;
      }
    }

    // Create question
    const question = new Question({
      title,
      content,
      subject,
      grade,
      topic,
      complexity: questionComplexity,
      language: language || 'en',
      budget: budget || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      askedBy: studentId,
      status: 'pending'
    });

    await question.save();

    // Generate AI response if within limits
    let aiResponse = null;
    if (usageCheck.remaining > 0 || usageCheck.dailyLimit === -1) {
      try {
        aiResponse = await generateAIResponse(content, subject, grade, language, req.user);
        if (aiResponse.success) {
          question.aiResponse = aiResponse;
          question.status = 'ai_answered';
        }
      } catch (aiError) {
        console.error('AI response generation failed:', aiError);
        // Continue without AI response
      }
    }

    // Increment AI usage
    await req.user.incrementAIUsage();

    await question.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        question,
        aiResponse: aiResponse?.success ? aiResponse : null,
        usage: {
          remaining: usageCheck.remaining > 0 ? usageCheck.remaining - 1 : usageCheck.remaining,
          usedToday: usageCheck.usedToday + 1,
          dailyLimit: usageCheck.dailyLimit
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all questions (public)
 */
export const getQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, subject, grade, status, complexity, language } = req.query;

    const query = { status: { $ne: 'deleted' } };
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (status) query.status = status;
    if (complexity) query.complexity = complexity;
    if (language) query.language = language;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName')
      .populate('expert', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Get single question
 */
export const getQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .populate('askedBy', 'profile.firstName profile.lastName profile.grade profile.school')
      .populate('expert', 'profile.firstName profile.lastName profile.expertise')
      .populate('answers');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: { question }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update question
 */
export const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const studentId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership
    if (question.askedBy.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own questions'
      });
    }

    // Only allow updates if question is still pending
    if (question.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update question that has been answered or assigned'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.askedBy;
    delete updateData.status;
    delete updateData.expert;
    delete updateData.aiResponse;

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('askedBy', 'profile.firstName profile.lastName');

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question: updatedQuestion }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete question
 */
export const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership
    if (question.askedBy.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own questions'
      });
    }

    // Only allow deletion if question is still pending
    if (question.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question that has been answered or assigned'
      });
    }

    // Soft delete
    question.status = 'deleted';
    question.deletedAt = new Date();
    await question.save();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get questions by subject
 */
export const getQuestionsBySubject = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const { page = 1, limit = 20, grade, status } = req.query;

    const query = { 
      subject: { $regex: subject, $options: 'i' },
      status: { $ne: 'deleted' }
    };
    if (grade) query.grade = grade;
    if (status) query.status = status;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        subject,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Get questions by grade
 */
export const getQuestionsByGrade = async (req, res, next) => {
  try {
    const { grade } = req.params;
    const { page = 1, limit = 20, subject, status } = req.query;

    const query = { 
      grade,
      status: { $ne: 'deleted' }
    };
    if (subject) query.subject = subject;
    if (status) query.status = status;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        grade,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Search questions
 */
export const searchQuestions = async (req, res, next) => {
  try {
    const { q, subject, grade, complexity, language, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      $and: [
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { topic: { $regex: q, $options: 'i' } }
          ]
        },
        { status: { $ne: 'deleted' } }
      ]
    };

    if (subject) query.$and.push({ subject: { $regex: subject, $options: 'i' } });
    if (grade) query.$and.push({ grade });
    if (complexity) query.$and.push({ complexity });
    if (language) query.$and.push({ language });

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        searchQuery: q,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Assign question to expert
 */
export const assignToExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expertId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.status !== 'pending' && question.status !== 'ai_answered') {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be assigned to expert'
      });
    }

    question.expert = expertId;
    question.status = 'assigned';
    question.assignedAt = new Date();
    await question.save();

    res.json({
      success: true,
      message: 'Question assigned to expert successfully',
      data: { question }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark question as resolved
 */
export const markAsResolved = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.askedBy.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own questions as resolved'
      });
    }

    question.status = 'resolved';
    question.resolvedAt = new Date();
    await question.save();

    res.json({
      success: true,
      message: 'Question marked as resolved',
      data: { question }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get unanswered questions (for experts)
 */
export const getUnansweredQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, subject, grade, complexity } = req.query;
    const expertId = req.user.id;

    const query = {
      status: { $in: ['pending', 'ai_answered'] },
      expert: { $exists: false }
    };

    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (complexity) query.complexity = complexity;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName profile.grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Get questions by user
 */
export const getQuestionsByUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { askedBy: userId, status: { $ne: 'deleted' } };
    if (status) query.status = status;

    const questions = await Question.find(query)
      .populate('expert', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Get questions assigned to expert
 */
export const getQuestionsByExpert = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { expert: expertId, status: { $ne: 'deleted' } };
    if (status) query.status = status;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName profile.grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Add attachment to question
 */
export const addAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attachmentUrl, attachmentType, attachmentName } = req.body;
    const studentId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.askedBy.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only add attachments to your own questions'
      });
    }

    if (question.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add attachments to answered questions'
      });
    }

    question.attachments.push({
      url: attachmentUrl,
      type: attachmentType,
      name: attachmentName,
      uploadedAt: new Date()
    });

    await question.save();

    res.json({
      success: true,
      message: 'Attachment added successfully',
      data: { question }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Remove attachment from question
 */
export const removeAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    const studentId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.askedBy.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove attachments from your own questions'
      });
    }

    question.attachments = question.attachments.filter(
      attachment => attachment._id.toString() !== attachmentId
    );

    await question.save();

    res.json({
      success: true,
      message: 'Attachment removed successfully',
      data: { question }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Rate question
 */
export const rateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const studentId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.askedBy.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own questions'
      });
    }

    question.rating = {
      score: rating,
      feedback,
      ratedAt: new Date()
    };

    await question.save();

    res.json({
      success: true,
      message: 'Question rated successfully',
      data: { question }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Report question
 */
export const reportQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question.reports.push({
      reporter: reporterId,
      reason,
      description,
      reportedAt: new Date()
    });

    await question.save();

    res.json({
      success: true,
      message: 'Question reported successfully'
    });

  } catch (error) {
    next(error);
  }
};
