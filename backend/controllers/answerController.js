import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

/**
 * Create a new answer
 */
export const createAnswer = async (req, res, next) => {
  try {
    const { questionId, content, type, language, attachments, educationalElements } = req.body;
    const expertId = req.user.id;

    // Check if question exists and is available for answering
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.status === 'resolved' || question.status === 'deleted') {
      return res.status(400).json({
        success: false,
        message: 'Question is not available for answering'
      });
    }

    // Check if expert is already assigned to this question
    if (question.expert && question.expert.toString() !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'Question is already assigned to another expert'
      });
    }

    // Create answer
    const answer = new Answer({
      question: questionId,
      expert: expertId,
      student: question.askedBy,
      content,
      type: type || 'text',
      language: language || 'en',
      attachments: attachments || [],
      educationalElements: educationalElements || {},
      status: 'pending',
      quality: {
        score: 0,
        feedback: []
      }
    });

    await answer.save();

    // Update question status and assign expert if not already assigned
    if (!question.expert) {
      question.expert = expertId;
      question.status = 'assigned';
      question.assignedAt = new Date();
      await question.save();
    }

    res.status(201).json({
      success: true,
      message: 'Answer created successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all answers (admin only)
 */
export const getAnswers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, language } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (language) query.language = language;

    const answers = await Answer.find(query)
      .populate('question', 'title subject grade')
      .populate('expert', 'profile.firstName profile.lastName')
      .populate('student', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments(query);

    res.json({
      success: true,
      data: {
        answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAnswers: total,
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
 * Get single answer
 */
export const getAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const answer = await Answer.findById(id)
      .populate('question', 'title subject grade content')
      .populate('expert', 'profile.firstName profile.lastName profile.expertise')
      .populate('student', 'profile.firstName profile.lastName profile.grade');

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    res.json({
      success: true,
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update answer
 */
export const updateAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const expertId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check ownership
    if (answer.expert.toString() !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own answers'
      });
    }

    // Only allow updates if answer is still pending or needs revision
    if (answer.status === 'approved' || answer.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved or rejected answers'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.question;
    delete updateData.expert;
    delete updateData.student;
    delete updateData.status;
    delete updateData.quality;

    // Add revision history
    if (updateData.content && updateData.content !== answer.content) {
      if (!answer.revisionHistory) {
        answer.revisionHistory = [];
      }
      answer.revisionHistory.push({
        content: answer.content,
        revisedAt: new Date(),
        reason: updateData.revisionReason || 'Content update'
      });
    }

    const updatedAnswer = await Answer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('question', 'title subject grade');

    res.json({
      success: true,
      message: 'Answer updated successfully',
      data: { answer: updatedAnswer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete answer
 */
export const deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expertId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check ownership
    if (answer.expert.toString() !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own answers'
      });
    }

    // Only allow deletion if answer is still pending
    if (answer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved or rejected answers'
      });
    }

    // Update question status if this was the only answer
    const question = await Question.findById(answer.question);
    if (question && question.expert.toString() === expertId) {
      question.expert = undefined;
      question.status = 'pending';
      question.assignedAt = undefined;
      await question.save();
    }

    await Answer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get answers by question
 */
export const getAnswersByQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({ question: questionId, status: { $ne: 'deleted' } })
      .populate('expert', 'profile.firstName profile.lastName profile.expertise')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments({ question: questionId, status: { $ne: 'deleted' } });

    res.json({
      success: true,
      data: {
        answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAnswers: total,
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
 * Get answers by expert
 */
export const getAnswersByExpert = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { expert: expertId };
    if (status) query.status = status;

    const answers = await Answer.find(query)
      .populate('question', 'title subject grade status')
      .populate('student', 'profile.firstName profile.lastName profile.grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments(query);

    res.json({
      success: true,
      data: {
        answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAnswers: total,
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
 * Get answers by user (for students)
 */
export const getAnswersByUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({ student: userId, status: { $ne: 'deleted' } })
      .populate('question', 'title subject grade')
      .populate('expert', 'profile.firstName profile.lastName profile.expertise')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments({ student: userId, status: { $ne: 'deleted' } });

    res.json({
      success: true,
      data: {
        answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAnswers: total,
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
 * Rate answer
 */
export const rateAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const studentId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user is the student who asked the question
    if (answer.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate answers to your own questions'
      });
    }

    // Check if answer is approved
    if (answer.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate approved answers'
      });
    }

    answer.rating = {
      score: rating,
      feedback,
      ratedAt: new Date()
    };

    await answer.save();

    res.json({
      success: true,
      message: 'Answer rated successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Report answer
 */
export const reportAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    answer.reports.push({
      reporter: reporterId,
      reason,
      description,
      reportedAt: new Date()
    });

    await answer.save();

    res.json({
      success: true,
      message: 'Answer reported successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark answer as best
 */
export const markAsBest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user is the student who asked the question
    if (answer.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark answers to your own questions as best'
      });
    }

    // Check if answer is approved
    if (answer.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only mark approved answers as best'
      });
    }

    // Remove best mark from other answers to the same question
    await Answer.updateMany(
      { question: answer.question, _id: { $ne: id } },
      { $unset: { isBest: 1 } }
    );

    // Mark this answer as best
    answer.isBest = true;
    answer.markedAsBestAt = new Date();
    await answer.save();

    res.json({
      success: true,
      message: 'Answer marked as best',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Request revision
 */
export const requestRevision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, details } = req.body;
    const studentId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user is the student who asked the question
    if (answer.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only request revisions for answers to your own questions'
      });
    }

    // Check if answer is approved
    if (answer.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only request revisions for approved answers'
      });
    }

    answer.revisionRequest = {
      reason,
      details,
      requestedAt: new Date(),
      status: 'pending'
    };

    answer.status = 'needs_revision';
    await answer.save();

    res.json({
      success: true,
      message: 'Revision requested successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Approve answer (admin only)
 */
export const approveAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    answer.status = 'approved';
    answer.approvedAt = new Date();
    answer.approvedBy = req.user.id;
    await answer.save();

    res.json({
      success: true,
      message: 'Answer approved successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reject answer (admin only)
 */
export const rejectAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    answer.status = 'rejected';
    answer.rejectedAt = new Date();
    answer.rejectedBy = req.user.id;
    answer.rejectionReason = reason;
    await answer.save();

    res.json({
      success: true,
      message: 'Answer rejected successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add attachment to answer
 */
export const addAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attachmentUrl, attachmentType, attachmentName } = req.body;
    const expertId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    if (answer.expert.toString() !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'You can only add attachments to your own answers'
      });
    }

    if (answer.status !== 'pending' && answer.status !== 'needs_revision') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add attachments to approved or rejected answers'
      });
    }

    answer.attachments.push({
      url: attachmentUrl,
      type: attachmentType,
      name: attachmentName,
      uploadedAt: new Date()
    });

    await answer.save();

    res.json({
      success: true,
      message: 'Attachment added successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Remove attachment from answer
 */
export const removeAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    const expertId = req.user.id;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    if (answer.expert.toString() !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove attachments from your own answers'
      });
    }

    answer.attachments = answer.attachments.filter(
      attachment => attachment._id.toString() !== attachmentId
    );

    await answer.save();

    res.json({
      success: true,
      message: 'Attachment removed successfully',
      data: { answer }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get answer statistics (for experts)
 */
export const getAnswerStats = async (req, res, next) => {
  try {
    const expertId = req.user.id;

    const [totalAnswers, approvedAnswers, pendingAnswers, rejectedAnswers, totalRating] = await Promise.all([
      Answer.countDocuments({ expert: expertId }),
      Answer.countDocuments({ expert: expertId, status: 'approved' }),
      Answer.countDocuments({ expert: expertId, status: 'pending' }),
      Answer.countDocuments({ expert: expertId, status: 'rejected' }),
      Answer.aggregate([
        { $match: { expert: expertId, 'rating.score': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$rating.score' } } }
      ])
    ]);

    const averageRating = totalRating.length > 0 ? totalRating[0].avgRating : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalAnswers,
          approvedAnswers,
          pendingAnswers,
          rejectedAnswers,
          averageRating: Math.round(averageRating * 10) / 10
        }
      }
    });

  } catch (error) {
    next(error);
  }
};
