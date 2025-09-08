import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Lightbulb, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import axios from "axios";

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I am ElimuBuddy, your assistant for learning CBC. Ask me any question about your studies!',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "What is the CBC system?",
    "Help me with Grade 4 Mathematics",
    "Grade 7 Science lessons",
    "How to write a good composition",
    "Brief history of Kenya"
  ];

  // Check authentication status on component mount
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Setup axios interceptor for automatic 401 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear invalid tokens
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setIsAuthenticated(false);
          
          // Add message about needing to login
          const loginMessage = {
            id: Date.now().toString(),
            text: 'Your session has expired. Please log in to continue chatting.',
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, loginMessage]);
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real API call function
  const sendMessageToAI = async (userMessage) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      return 'Please log in to chat with ElimuBuddy AI. You need an account to access the AI features.';
    }

    try {
      // Step 1: Create or get a chat
      let chatId = localStorage.getItem('currentChatId');
      
      if (!chatId) {
        console.log('Creating new chat...');
        const chatResponse = await axios.post(
          'http://localhost:5000/api/chat',
          { 
            title: 'AI Study Session',
            type: 'ai'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        chatId = chatResponse.data.data.chat._id;
        localStorage.setItem('currentChatId', chatId);
        console.log('Created chat with ID:', chatId);
      }

      // Step 2: Send message to the chat
      console.log('Sending message to chat:', chatId);
      const messageResponse = await axios.post(
        `http://localhost:5000/api/chat/${chatId}/message`,
        { 
          content: userMessage,
          type: 'text'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Message Response:', messageResponse.data);
      
      // Extract AI response from the response
      const aiResponse = messageResponse.data.data.aiResponse;
      if (aiResponse && aiResponse.content) {
        return aiResponse.content;
      } else {
        return 'I received your message but had trouble generating a response. Please try again.';
      }
      
    } catch (error) {
      console.error('Error calling AI API:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        return 'Your session has expired. Please log in again to continue chatting.';
      }
      
      if (error.response?.status === 400) {
        console.error('Bad Request - API expects different format. Check backend logs.');
        return `API Error: ${error.response?.data?.error?.message || 'Bad request format'}. Please check the console for details.`;
      }
      
      // Fallback to simulated response for demo purposes
      const fallbackResponses = [
        `Great question! Regarding "${userMessage}" - The CBC (Competency Based Curriculum) is an education system that focuses on building learners' skills and abilities instead of rote memorization. It is divided into different age levels...`,
        `I understand you're asking about "${userMessage}". This is an important part of CBC studies. I can help in several ways: 1) Explaining key concepts, 2) Giving practical examples, 3) Showing how it applies in daily life...`,
        `Well done for asking this! "${userMessage}" is a very interesting topic within the CBC system. Here's an overview for you...`,
        `Thanks for your question on "${userMessage}". In the CBC system, learning is activity-based and practical. Let me give you detailed insights...`
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const handleAIResponse = async (userMessage) => {
    setIsTyping(true);

    try {
      const aiResponse = await sendMessageToAI(userMessage);

      setTimeout(() => {
        const newMessage = {
          id: Date.now().toString(),
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setIsTyping(false);
      }, 1500); // Keep the typing delay for better UX
      
    } catch (error) {
      console.error('Error in AI response:', error);
      
      const errorMessage = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again or log in if you haven\'t already.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    handleAIResponse(inputMessage);
    setInputMessage('');
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick login helper for development
  const handleQuickLogin = () => {
    // This would redirect to your login page
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Chat with{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              AI Study Buddy
            </span>
          </h1>
          <p className="text-muted-foreground">
            Ask any question about the CBC curriculum – I can assist you in English!
          </p>
          {!isAuthenticated && (
            <div className="mt-4">
              <Badge variant="outline" className="mr-2">Not logged in</Badge>
              <Button variant="link" onClick={handleQuickLogin} className="text-sm">
                Log in for full AI features
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Questions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-education" />
                  Quick Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left justify-start h-auto p-3 text-sm"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  <MessageSquare className="h-5 w-5 text-primary inline mr-2" />
                  Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Questions Today</span>
                    <Badge variant="secondary">3/5</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge variant="outline">Free</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={isAuthenticated ? "success" : "secondary"}>
                      {isAuthenticated ? "Logged in" : "Guest"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  ElimuBuddy AI
                  <Badge variant="success" className="ml-auto">Online</Badge>
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-education text-education-foreground'
                      }`}>
                        {message.sender === 'user' ? 
                          <User className="h-4 w-4" /> : 
                          <Bot className="h-4 w-4" />
                        }
                      </div>
                      
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString('en-KE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-education text-education-foreground flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isAuthenticated ? "Type your question here..." : "Log in to chat with AI..."}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    variant="kenya"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
