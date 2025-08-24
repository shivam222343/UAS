import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Search,
  Bot,
  User,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Settings,
  Moon,
  Sun,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChatService } from '../services/chatService';
import { geminiService } from '../services/geminiService';
import { toast } from 'react-hot-toast';

const AIChatbot = () => {
  const { currentUser } = useAuth();
  const [chatService] = useState(() => new ChatService(currentUser?.uid));
  
  // Chat state
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  // Load chat sessions on mount
  useEffect(() => {
    if (currentUser) {
      loadChatSessions();
    }
  }, [currentUser]);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    try {
      const sessions = await chatService.getChatSessions();
      setChatSessions(sessions);
      
      if (sessions.length > 0 && !currentChatId) {
        setCurrentChatId(sessions[0].id);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat sessions');
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const chatMessages = await chatService.getMessages(chatId);
      // Sort messages by timestamp to ensure correct order
      const sortedMessages = chatMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createNewChat = async () => {
    try {
      const chatId = await chatService.createChatSession();
      await loadChatSessions();
      setCurrentChatId(chatId);
      setMessages([]);
      toast.success('New chat created');
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to state immediately for faster UI update
    const tempUserMessage = {
      id: Date.now().toString(),
      content: userMessageContent,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prevMessages => [...prevMessages, tempUserMessage]);
    
    setIsLoading(true);
    setIsTyping(true);

    try {
      let chatId = currentChatId;
      
      // Create new chat if none exists
      if (!chatId) {
        chatId = await chatService.createChatSession();
        setCurrentChatId(chatId);
        await loadChatSessions();
      }

      // Add user message to Firestore
      await chatService.addMessage(chatId, userMessageContent, true);
      
      // Get chat history for context
      const chatHistory = await chatService.getMessages(chatId);
      
      // Send to Gemini
      const response = await geminiService.sendMessage(userMessageContent, chatHistory.slice(-10)); // Last 10 messages for context
      
      setIsTyping(false);
      
      if (response.success) {
        // Add AI response to Firestore
        await chatService.addMessage(chatId, response.message, false);
        
        // Generate title for first message
        if (chatHistory.length === 1) {
          const title = await geminiService.generateChatTitle(userMessageContent);
          await chatService.updateChatTitle(chatId, title);
          await loadChatSessions();
        }
      } else {
        // Add error message to Firestore
        await chatService.addMessage(chatId, response.message, false);
        toast.error('AI response error');
      }
      
      // Reload messages to sync with Firestore
      await loadMessages(chatId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await chatService.deleteChatSession(chatId);
      await loadChatSessions();
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      if (!currentChatId) {
        toast.error('No chat session to delete from.');
        return;
      }
      await chatService.deleteMessage(currentChatId, messageId);
      await loadMessages(currentChatId);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const updateChatTitle = async (chatId, newTitle) => {
    try {
      await chatService.updateChatTitle(chatId, newTitle);
      await loadChatSessions();
      setEditingChatId(null);
      toast.success('Chat title updated');
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast.error('Failed to update title');
    }
  };

  const copyMessage = (content) => {
    const tempElement = document.createElement('textarea');
    tempElement.value = content;
    document.body.appendChild(tempElement);
    tempElement.select();
    try {
      document.execCommand('copy');
      setCopiedMessageId(content);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success('Message copied');
    } catch (error) {
      toast.error('Failed to copy message');
    } finally {
      document.body.removeChild(tempElement);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredSessions = chatSessions.filter(session =>
    session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-[72vh] py-4 px-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-[70vw] md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <Bot className="w-6 h-6 mr-2 text-blue-600" />
                  Eta
                </h2>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createNewChat}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </motion.div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Chat Sessions */}
            <div className="flex-1 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No chats yet</p>
                  <p className="text-sm">Start a new conversation!</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                        currentChatId === session.id
                          ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setCurrentChatId(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {editingChatId === session.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => updateChatTitle(session.id, editingTitle)}
                              onKeyPress={(e) => e.key === 'Enter' && updateChatTitle(session.id, editingTitle)}
                              className="w-full bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {session.title || 'New Chat'}
                            </h3>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {session.lastMessage || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDate(session.updatedAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(session.id);
                              setEditingTitle(session.title || 'New Chat');
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(session.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 lg:ml-10 flex flex-col w-full md:w-auto overflow-hidden rounded-lg">
        {/* Chat Header */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-3 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Eta
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Powered by Gemini AI
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!geminiService.isConfigured() && (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">API Key Required</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Eta
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Start a conversation with our AI assistant. Ask questions, get help with tasks, or just chat!
              </p>
              {!geminiService.isConfigured() && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Please configure your Gemini API key in the environment variables to start chatting.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${message.isUser ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.isUser 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-br from-purple-500 to-pink-600'
                      }`}>
                        {message.isUser ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={`group ${message.isUser ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-3 rounded-2xl ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      
                      <div className={`flex items-center mt-1 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                        message.isUser ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyMessage(message.content)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        >
                          {copiedMessageId === message.content ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteMessage(message.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={geminiService.isConfigured() ? "Type your message..." : "Configure API key to start chatting..."}
                disabled={!geminiService.isConfigured() || isLoading}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[48px] max-h-32"
                rows="1"
              />
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                inputMessage.trim() && !isLoading && geminiService.isConfigured()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.div>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            AI responses may contain inaccuracies. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
