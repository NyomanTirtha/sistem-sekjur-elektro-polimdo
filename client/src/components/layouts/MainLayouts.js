import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import ReactMarkdown from 'react-markdown';

const MainLayout = ({
  children,
  title = "Dashboard",
  activeMenu = 'dashboard',
  onMenuChange,
  menuItems = [], // Accept filtered menu items
  currentUser,
  userType,
  onLogout,
  authToken
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef(null);

  // ✨ LOAD CHAT HISTORY FROM LOCALSTORAGE
  useEffect(() => {
    const savedChats = localStorage.getItem(`chat_history_${userType}_${currentUser?.id || currentUser?.nim || currentUser?.nip}`);
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChatMessages(parsedChats);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, [userType, currentUser]);

  // ✨ SAVE CHAT HISTORY TO LOCALSTORAGE
  useEffect(() => {
    if (chatMessages.length > 0) {
      const chatKey = `chat_history_${userType}_${currentUser?.id || currentUser?.nim || currentUser?.nip}`;
      localStorage.setItem(chatKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, userType, currentUser]);

  // ✨ CLEAR CHAT HISTORY
  const clearChatHistory = () => {
    setChatMessages([]);
    const chatKey = `chat_history_${userType}_${currentUser?.id || currentUser?.nim || currentUser?.nip}`;
    localStorage.removeItem(chatKey);
  };

  // ✨ AUTO SCROLL TO BOTTOM WHEN NEW MESSAGES ARRIVE
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages]);

  // ✨ AUTO SCROLL WHEN CHAT OPENS
  useEffect(() => {
    if (showChat && chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [showChat]);

  // ✨ HELPER FUNCTION TO SCROLL TO BOTTOM
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleMenuChange = (menuId) => {
    if (onMenuChange) {
      onMenuChange(menuId);
    }
    console.log('Menu changed to:', menuId);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // ✨ CHAT FUNCTIONALITY
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = {
        id: Date.now(),
        text: newMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setChatMessages(prev => [...prev, userMessage]);
      const currentMessage = newMessage;
      setNewMessage('');
      
      // Scroll to bottom after user message
      setTimeout(scrollToBottom, 100);
      
      // Show typing indicator
      const typingMessage = {
        id: Date.now() + 1,
        text: 'Mengetik...',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isTyping: true
      };
      setChatMessages(prev => [...prev, typingMessage]);
      
      // Scroll to bottom after typing indicator
      setTimeout(scrollToBottom, 150);

      try {
        // Call AI backend
        const response = await fetch('http://localhost:5000/api/ai-chat/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            message: currentMessage,
            userId: userType === 'mahasiswa' ? currentUser?.nim : currentUser?.nip || currentUser?.id,
            userRole: userType?.toUpperCase()
          })
        });

        const result = await response.json();

        // Remove typing indicator
        setChatMessages(prev => prev.filter(msg => !msg.isTyping));

        if (result.success) {
          const aiResponse = {
            id: Date.now() + 2,
            text: result.response,
            sender: 'ai',
            timestamp: result.timestamp || new Date().toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
          setChatMessages(prev => [...prev, aiResponse]);
          
          // Scroll to bottom after AI response
          setTimeout(scrollToBottom, 100);
        } else {
          const errorMsg = result.error ? result.response + '\n(' + result.error + ')' : result.response;
          const errorResponse = {
            id: Date.now() + 2,
            text: errorMsg,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
          setChatMessages(prev => [...prev, errorResponse]);
          
          // Scroll to bottom after error response
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove typing indicator
        setChatMessages(prev => prev.filter(msg => !msg.isTyping));
        
        const errorResponse = {
          id: Date.now() + 2,
          text: 'Maaf, tidak dapat terhubung ke server. Silakan coba lagi.',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        setChatMessages(prev => [...prev, errorResponse]);
        
        // Scroll to bottom after error response
        setTimeout(scrollToBottom, 100);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✨ LOAD CHAT SUGGESTIONS
  const [chatSuggestions, setChatSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (showChat && userType) {
      loadChatSuggestions();
    }
  }, [showChat, userType, authToken]);

  const loadChatSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(`http://localhost:5000/api/ai-chat/suggestions/${userType?.toUpperCase()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setChatSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // ✨ GET CONTEXTUAL SUGGESTIONS
  const getContextualSuggestions = () => {
    if (chatMessages.length === 0) {
      return chatSuggestions.slice(0, 4);
    }
    
    // Get last few messages to determine context
    const recentMessages = chatMessages.slice(-3);
    const lastMessage = recentMessages[recentMessages.length - 1];
    
    // Filter suggestions based on context
    const contextualSuggestions = chatSuggestions.filter(suggestion => {
      const lowerSuggestion = suggestion.toLowerCase();
      const lowerLastMessage = lastMessage?.text?.toLowerCase() || '';
      
      // Don't show suggestions that are too similar to recent messages
      return !lowerLastMessage.includes(lowerSuggestion) && 
             !lowerSuggestion.includes(lowerLastMessage);
    });
    
    return contextualSuggestions.slice(0, 3);
  };

  // ✨ HANDLE SUGGESTION CLICK
  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
    // Focus on input and scroll to bottom
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Ketik pesan..."]');
      if (input) {
        input.focus();
      }
      scrollToBottom();
    }, 50);
  };

  // ✨ REFRESH SUGGESTIONS
  const refreshSuggestions = () => {
    loadChatSuggestions();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const floatingButtonVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        delay: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Tambahkan komponen helper untuk render tabel markdown
  function ChatMessageContent({ text }) {
    // Deteksi jika ada markdown table
    const hasTable = /\|.*\|/.test(text) && /\n\|.*\|/.test(text);
    if (hasTable) {
      return (
        <ReactMarkdown
          className="prose prose-sm max-w-full"
          components={{
            table: ({node, ...props}) => <table className="min-w-full border border-gray-300 my-2" {...props} />,
            th: ({node, ...props}) => <th className="border px-2 py-1 bg-gray-100 text-xs" {...props} />,
            td: ({node, ...props}) => <td className="border px-2 py-1 text-xs" {...props} />,
            tr: ({node, ...props}) => <tr className="" {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      );
    }
    // Default: render sebagai teks biasa
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Layout Container */}
      <div className="flex h-screen">
        {/* Sidebar - Fixed position with proper z-index */}
        <motion.div 
          className={`sidebar-container ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } transition-all duration-300 flex-shrink-0 relative z-20`}
          variants={itemVariants}
        >
          <Sidebar 
            activeMenu={activeMenu}
            onMenuChange={handleMenuChange}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            menuItems={menuItems}
          />
        </motion.div>
                         
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          {/* Header - Fixed at top with consistent height */}
          <motion.div className="header-container" variants={itemVariants}>
            <Header 
              title={title}
              user={currentUser?.nama || currentUser?.name || "User"}
              role={userType === 'admin' ? 'Administrator' : userType === 'dosen' ? 'Dosen' : userType === 'kaprodi' ? 'Kaprodi' : 'Mahasiswa'}
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
              onLogout={onLogout}
              currentUser={currentUser}
            />
          </motion.div>
                               
          {/* Enhanced Content Area */}
          <main className="flex-1 overflow-auto relative pt-16">
            {/* Background Pattern */}
            <motion.div 
              className="absolute inset-0 opacity-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400"></div>
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="politeknik-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.1"/>
                    <path d="M10,5 L15,15 L5,15 Z" fill="currentColor" opacity="0.05"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#politeknik-pattern)"/>
              </svg>
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 h-full">
              <motion.div 
                className="p-4 sm:p-6 min-h-full"
                variants={itemVariants}
              >
                {/* Enhanced Content Wrapper */}
                <div className="max-w-full h-full">
                  {/* Content Card with University Branding */}
                  <motion.div 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 min-h-full overflow-hidden"
                    variants={cardVariants}
                  >
                    {/* Header Accent */}
                    <motion.div 
                      className="h-1 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      style={{ transformOrigin: 'left' }}
                    />
                    
                    {/* Content Area */}
                    <motion.div 
                      className="p-6 sm:p-8"
                      variants={itemVariants}
                    >
                      {/* Title Section with University Branding */}
                      <motion.div 
                        className="mb-8"
                        variants={itemVariants}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1">
                            <motion.h1 
                              className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                            >
                              {title}
                            </motion.h1>
                            <motion.p 
                              className="text-gray-600 text-sm font-medium"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                            >
                              Politeknik Negeri Manado
                            </motion.p>
                            {/* Show current user role */}
                            <motion.p 
                              className="text-gray-500 text-xs mt-1"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                            >
                              {userType === 'admin' ? 'Administrator' : 
                               userType === 'dosen' ? 'Dosen' : 
                               userType === 'kaprodi' ? 'Kepala Program Studi' : 
                               'Mahasiswa'} - {currentUser?.nama || currentUser?.username}
                            </motion.p>
                          </div>
                        </div>
                        
                        {/* Decorative Line */}
                        <motion.div 
                          className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.6, delay: 0.7 }}
                          style={{ transformOrigin: 'left' }}
                        />
                      </motion.div>

                      {/* Main Content Area */}
                      <motion.div 
                        className="relative"
                        variants={itemVariants}
                      >
                        {/* Content Background */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30 rounded-xl -z-10"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        />
                        
                        {/* Actual Content */}
                        <motion.div 
                          className="relative z-10 min-h-96"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeMenu}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                            >
                              {children}
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Footer Accent */}
                    <motion.div 
                      className="mt-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                      <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-50/30 to-blue-100/30 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                          © 2025 Politeknik Negeri Manado - Excellence in Technical Education
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Chat Button */}
                  <motion.div 
                    className="fixed bottom-6 right-6 z-20"
                    variants={floatingButtonVariants}
                  >
                    <motion.button 
                      onClick={() => setShowChat(!showChat)}
                      className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
                      
                      {/* Message Counter Badge */}
                      {chatMessages.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                        >
                          {chatMessages.length > 99 ? '99+' : chatMessages.length}
                        </motion.div>
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Chat Window */}
                  <AnimatePresence>
                    {showChat && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed bottom-24 right-6 z-30 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                      >
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">Chat Assistant</h3>
                              <p className="text-blue-100 text-xs">AI Support</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {chatMessages.length > 0 && (
                              <button
                                onClick={clearChatHistory}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                title="Clear chat history"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => setShowChat(false)}
                              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Chat Messages */}
                        <div 
                          className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scroll-smooth" 
                          ref={chatContainerRef}
                          style={{ scrollBehavior: 'smooth' }}
                        >
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm mb-4">Mulai percakapan dengan AI Assistant</p>
                              
                              {/* Chat Suggestions */}
                              {!loadingSuggestions && chatSuggestions.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-400">Saran pertanyaan:</p>
                                    <button
                                      onClick={refreshSuggestions}
                                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                                      title="Refresh suggestions"
                                    >
                                      🔄
                                    </button>
                                  </div>
                                  {getContextualSuggestions().map((suggestion, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="block w-full text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {chatMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                      message.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : message.isTyping
                                        ? 'bg-gray-200 text-gray-600 rounded-bl-md'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                    }`}
                                  >
                                    {message.isTyping ? (
                                      <div className="flex items-center space-x-1">
                                        <div className="flex space-x-1">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="ml-2">{message.text}</span>
                                      </div>
                                    ) : (
                                      <>
                                        <ChatMessageContent text={message.text} />
                                        <p className={`text-xs mt-1 ${
                                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                          {message.timestamp}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Quick Suggestions after messages */}
                              {chatMessages.length > 0 && !loadingSuggestions && chatSuggestions.length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-blue-600 font-medium">💡 Pertanyaan lainnya:</p>
                                    <button
                                      onClick={refreshSuggestions}
                                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                                      title="Refresh suggestions"
                                    >
                                      🔄
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {getContextualSuggestions().map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="px-2 py-1 text-xs bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Loading Suggestions */}
                              {loadingSuggestions && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500">Memuat saran...</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Ketik pesan..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                              Kirim
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
             
      {/* Mobile overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-15"
            onClick={toggleSidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MainLayout;