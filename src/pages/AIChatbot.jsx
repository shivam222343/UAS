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
import { groqService } from '../services/groqService';
import { toast } from 'react-hot-toast';

/**
 * Utility function to format AI response text with bold, italic, and color.
 * Simulates markdown basic formatting: **bold**, *italic*.
 * @param {string} text 
 * @returns {JSX.Element}
 */
const formatAIResponse = (text) => {
  if (!text) return null;

  // Use a unique className for AI text to apply custom color
  const aiTextColor = 'text-green-600 dark:text-teal-400';

  // Split text by delimiters to process formatting
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);

  return (
    <p className={`whitespace-pre-wrap break-words ${aiTextColor}`}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold
          const content = part.slice(2, -2);
          return <strong key={index} className="font-extrabold text-blue-500 dark:text-sky-300">{content}</strong>;
        } else if (part.startsWith('*') && part.endsWith('*')) {
          // Italic
          const content = part.slice(1, -1);
          return <em key={index} className="italic text-purple-500 dark:text-fuchsia-300">{content}</em>;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </p>
  );
};

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
  // Default to false, rely on Tailwind for md+ visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const settingsRef = useRef(null);

  // Function to toggle dark mode and update localStorage/DOM
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  }, []);

  // Initialize dark mode from localStorage and apply to DOM
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme === 'dark' || (savedTheme === null && systemPrefersDark);
    setIsDarkMode(initialDarkMode);
    document.documentElement.classList.toggle('dark', initialDarkMode);

    // REMOVED: Initial check to set setSidebarOpen(true) on desktop.
    // We rely on Tailwind for md+ layout now.
  }, [toggleDarkMode]);

  // Click outside to close settings
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);


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
      // Close sidebar on mobile after creating new chat
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
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

      // Send to Groq Llama3
      const response = await groqService.sendMessage(userMessageContent, chatHistory.slice(-10)); // Last 10 messages for context

      setIsTyping(false);

      if (response.success) {
        // Add AI response to Firestore
        await chatService.addMessage(chatId, response.message, false);

        // Generate title for first message
        if (chatHistory.length === 1) {
          const title = await groqService.generateChatTitle(userMessageContent);
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

  // Handler for selecting a chat session
  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    // MODIFIED: Main container now uses flex-row on md+
    <div className="fixed inset-0 mt-14 flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 flex-col md:flex-row">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            // MODIFIED: Hide on md+ as sidebar is part of layout
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {/* MODIFIED: Sidebar is ALWAYS visible on md+ (hidden by default on mobile unless sidebarOpen) */}
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3 }}
            // MODIFIED: Classes for Mobile Overlay
            className="fixed mt-14 md:ml-[255px] inset-y-0 left-0 md:right z-50 w-[80vw] sm:w-[30vw]  bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl "
          >
            {/* Sidebar Content (duplicated below for permanent desktop visibility) */}
            {/* Sidebar Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
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
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 group ${currentChatId === session.id
                        ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      onClick={() => setSidebarOpen(false) || handleChatSelect(session.id)}
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

            {/* Sidebar Footer/Settings */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3 relative" ref={settingsRef}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-5 h-5" />
                  </motion.div>

                  {/* Settings Dropdown */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 z-50"
                      >
                        <div
                          className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={toggleDarkMode}
                        >
                          <span className="text-gray-800 dark:text-white text-sm">
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                          </span>
                          {isDarkMode ? (
                            <Sun className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Moon className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User: {currentUser?.email.split('@')[0] || 'Guest'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODIFIED: Permanent Sidebar for MD+ */}
      <div className="hidden md:flex flex-col flex-shrink-0 w-[255px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
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
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 group ${currentChatId === session.id
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  onClick={() => setSidebarOpen(false) || handleChatSelect(session.id)}
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

        {/* Sidebar Footer/Settings */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 relative" ref={settingsRef}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="w-5 h-5" />
              </motion.div>

              {/* Settings Dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 z-50"
                  >
                    <div
                      className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={toggleDarkMode}
                    >
                      <span className="text-gray-800 dark:text-white text-sm">
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </span>
                      {isDarkMode ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              User: {currentUser?.email.split('@')[0] || 'Guest'}
            </p>
          </div>
        </div>
      </div>


      {/* Main Chat Area - uses flex-1 to occupy remaining height */}
      <div className="flex-1 flex flex-col w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden p-0 md:p-4 md:rounded-none md:shadow-none">
        {/* Chat Header - position fixed relative to main chat area */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 sticky top-0 shadow-md">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Eta
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Powered by Groq Llama3
                </p>
              </div>
            </div>
            {/* MODIFIED: Show sidebar toggle icon ONLY on screens smaller than md */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-3 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.div>
          </div>

          <div className="flex items-center space-x-2">
            {!groqService.isConfigured() && (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm hidden sm:inline">API Key Required</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area - flex-1 and overflow-y-auto ensures it takes all available height and scrolls */}
        <div onClick={() => setSidebarOpen(false)} className="flex-1 overflow-y-auto p-4 space-y-6 md:space-y-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Eta
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Start a conversation with our AI assistant. Ask questions, get help with tasks, or just chat!
              </p>
              {!groqService.isConfigured() && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 mt-4 p-2 border border-amber-600 dark:border-amber-400 rounded-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Groq API Key not configured. AI responses will not work.</span>
                </div>
              )}
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[85%] sm:max-w-[70%]`}>
                  {!message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={`p-4 rounded-xl shadow-lg transition-all duration-300 relative group 
                    ${message.isUser
                      ? 'bg-blue-500 dark:bg-blue-700 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-white rounded-tl-none'
                    }`}
                  >
                    <div className="flex p-2 justify-between items-start">
                      <div className="pr-4">
                        {message.isUser ? (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        ) : (
                          formatAIResponse(message.content)
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <div className="flex-shrink-0 flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 pt-1 md:opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1">
                        {/* Copy Button */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyMessage(message.content)}
                          className={`p-1 rounded-full ${message.isUser ? 'hover:bg-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'} cursor-pointer transition-colors`}
                          title="Copy message"
                        >
                          {copiedMessageId === message.content ? (
                            <Check className={`w-3 h-3 ${message.isUser ? 'text-green-300' : 'text-green-500'}`} />
                          ) : (
                            <Copy className={`w-3 h-3 ${message.isUser ? 'text-blue-300 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} />
                          )}
                        </motion.div>

                        {/* Delete Button (optional - added for full functionality) */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteMessage(message.id)}
                          className={`p-1 rounded-full ${message.isUser ? 'hover:bg-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'} cursor-pointer transition-colors`}
                          title="Delete message"
                        >
                          <Trash2 className={`w-3 h-3 ${message.isUser ? 'text-red-300 hover:text-white' : 'text-red-500'}`} />
                        </motion.div>
                      </div>
                      <div className={`mt-1 text-right text-xs ${message.isUser ? 'text-blue-200 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>

                  {message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center ml-3 mt-1">
                      <img src={currentUser.photoURL} className='rounded-full' alt="" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start w-full"
              >
                <div className="flex items-start max-w-[85%] sm:max-w-[70%]">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="p-4 rounded-xl shadow-lg bg-gray-100 dark:bg-gray-700 dark:text-white rounded-tl-none flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
                    <p className="text-sm">Eta is thinking...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - fixed position at the bottom of the main chat area */}
        <div className="flex-shrink-0 mb-[125px] p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-end space-x-3 w-full max-w-4xl mx-auto">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
              disabled={isLoading}
              className="flex-1 resize-none overflow-hidden max-h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`flex-shrink-0 p-3 rounded-full transition-colors duration-200 
                ${(!inputMessage.trim() || isLoading)
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;