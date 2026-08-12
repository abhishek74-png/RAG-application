import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Send, MoreHorizontal } from 'lucide-react';

const InteractiveDemo = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  
  const aiText = "Based on the uploaded document, the total revenue was $4.2 million. The department that contributed the most was Enterprise Software Sales, accounting for 65% of the total revenue.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= aiText.length) {
        setDisplayedText(aiText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [aiText]);
  return (
    <section id="demo" className="py-[96px] lg:py-[128px] bg-canvas relative z-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-mono text-mute uppercase tracking-wider mb-4 block">Interactive Demo</span>
          <h2 className="text-[32px] leading-[40px] tracking-[-1.28px] font-semibold text-ink mb-6">See It In Action</h2>
          <p className="text-[18px] leading-[28px] text-body max-w-2xl mx-auto">Upload a file on the left and ask questions on the right. Our AI instantly reads and comprehends.</p>
        </div>

        <div className="bg-canvas rounded-xl overflow-hidden border border-hairline flex flex-col lg:flex-row h-[600px] shadow-level-4">
          
          {/* Upload Area - Left */}
          <div className="lg:w-1/3 bg-canvas-soft border-r border-hairline p-6 flex flex-col">
            <h3 className="text-[16px] font-medium text-ink mb-6 flex items-center gap-2">
              <UploadCloud className="text-mute w-5 h-5" />
              Document Vault
            </h3>
            
            {/* Drag & Drop Area */}
            <motion.div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
              animate={isDragging ? { scale: 1.05, borderColor: '#0070f3', backgroundColor: 'rgba(0,112,243,0.05)' } : { scale: 1, borderColor: '#ebebeb', backgroundColor: '#ffffff' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="border-2 border-dashed rounded-md p-8 text-center mb-6 transition-colors cursor-pointer shadow-level-1"
            >
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-link' : 'text-mute'}`} />
              </motion.div>
              <p className="text-[14px] text-ink font-medium mb-1">Drag & drop files here</p>
              <p className="text-[12px] text-mute">Supports PDF, DOCX, TXT</p>
            </motion.div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              <div className="bg-canvas border border-hairline p-3 rounded-md shadow-level-1 flex items-center gap-3">
                <div className="p-2 bg-error-soft rounded-sm">
                  <FileText className="w-4 h-4 text-error" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-ink font-medium truncate leading-tight">Q4_Financial_Report.pdf</p>
                  <p className="text-[12px] text-mute">2.4 MB • Indexed</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-deep"></div>
              </div>
              
              <div className="bg-canvas border border-hairline p-3 rounded-md shadow-level-1 flex items-center gap-3 opacity-60">
                <div className="p-2 bg-link-bg-soft rounded-sm">
                  <FileText className="w-4 h-4 text-link" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-ink font-medium truncate leading-tight">Employee_Handbook.docx</p>
                  <p className="text-[12px] text-mute">1.1 MB • Indexed</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-deep"></div>
              </div>
            </div>
          </div>

          {/* Chat Interface - Right */}
          <div className="lg:w-2/3 flex flex-col bg-canvas relative">
            
            {/* Chat Header */}
            <div className="h-16 border-b border-hairline flex items-center px-6 justify-between bg-canvas-soft">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-deep animate-pulse"></div>
                <span className="text-[14px] font-medium text-ink">AI Assistant is online</span>
              </div>
              <MoreHorizontal className="text-mute w-5 h-5" />
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* User Message */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-end"
              >
                <div className="bg-canvas-soft border border-hairline text-ink p-4 rounded-md rounded-tr-none max-w-[80%] shadow-level-1">
                  <p className="text-[14px] leading-[20px]">What was the total revenue in Q4 and which department contributed the most?</p>
                </div>
              </motion.div>

              {/* AI Typing/Response */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-start"
              >
                <div className="bg-canvas border border-hairline p-4 rounded-md rounded-tl-none max-w-[85%] mb-2 shadow-level-2">
                  <p className="text-[14px] text-body leading-[20px] mb-4 min-h-[40px]">
                    {displayedText}
                    <motion.span 
                      animate={{ opacity: [1, 0] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-1.5 h-3 bg-link ml-1 align-middle"
                    />
                  </p>
                  
                  {/* Source Citation */}
                  <div className="flex items-center gap-2 p-2 rounded-sm bg-canvas-soft border border-hairline cursor-pointer hover:bg-canvas transition-colors shadow-level-1">
                    <FileText className="w-3.5 h-3.5 text-mute" />
                    <div>
                      <p className="text-[12px] font-medium text-ink leading-tight">Q4_Financial_Report.pdf</p>
                      <p className="text-[12px] text-mute font-mono">Page 12 • Revenue Breakdown</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
            </div>

            {/* Input Area */}
            <div className="p-4 bg-canvas border-t border-hairline">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Ask a question about your documents..." 
                  className="w-full bg-canvas border border-hairline rounded-sm py-2 px-3 pr-10 text-[14px] focus:outline-none focus:border-link transition-colors text-ink placeholder:text-mute shadow-level-1 h-[40px]"
                  readOnly
                />
                <button className="absolute right-2 p-1.5 bg-canvas-soft hover:bg-hairline rounded-sm transition-colors border border-transparent">
                  <Send className="w-4 h-4 text-ink" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
