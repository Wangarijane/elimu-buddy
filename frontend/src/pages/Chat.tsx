import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, BookOpen, Lightbulb, MessageSquare, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: 'Hello! I am ElimuBuddy, your CBC learning assistant. Ask me anything about your studies!',
    sender: 'ai',
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [authError, setAuthError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const quickQuestions = [
    "What is the CBC system?",
    "Help with Grade 4 Mathematics",
    "Grade 7 Science topics",
    "How to write a good essay",
    "Brief history of Kenya"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const sendMessageToAI = async (userMessage: string) => {
    // Check authentication before making the request
    if (!isAuthenticated()) {
      setAuthError(true);
      const authErrorMessage: Message = {
        id: Date.now().toString(),
        text: "Please log in to your account to ask questions.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authErrorMessage]);
      return;
    }

    setIsTyping(true);
    setAuthError(false);
    
    try {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
      
      // Create a chat session first if it doesn't exist
      let chatId = localStorage.getItem('current_chat_id');
      if (!chatId) {
        const chatResponse = await fetch(`${import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL_LOCAL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: 'AI Chat Session',
            type: 'ai',
            subject: 'General',
            grade: 'General'
          })
        });

        if (!chatResponse.ok) {
          throw new Error('Failed to create chat session');
        }

        const chatData = await chatResponse.json();
        chatId = chatData.data.chat._id;
        localStorage.setItem('current_chat_id', chatId);
      }

      // Send message to the chat
      const response = await fetch(`${import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL_LOCAL}/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: userMessage,
          type: 'text'
        })
      });

      if (response.status === 401) {
        // Token is invalid or expired
        setAuthError(true);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('current_chat_id');
        
        const authErrorMessage: Message = {
          id: Date.now().toString(),
          text: "Your session has expired. Please log in again.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, authErrorMessage]);
        return;
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Extract AI response from the response
      const aiResponse = data.data.aiResponse?.content || "Sorry, I couldn't find a suitable answer to your question.";
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      
      // More specific error message
      let errorText = "Sorry, there was a technical error. Please try again later.";
      
      if (error instanceof Error) {
        errorText = `Sorry, there was an error: ${error.message}`;
      } else if (typeof error === 'string') {
        errorText = `Sorry, there was an error: ${error}`;
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: errorText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageToAI(inputMessage);
    setInputMessage('');
  };

  const handleQuickQuestion = (question: string) => {
    if (!isAuthenticated()) {
      setAuthError(true);
      const authErrorMessage: Message = {
        id: Date.now().toString(),
        text: "Please log in to your account to ask questions.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authErrorMessage]);
      return;
    }
    
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Chat with {" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              AI Study Buddy
            </span>
          </h1>
          <p className="text-muted-foreground">
            Ask anything about the CBC curriculum – I can help in English or Kiswahili!
          </p>
        </div>

        {authError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>You need to log in to ask questions.</span>
              <Button variant="outline" size="sm" onClick={handleLoginRedirect}>
                Login Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                    disabled={!isAuthenticated()}
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
                    <span className="text-sm text-muted-foreground">User Status</span>
                    <Badge variant={isAuthenticated() ? "success" : "destructive"}>
                      {isAuthenticated() ? "Registered" : "Not Registered"}
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
                        <p className={`text-xs mt-1 opacity-70`}>
                          {message.timestamp.toLocaleTimeString('sw-KE', { 
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
                {!isAuthenticated() ? (
                  <div className="text-center py-4">
                    <Button onClick={handleLoginRedirect} variant="kenya">
                      Log in to your account to ask questions
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your question here..."
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
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
