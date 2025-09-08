import { GoogleGenerativeAI } from "@google/generative-ai";
import Curriculum from '../models/Curriculum.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Subscription from '../models/Subscription.js';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Safely extract text from Gemini result (with debugging)
 */
const safeExtractText = (result) => {
  try {
    console.log("🔍 Gemini raw result:", JSON.stringify(result, null, 2));

    // Case 1: Direct response text access
    if (result?.response?.text) {
      return result.response.text();
    }

    // Case 2: Candidates structure (common in newer Gemini versions)
    if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return result.response.candidates[0].content.parts[0].text;
    }

    // Case 3: Direct text access
    if (typeof result?.text === "function") {
      return result.text();
    }
    if (typeof result?.text === "string") {
      return result.text;
    }

    // Case 4: Fallback to any text found in the response
    const textResponse = result?.response?.text?.() ||
                         result?.text?.() ||
                         JSON.stringify(result).match(/"text":\s*"([^"]*)"/)?.[1];
  
    if (textResponse) return textResponse;

    console.error("❌ No text found in Gemini response:", JSON.stringify(result, null, 2));
    return "I apologize, but I couldn't process that request properly. Please try again.";
  } catch (error) {
    console.error("❌ Error extracting Gemini text:", e, JSON.stringify(result, null, 2));
    return "I encountered an error while processing your request. Please try again."; 
  }
};

/**
 * Generate AI response to student questions
 */
export const generateAIResponse = async (question, subject, grade, language = 'en', user = null) => {
  try {
    console.log("✅ GEMINI API key loaded:", !!process.env.GEMINI_API_KEY);

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables");
      return {
        success: false,
        error: 'API key not configured',
        fallback: generateFallbackResponse(question, subject, grade, language)
      };
    }

    const curriculumData = await getCurriculumContext(subject, grade);
    const prompt = buildGeminiPrompt(question, curriculumData, language);

    console.log("📩 Sending prompt to Gemini:", prompt.slice(0, 200), "...");

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);

    // Get the response text directly from the result
    const response = await result.response;
    const text = response.text();
    
    console.log("📝 Gemini response text:", text);

    let structuredResponse = parseAIResponse(text, language);

    // ✅ Fallback
    if ((!structuredResponse.answer || structuredResponse.answer.trim() === "") && text) {
      structuredResponse.answer = text;
    }

    const enhancedResponse = await enhanceWithCurriculumData(
      structuredResponse, subject, grade, language
    );

    return {
      success: true,
      answer: enhancedResponse.answer,
      explanation: enhancedResponse.explanation,
      examples: enhancedResponse.examples,
      practiceQuestions: enhancedResponse.practiceQuestions,
      studyTips: enhancedResponse.studyTips,
      relatedTopics: enhancedResponse.relatedTopics,
      curriculumAlignment: enhancedResponse.curriculumAlignment,
      language: language,
      timestamp: new Date(),
      model: "gemini-pro"
    };

  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    return {
      success: false,
      error: 'Unable to generate AI response at this time',
      fallback: generateFallbackResponse(question, subject, grade, language)
    };
  }
};

/**
 * Get relevant CBC curriculum context
 */
const getCurriculumContext = async (subject, grade) => {
  try {
    const curriculum = await Curriculum.findOne({
      subject: { $regex: subject, $options: 'i' },
      grade: grade
    }).select('learningOutcomes topics strands competencies sampleQuestions');

    return curriculum || {
      subject: subject,
      grade: grade,
      learningOutcomes: [],
      topics: [],
      strands: [],
      competencies: []
    };
  } catch (error) {
    console.error('Error fetching curriculum context:', error);
    return null;
  }
};

/**
 * Build prompt for Gemini
 */
const buildGeminiPrompt = (question, curriculumData, language) => {
  const lang = language === 'sw' ? 'Kiswahili' : 'English';
  
  let prompt = `You are ElimuBuddy, an AI study assistant for the Kenyan CBC curriculum. 
  
Your role is to help students understand concepts, solve problems, and learn effectively according to the official Kenyan curriculum.

IMPORTANT RULES:
1. Always align your responses with the official Kenyan CBC curriculum
2. Provide accurate, educational content suitable for the specified grade level
3. Use age-appropriate language and examples
4. Include practical, real-world examples relevant to Kenya
5. Encourage critical thinking and problem-solving skills
6. Support both English and Kiswahili learning
7. Never provide incorrect information or make up facts

Current context: ${lang} language, ${curriculumData?.grade || 'Unknown'} grade, ${curriculumData?.subject || 'General'} subject`;

  if (curriculumData?.learningOutcomes?.length > 0) {
    prompt += `\n\nRelevant Learning Outcomes:\n${curriculumData.learningOutcomes.join('\n')}`;
  }

  prompt += `\n\nQuestion: ${question}
Subject: ${curriculumData?.subject || 'General'}
Grade: ${curriculumData?.grade || 'Unknown'}
Language: ${lang}

Please provide:
1. A clear, step-by-step answer
2. Explanation of key concepts
3. Practical examples relevant to Kenya
4. 2-3 practice questions
5. Study tips for this topic
6. Related topics to explore

Respond in ${lang}.`;

  return prompt;
};

