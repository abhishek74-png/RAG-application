import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, Settings2, Plus, Paperclip, Copy, ThumbsUp, ThumbsDown, RotateCcw, Loader2, Check, MessageSquare, Trash2, StopCircle, Zap, Bot, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ragService } from '../../services/rag';
import { chatService, type ChatSession } from '../../services/chat';
import { documentService } from '../../services/document';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: any[];
}

const SUGGESTED_PROMPTS = [
  "Summarize the key points of my most recent document.",
  "What is the main conclusion of the uploaded research paper?",
  "Extract all financial figures from the Q3 report.",
  "Compare the features mentioned across all documents."
];

const Chat = () => {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Optimized: React Query for Sessions caching & background updates
  const { data: sessions = [], refetch: loadSessions } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: chatService.getSessions,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hello! I am your RAG Assistant. Ask me anything. If you have uploaded documents, I will answer from those using precise citations.' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimized: Document state checking
  const { data: hasDocuments } = useQuery({
    queryKey: ['hasDocuments'],
    queryFn: async () => {
      try {
        const { count, data } = await documentService.fetchDocuments({ page: 1, limit: 1 });
        return (count !== undefined && count > 0) || (data && data.length > 0);
      } catch (e) {
        return false;
      }
    },
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Optimized: useCallback to prevent unnecessary re-renders in lists
  const selectSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id);
    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages);
    } else {
      setMessages([{ id: "1", role: "ai", content: "This chat has no saved messages." }]);
    }
    setFeedback({});
  }, []);

  const deleteSession = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      await chatService.deleteSession(id);
      
      // Optimistic cache update
      queryClient.setQueryData(['chatSessions'], (old: ChatSession[]) => 
        old ? old.filter(s => s.id !== id) : []
      );

      if (currentSessionId === id) {
        handleNewChat();
      }
    }
  }, [currentSessionId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const messageText = overrideInput || input.trim();
    if (!messageText || isGenerating) return;

    setInput('');
    setIsGenerating(true);
    
    abortControllerRef.current = new AbortController();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageText };
    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = { id: aiMsgId, role: 'ai', content: '' };

    const currentHistory = [...messages].filter(m => m.id !== '1');

    setMessages(prev => [...prev, userMsg, initialAiMsg]);

    try {
      let context = null;
      let sources: any[] = [];

      if (hasDocuments) {
        const response = await ragService.getRelevantContext(messageText);
        context = response.context;
        sources = response.results.map((src: any) => ({
          ...src,
          score: src.similarity || "0.00", 
          chunk: src.metadata?.chunk_index !== undefined ? src.metadata.chunk_index : '?'
        }));
      }

      let finalAnswer = "";
      
      if (hasDocuments && (!context || context.trim() === "")) {
        finalAnswer = "I couldn't find that information in the provided documents.";
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: finalAnswer } : m
        ));
      } else {
        const result = await chatService.streamChat(messageText, currentHistory, context, (chunk) => {
          if (abortControllerRef.current?.signal.aborted) return;
          finalAnswer = chunk;
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, content: chunk } : m
          ));
        });

        if (!abortControllerRef.current?.signal.aborted) {
          finalAnswer = result.answer;
        }
      }

      const updatedMessages: Message[] = [
        ...currentHistory,
        userMsg,
        {
          id: aiMsgId,
          role: "ai" as const,
          content: finalAnswer,
          sources,
        },
      ];

      setMessages(updatedMessages);

      if (currentSessionId) {
        await chatService.updateSession(currentSessionId, updatedMessages);
      } else {
        const title = messageText.substring(0, 40);
        const newSession = await chatService.createSession(title, updatedMessages);
        if (newSession) {
          setCurrentSessionId(newSession.id);
          await loadSessions();
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: `Error: ${error.message}` } : m
        ));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { id: '1', role: 'ai', content: 'Hello! I am your RAG Assistant. I can answer questions based on the documents you have uploaded. What would you like to know?' }
    ]);
    setFeedback({});
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && !isGenerating) {
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1].role === 'ai') {
          newMsgs.pop();
        }
        newMsgs.pop();
        return newMsgs;
      });
      handleSubmit(undefined, lastUserMsg.content);
    }
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [id]: type }));
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">

      {/* Chat History Sidebar */}
      <div className="w-72 glass-panel rounded-2xl flex flex-col hidden lg:flex shrink-0">
        <div className="p-4 border-b border-hairline">
          <button
            onClick={handleNewChat}
            className="w-full h-10 px-4 rounded-xl bg-ink text-on-primary text-[14px] font-medium hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-level-2"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-[14px]">
          <div>
            <p className="text-[11px] font-bold text-mute mb-3 px-2 uppercase tracking-widest font-mono">Recent Sessions</p>
            <div className="space-y-1">
              {sessions.map(s => (
                <div key={s.id} className="relative group">
                  <button
                    onClick={() => selectSession(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl truncate pr-10 flex items-center gap-2.5 transition-all duration-200 ${currentSessionId === s.id ? 'bg-canvas text-ink font-semibold shadow-sm border border-hairline' : 'bg-transparent text-body hover:bg-canvas-soft hover:text-ink'}`}
                  >
                    <MessageSquare className="w-[18px] h-[18px] shrink-0 opacity-70" />
                    <span className="truncate text-[14px]">{s.title}</span>
                  </button>
                  <button onClick={(e) => deleteSession(s.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-mute hover:text-error hover:bg-error-soft rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-[14px] h-[14px]" />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <MessageSquare className="w-8 h-8 text-hairline-strong mx-auto mb-2" />
                  <p className="text-[13px] text-mute">No recent chats</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col relative overflow-hidden">

        {/* Chat Header */}
        <div className="h-16 border-b border-hairline flex items-center justify-between px-6 shrink-0 bg-canvas/40 backdrop-blur-md">
          <div>
            <h2 className="font-semibold text-ink text-[16px]">Active Chat</h2>
            <p className="text-[12px] text-link font-mono flex items-center gap-1.5"><Zap className="w-3 h-3"/> NVIDIA Nemotron 3 Ultra</p>
          </div>
          <button onClick={() => navigate('/dashboard/settings')} className="p-2 text-mute hover:text-ink rounded-lg hover:bg-canvas transition-colors border border-transparent hover:border-hairline shadow-none hover:shadow-sm">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar scroll-smooth">

          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={msg.id} 
                className={`flex gap-5 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                
                {msg.role === 'ai' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-link-deep to-violet-deep flex items-center justify-center shrink-0 shadow-lg mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end max-w-[85%]' : 'max-w-[100%] flex-1'}`}>
                  {msg.role === 'ai' && (
                    <p className="font-semibold text-[14px] mb-1.5 text-link">
                      RAG Assistant
                    </p>
                  )}
                  
                  <div className={`leading-[26px] text-[15px] p-5 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-ink text-on-primary rounded-tr-sm' 
                      : 'bg-canvas text-ink border border-hairline rounded-tl-sm'
                  }`}>
                    {msg.content === '' && isGenerating ? (
                      <span className="inline-flex gap-1.5 h-6 items-center px-2">
                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-link"></motion.span>
                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-link"></motion.span>
                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-link"></motion.span>
                      </span>
                    ) : (
                      <div className={`prose prose-sm prose-p:leading-[26px] max-w-none ${msg.role === 'user' ? 'prose-p:text-on-primary prose-strong:text-on-primary' : 'prose-headings:text-ink prose-p:text-ink prose-strong:text-ink'}`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <div className="rounded-xl overflow-hidden my-4 shadow-sm border border-hairline">
                                  <div className="bg-[#1e1e1e] px-4 py-2 text-[12px] font-mono text-mute flex justify-between items-center">
                                    <span>{match[1]}</span>
                                  </div>
                                  <SyntaxHighlighter
                                    {...props}
                                    children={String(children).replace(/\n$/, '')}
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 0, padding: '1.25rem' }}
                                  />
                                </div>
                              ) : (
                                <code {...props} className={`${className} bg-mute/10 text-link px-1.5 py-0.5 rounded-md font-mono text-[0.9em]`}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Citations / Highlighted Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 w-full bg-canvas-soft border border-hairline rounded-xl p-4 shadow-sm">
                      <p className="text-[11px] font-bold text-mute mb-3 uppercase tracking-widest font-mono">Retrieved Sources</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {msg.sources.map((src, i) => (
                          <div key={i} className="flex flex-col gap-2 bg-canvas border border-hairline p-3 rounded-lg hover:border-link transition-colors cursor-default group">
                            <div className="flex items-start justify-between text-[12px]">
                              <div className="flex items-center gap-2 font-semibold text-ink line-clamp-1">
                                <FileText className="w-4 h-4 text-link shrink-0" />
                                {src.metadata?.source_name || 'Document'}
                              </div>
                            </div>
                            <p className="text-[12px] text-body line-clamp-2 leading-relaxed">"{src.page_content}"</p>
                            <div className="flex items-center gap-3 font-mono text-mute text-[10px] mt-1">
                              <span className="bg-canvas-soft px-2 py-1 rounded-md">Chunk: {src.chunk}</span>
                              <span className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-md"><Check className="w-3 h-3"/> Score: {src.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  {msg.role === 'ai' && msg.content !== '' && (
                    <div className="mt-3 flex items-center gap-2 text-mute w-full px-2">
                      <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 hover:text-ink hover:bg-canvas rounded-md transition-colors" title="Copy response">
                        {copiedId === msg.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1.5 rounded-md transition-colors hover:bg-canvas ${feedback[msg.id] === 'up' ? 'text-link bg-link-soft' : 'hover:text-ink'}`}>
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1.5 rounded-md transition-colors hover:bg-canvas ${feedback[msg.id] === 'down' ? 'text-error bg-error-soft' : 'hover:text-ink'}`}>
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      <button onClick={handleRegenerate} disabled={isGenerating} className="px-3 py-1.5 hover:text-ink hover:bg-canvas rounded-md transition-colors ml-auto flex items-center gap-2 text-[12px] disabled:opacity-50 font-medium">
                        <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-9 h-9 rounded-xl border border-hairline shrink-0 shadow-sm object-cover mt-1" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl border border-hairline shrink-0 shadow-sm flex items-center justify-center mt-1 bg-canvas-soft">
                      <User className="w-4 h-4 text-mute" />
                    </div>
                  )
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Suggested Prompts */}
          {messages.length === 1 && hasDocuments && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-4xl mx-auto pt-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-hairline flex-1"></div>
                <p className="text-[12px] font-bold text-mute uppercase tracking-widest font-mono text-center">Suggested Starting Points</p>
                <div className="h-px bg-hairline flex-1"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSubmit(undefined, prompt)}
                    className="p-4 bg-canvas border border-hairline hover:border-link hover:text-link text-ink text-left text-[14px] rounded-xl transition-all shadow-sm hover:shadow-md group flex items-start gap-3"
                  >
                    <MessageSquare className="w-5 h-5 text-mute group-hover:text-link shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-canvas/80 backdrop-blur-xl border-t border-hairline relative">
          
          {/* Stop Generation Button */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-14 left-1/2 -translate-x-1/2 z-10"
              >
                <button 
                  onClick={handleStop}
                  className="flex items-center gap-2 bg-canvas border border-hairline shadow-level-3 text-ink px-5 py-2.5 rounded-full text-[13px] font-semibold hover:scale-105 transition-all hover:text-error group"
                >
                  <StopCircle className="w-4 h-4 group-hover:text-error" /> Stop generating
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end bg-canvas border border-hairline shadow-level-2 rounded-2xl overflow-hidden focus-within:border-link focus-within:ring-4 focus-within:ring-link/20 transition-all duration-300">
            <button
              type="button"
              onClick={() => navigate('/dashboard/documents')}
              className="p-4 md:p-5 text-mute hover:text-link transition-colors bg-canvas"
              title="Upload Documents"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              id="chat-input"
              name="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={hasDocuments === false ? "Please upload a document first..." : "Ask anything about your documents..."}
              disabled={hasDocuments === false}
              className="flex-1 bg-transparent py-4 md:py-5 focus:outline-none resize-none max-h-48 text-[15px] md:text-[16px] text-ink placeholder:text-mute custom-scrollbar disabled:opacity-50"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating || hasDocuments === false}
              className={`p-4 md:p-5 transition-colors bg-canvas ${input.trim() && !isGenerating && hasDocuments !== false ? 'text-link hover:text-link-deep' : 'text-mute opacity-50'}`}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin text-ink" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="flex justify-between items-center max-w-4xl mx-auto mt-3 px-2">
            <p className="text-[11px] text-mute font-mono uppercase tracking-widest">AI can make mistakes. Consider verifying important information.</p>
            <div className="flex gap-1">
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 border border-hairline rounded text-[10px] font-mono text-mute bg-canvas-soft">Enter</kbd>
              <span className="hidden md:inline-block text-[11px] text-mute font-mono uppercase">to send</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;
