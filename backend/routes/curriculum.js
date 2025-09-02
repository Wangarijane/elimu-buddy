import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import {
  getCurriculum,
  getCurriculumByGrade,
  getCurriculumBySubject,
  getCurriculumByPathway,
  searchCurriculum,
  getLearningOutcomes,
  getTopics,
  getStrands,
  getCompetencies,
  getSampleQuestions,
  getResources,
  getAssessmentFramework,
  getCrossCurricularLinks,
  getValues,
  getParentalInvolvement,
  getSpecialNeeds,
  getTechnologyIntegration,
  getEnvironmentalEducation,
  getCareerGuidance,
  getProjects,
  getFieldTrips,
  getCommunityService,
  updateCurriculum,
  addCurriculum,
  deleteCurriculum,
  importCurriculum,
  exportCurriculum,
  getCurriculumStats,
  validateCurriculum,
  getSubjects,
  getSubject,
  getSubjectsByGrade,
  getTopic,
  getTopicsBySubject,
  getLearningResources,
  getLearningResource,
  getCurriculumOverview,
  getLearningPath,
  getTopicProgress,
  updateTopicProgress,
  getRecommendedResources,
  getGradeCurriculum,
  getSubjectCurriculum,
  getLearningObjectives,
  getAssessmentQuestions
} from '../controllers/curriculumController.js';

const router = express.Router();

// Public routes (for viewing curriculum)
router.get('/', getCurriculum);
router.get('/overview', getCurriculumOverview);
router.get('/grade/:grade', getCurriculumByGrade);
router.get('/subject/:subject', getCurriculumBySubject);
router.get('/pathway/:pathway', getCurriculumByPathway);
router.get('/search', searchCurriculum);

// Subjects
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubject);
router.get('/subjects/grade/:grade', getSubjectsByGrade);

// Topics
router.get('/topics', getTopics);
router.get('/topics/:id', getTopic);
router.get('/topics/subject/:subjectId', getTopicsBySubject);

// Learning resources
router.get('/learning-resources', getLearningResources);
router.get('/learning-resources/:id', getLearningResource);

// Curriculum structure
router.get('/learning-outcomes', getLearningOutcomes);
router.get('/strands', getStrands);
router.get('/competencies', getCompetencies);
router.get('/sample-questions', getSampleQuestions);
router.get('/resources', getResources);
router.get('/assessment', getAssessmentFramework);
router.get('/cross-curricular', getCrossCurricularLinks);

// CBC specific features
router.get('/values', getValues);
router.get('/parental-involvement', getParentalInvolvement);
router.get('/special-needs', getSpecialNeeds);
router.get('/technology', getTechnologyIntegration);
router.get('/environmental', getEnvironmentalEducation);
router.get('/career-guidance', getCareerGuidance);
router.get('/projects', getProjects);
router.get('/field-trips', getFieldTrips);
router.get('/community-service', getCommunityService);

// Learning paths and progress
router.get('/learning-path/:subjectId/:grade', getLearningPath);
router.get('/grade-curriculum/:grade', getGradeCurriculum);
router.get('/subject-curriculum/:subjectId', getSubjectCurriculum);
router.get('/learning-objectives/:topicId', getLearningObjectives);
router.get('/assessment-questions/:topicId', getAssessmentQuestions);
router.get('/recommended-resources', getRecommendedResources);

// Protected routes (require authentication)
router.use(protect);

// Progress tracking
router.get('/progress/:topicId', getTopicProgress);
router.put('/progress/:topicId', updateTopicProgress);

// Admin routes (for managing curriculum)
router.use(requireAdmin);

router.post('/', addCurriculum);
router.put('/:id', updateCurriculum);
router.delete('/:id', deleteCurriculum);
router.post('/import', importCurriculum);
router.post('/export', exportCurriculum);
router.get('/stats', getCurriculumStats);
router.post('/validate', validateCurriculum);

export default router;