/**
 * Parse AI response into structured format
 */
const parseAIResponse = (aiResponse, language) => {
  const sections = aiResponse.split('\n\n');
  
  let structured = {
    answer: '',
    explanation: '',
    examples: [],
    practiceQuestions: [],
    studyTips: [],
    relatedTopics: []
  };

  sections.forEach(section => {
    const lines = section.split('\n');
    const title = lines[0].toLowerCase();
    
    if (title.includes('answer') || title.includes('solution')) {
      structured.answer = lines.slice(1).join('\n');
    } else if (title.includes('explanation') || title.includes('concept')) {
      structured.explanation = lines.slice(1).join('\n');
    } else if (title.includes('example') || title.includes('examples')) {
      structured.examples = lines.slice(1).filter(line => line.trim());
    } else if (title.includes('practice') || title.includes('exercise')) {
      structured.practiceQuestions = lines.slice(1).filter(line => line.trim());
    } else if (title.includes('study tip') || title.includes('tip')) {
      structured.studyTips = lines.slice(1).filter(line => line.trim());
    } else if (title.includes('related') || title.includes('topic')) {
      structured.relatedTopics = lines.slice(1).filter(line => line.trim());
    }
  });

  return structured;
};

/**
 * Enhance AI response with curriculum data
 */
const enhanceWithCurriculumData = async (response, subject, grade, language) => {
  try {
    const curriculum = await Curriculum.findOne({
      subject: { $regex: subject, $options: 'i' },
      grade: grade
    });

    if (curriculum) {
      if (curriculum.sampleQuestions?.length > 0 && response.practiceQuestions.length < 3) {
        const additionalQuestions = curriculum.sampleQuestions
          .slice(0, 3 - response.practiceQuestions.length)
          .map(q => q.question);
        response.practiceQuestions.push(...additionalQuestions);
      }

      response.curriculumAlignment = {
        subject: curriculum.subject,
        grade: curriculum.grade,
        strands: curriculum.strands || [],
        learningAreas: curriculum.learningAreas || []
      };
    }

    return response;
  } catch (error) {
    console.error('Error enhancing with curriculum data:', error);
    return response;
  }
};

/**
 * Generate fallback response when AI fails
 */
const generateFallbackResponse = (question, subject, grade, language) => {
  return {
    answer: `I apologize, but I'm unable to provide a detailed answer at the moment. Please try asking an expert for help with your ${subject} question.`,
    explanation: `For ${grade} level ${subject} questions, I recommend consulting with a verified expert who can provide personalized assistance.`,
    examples: [],
    practiceQuestions: [],
    studyTips: [
      'Review your class notes and textbooks',
      'Ask your teacher for clarification',
      'Practice with similar problems',
      'Use ElimuBuddy expert services for detailed help'
    ],
    relatedTopics: [],
    curriculumAlignment: {
      subject: subject,
      grade: grade
    }
  };
};

/**
 * Check if user has exceeded AI question limits
 */
export const checkAIUsageLimits = async (user) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayQuestions = await Question.countDocuments({
      askedBy: user._id,
      createdAt: { $gte: today },
      aiResponse: { $exists: true }
    });

    const subscription = await Subscription.findOne({
      user: user._id,
      status: 'active'
    });

    let dailyLimit = 5; // Free plan default
    let planName = 'Free';

    if (subscription) {
      switch (subscription.plan.name) {
        case 'Premium Basic':
          dailyLimit = 50;
          planName = 'Premium Basic';
          break;
        case 'Premium Plus':
        case 'Family Plan':
          dailyLimit = -1; // Unlimited
          planName = subscription.plan.name;
          break;
      }
    }

    const remaining = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - todayQuestions);
    const canAsk = dailyLimit === -1 || remaining > 0;

    return {
      canAsk,
      remaining,
      dailyLimit,
      usedToday: todayQuestions,
      planName,
      subscriptionActive: !!subscription
    };

  } catch (error) {
    console.error('Error checking AI usage limits:', error);
    return {
      canAsk: false,
      remaining: 0,
      dailyLimit: 5,
      usedToday: 0,
      planName: 'Free',
      subscriptionActive: false,
      error: 'Unable to check usage limits'
    };
  }
};

/**
 * Generate study recommendations based on user profile
 */
