import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Scissors, Database, Search, MessageSquare } from 'lucide-react';

const steps = [
  { icon: <Upload className="w-5 h-5" />, title: "Upload", desc: "Add your PDFs, Word docs, or text files." },
  { icon: <Scissors className="w-5 h-5" />, title: "Chunk", desc: "We automatically split text into logical segments." },
  { icon: <Database className="w-5 h-5" />, title: "Embed", desc: "Text is converted into high-dimensional vectors." },
  { icon: <Search className="w-5 h-5" />, title: "Retrieve", desc: "Relevant context is fetched based on your query." },
  { icon: <MessageSquare className="w-5 h-5" />, title: "Generate", desc: "AI synthesizes a precise, cited answer." }
];

const HowItWorks = () => {
  return (
    <section className="py-[96px] lg:py-[128px] relative z-10 bg-canvas border-y border-hairline">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <span className="text-[12px] font-mono text-mute uppercase tracking-wider mb-4 block">Process</span>
          <h2 className="text-[32px] leading-[40px] tracking-[-1.28px] font-semibold text-ink mb-6">How RAG Works</h2>
          <p className="text-[18px] leading-[28px] text-body max-w-2xl mx-auto">A seamless pipeline from unstructured data to precise answers, entirely invisible to the user.</p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-[1px] bg-hairline"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-canvas flex items-center justify-center mb-6 relative z-10 border border-hairline group-hover:border-link transition-colors shadow-level-1 group-hover:shadow-level-2">
                  <div className="text-mute group-hover:text-link transition-colors">
                    {step.icon}
                  </div>
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-on-primary flex items-center justify-center text-[12px] font-mono shadow-level-2">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-[16px] font-semibold mb-2 text-ink">{step.title}</h3>
                <p className="text-[14px] text-body leading-[20px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
