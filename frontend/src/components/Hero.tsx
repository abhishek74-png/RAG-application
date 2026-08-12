import React from 'react';
import { motion } from 'framer-motion';
import { Upload, PlayCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <section className="relative pt-[120px] pb-[64px] lg:pt-[192px] lg:pb-[128px] overflow-hidden bg-canvas">
      
      {/* Animated Gradient Mesh Background */}
      <div className="hero-mesh absolute inset-0 z-0 pointer-events-none opacity-40"></div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-soft border border-hairline mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-mute" />
            <span className="text-[12px] font-mono text-body uppercase tracking-wider">RAG 2.0 Engine Now Available</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[40px] leading-[40px] tracking-[-1.28px] lg:text-[48px] lg:leading-[48px] lg:tracking-[-2.4px] font-semibold text-ink mb-6"
          >
            Chat with your documents.<br />
            Powered by the AI Cloud.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[18px] leading-[28px] text-body mb-10 max-w-2xl"
          >
            Upload PDFs, DOCX, or TXT files and get instant, context-aware answers powered by highly-performant Retrieval-Augmented Generation.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full"
          >
            <button 
              onClick={() => navigate(user ? '/dashboard/documents' : '/login')}
              className="w-full sm:w-auto px-6 h-[48px] rounded-pill bg-primary text-on-primary text-[16px] font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Document
            </button>
            <button 
              onClick={() => navigate(user ? '/dashboard/chat' : '#demo')}
              className="w-full sm:w-auto px-6 h-[48px] rounded-pill bg-canvas text-ink border border-hairline text-[16px] font-medium flex items-center justify-center gap-2 hover:bg-canvas-soft transition-colors shadow-level-1 hover:shadow-level-2"
            >
              <PlayCircle className="w-5 h-5" />
              Try Demo
            </button>
          </motion.div>
        </div>

        {/* Code Editor Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-[96px] max-w-4xl mx-auto"
        >
          <div className="bg-primary rounded-md p-6 shadow-level-4 border border-white/10 relative overflow-hidden aspect-[16/9] sm:aspect-auto sm:h-[400px] text-left">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              <span className="ml-4 text-mute font-mono text-[12px]">rag-query.ts</span>
            </div>
            
            <div className="font-mono text-[13px] leading-[20px] text-on-primary whitespace-pre-wrap">
              <span className="text-highlight-pink">import</span> {`{ ragService }`} <span className="text-highlight-pink">from</span> <span className="text-cyan-deep">'@/services/rag'</span>;<br /><br />
              <span className="text-mute">// 1. Initialize query against vector store</span><br />
              <span className="text-highlight-pink">const</span> response = <span className="text-highlight-pink">await</span> ragService.query(<span className="text-cyan-deep">'What is the Q3 revenue?'</span>);<br /><br />
              <span className="text-mute">// 2. Stream generation with citations</span><br />
              console.log(response.answer);<br />
              <span className="text-cyan-deep">"Revenue grew 24% year-over-year."</span><br /><br />
              console.log(response.sources[0].metadata);<br />
              <span className="text-cyan-deep">{`{ file: "Q3_Report_Final.pdf", page: 4 }`}</span>
            </div>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
};

export default Hero;