export const generateStudyRecommendations = async (user, subject, grade) => {
  try {
    const curriculum = await Curriculum.findOne({
      subject: { $regex: subject, $options: 'i' },
      grade: grade
    });

    if (!curriculum) {
      return {
        success: false,
        message: 'No curriculum data available for recommendations'
      };
    }

    const prompt = `Based on the Kenyan CBC curriculum for ${grade} ${subject}, provide personalized study recommendations for a student. Include:
1. Recommended study schedule
2. Key topics to focus on
3. Practice activities
4. Resources and materials
5. Assessment preparation tips
6. Parent involvement suggestions`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendations = response.text();

    return {
      success: true,
      recommendations: recommendations,
      curriculum: {
        subject: curriculum.subject,
        grade: curriculum.grade,
        topics: curriculum.topics || []
      },
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error generating study recommendations:', error);
    return {
      success: false,
      error: 'Unable to generate recommendations at this time'
    };
  }
};

/**
 * Generate practice quiz questions
 */
export const generatePracticeQuiz = async (subject, grade, topic, count = 5, language = 'en') => {
  try {
    const curriculum = await getCurriculumContext(subject, grade);
    
    const prompt = `Generate ${count} practice questions for ${grade} ${subject} on the topic: ${topic}.
    
Requirements:
- Questions should align with Kenyan CBC curriculum
- Include multiple choice, short answer, and problem-solving questions
- Provide correct answers and explanations
- Use age-appropriate language for ${grade} level
- Include practical examples relevant to Kenya
- Language: ${language === 'sw' ? 'Kiswahili' : 'English'}

Format each question as:
Question: [question text]
Options: [if multiple choice]
Answer: [correct answer]
Explanation: [brief explanation]`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const quizContent = response.text();
    
    const questions = parseQuizQuestions(quizContent);

    return {
      success: true,
      quiz: {
        subject: subject,
        grade: grade,
        topic: topic,
        questions: questions,
        totalQuestions: questions.length,
        language: language
      },
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error generating practice quiz:', error);
    return {
      success: false,
      error: 'Unable to generate quiz at this time'
    };
  }
};

/**
 * Parse quiz questions from AI response
 */
const parseQuizQuestions = (quizContent) => {
  const questions = [];
  const sections = quizContent.split('Question:').slice(1);

  sections.forEach(section => {
    const lines = section.split('\n').filter(line => line.trim());
    
    if (lines.length >= 3) {
      const question = {
        question: lines[0].trim(),
        options: [],
        answer: '',
        explanation: ''
      };

      let currentField = '';
      lines.slice(1).forEach(line => {
        if (line.startsWith('Options:')) {
          currentField = 'options';
        } else if (line.startsWith('Answer:')) {
          currentField = 'answer';
        } else if (line.startsWith('Explanation:')) {
          currentField = 'explanation';
        } else if (line.trim()) {
          if (currentField === 'options') {
            question.options.push(line.trim());
          } else if (currentField === 'answer') {
            question.answer = line.trim();
          } else if (currentField === 'explanation') {
            question.explanation = line.trim();
          }
        }
      });

      if (question.question && question.answer) {
        questions.push(question);
      }
    }
  });

  return questions;
};

/**
 * Generate bilingual content (English + Kiswahili)
 */
export const generateBilingualContent = async (content, targetLanguage) => {
  try {
    const prompt = `Translate the following educational content to ${targetLanguage === 'sw' ? 'Kiswahili' : 'English'}:
    
Content: ${content}

Requirements:
- Maintain educational accuracy
- Use appropriate terminology for the target language
- Keep the same level of detail and explanation
- Ensure cultural relevance for Kenyan context
- Provide both original and translated versions`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text();

    return {
      success: true,
      original: content,
      translated: translation,
      targetLanguage: targetLanguage,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error generating bilingual content:', error);
    return {
      success: false,
      error: 'Unable to generate translation at this time',
      original: content
    };
  }
};

/**
 * Analyze question complexity for expert matching
 */
export const analyzeQuestionComplexity = async (question, subject, grade) => {
  try {
    const prompt = `Analyze the complexity of this ${grade} ${subject} question:
    
Question: ${question}

Provide analysis in JSON format:
{
  "complexity": "basic|intermediate|advanced",
  "estimatedTime": "minutes",
  "requiredExpertise": "beginner|intermediate|expert",
  "keyConcepts": ["concept1", "concept2"],
  "difficultyFactors": ["factor1", "factor2"],
  "recommendedApproach": "approach description"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        complexity: 'intermediate',
        estimatedTime: 15,
        requiredExpertise: 'intermediate',
        keyConcepts: [],
        difficultyFactors: [],
        recommendedApproach: 'Standard problem-solving approach'
      };
      
      return {
        success: true,
        analysis: parsed,
        timestamp: new Date()
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        success: true,
        analysis: {
          complexity: 'intermediate',
          estimatedTime: 15,
          requiredExpertise: 'intermediate',
          keyConcepts: [],
          difficultyFactors: [],
          recommendedApproach: 'Standard problem-solving approach'
        },
        timestamp: new Date(),
        note: 'AI analysis available but parsing failed'
      };
    }

  } catch (error) {
    console.error('Error analyzing question complexity:', error);
    return {
      success: false,
      error: 'Unable to analyze complexity at this time',
      analysis: {
        complexity: 'intermediate',
        estimatedTime: 15,
        requiredExpertise: 'intermediate',
        keyConcepts: [],
        difficultyFactors: [],
        recommendedApproach: 'Standard approach recommended'
      }
    };
  }
};

export default {
  generateAIResponse,
  checkAIUsageLimits,
  generateStudyRecommendations,
  generatePracticeQuiz,
  generateBilingualContent,
  analyzeQuestionComplexity
};