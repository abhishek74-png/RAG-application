import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What file formats do you support?",
    answer: "We currently support PDF, DOCX, TXT, CSV, and Markdown files. We are actively working on adding support for more formats like Excel and PowerPoint."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, absolutely. We use enterprise-grade AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your documents are never used to train public AI models."
  },
  {
    question: "How accurate are the answers?",
    answer: "Our RAG pipeline is designed for high accuracy. By retrieving exact context from your documents and citing sources, hallucinations are virtually eliminated."
  },
  {
    question: "Can I deploy this on-premise?",
    answer: "Yes, our Enterprise plan includes options for on-premise deployment or deployment within your own private cloud infrastructure (AWS, GCP, Azure)."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-[96px] lg:py-[128px] relative z-10 bg-canvas-soft border-y border-hairline">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <span className="text-[12px] font-mono text-mute uppercase tracking-wider mb-4 block">FAQ</span>
          <h2 className="text-[32px] leading-[40px] tracking-[-1.28px] font-semibold text-ink mb-6">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-canvas border border-hairline rounded-md overflow-hidden shadow-level-1"
            >
              <button 
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-canvas-soft transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-[16px] text-ink">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-mute transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-ink' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-body text-[14px] leading-[24px]">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
};

export default FAQ;
