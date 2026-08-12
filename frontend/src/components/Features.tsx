import React from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Scissors, 
  Cpu, 
  Database, 
  MessageCircle, 
  ShieldCheck, 
  Quote, 
  History, 
  Lock 
} from 'lucide-react';

const features = [
  {
    icon: <UploadCloud className="w-5 h-5 text-ink" />,
    title: "Upload PDF, DOCX, or TXT files",
    description: "Seamlessly import your documents in various formats."
  },
  {
    icon: <FileText className="w-5 h-5 text-ink" />,
    title: "Extract text from documents",
    description: "Advanced parsing techniques for accurate text extraction from structured and unstructured files."
  },
  {
    icon: <Scissors className="w-5 h-5 text-ink" />,
    title: "Split text into chunks",
    description: "Intelligently divides large texts into semantic, manageable segments for optimized processing."
  },
  {
    icon: <Cpu className="w-5 h-5 text-ink" />,
    title: "Create embeddings",
    description: "Converts text chunks into high-dimensional vectors for powerful semantic search capabilities."
  },
  {
    icon: <Database className="w-5 h-5 text-ink" />,
    title: "Store in a vector database",
    description: "Securely saves vector embeddings for instantaneous, scalable, and highly accurate retrieval."
  },
  {
    icon: <MessageCircle className="w-5 h-5 text-ink" />,
    title: "Ask questions in natural language",
    description: "Converse with your data just like you would with a human assistant."
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-ink" />,
    title: "Grounded AI answers",
    description: "AI answers strictly using the uploaded documents, eliminating hallucinations."
  },
  {
    icon: <Quote className="w-5 h-5 text-ink" />,
    title: "Shows source chunks",
    description: "Provides verifiable citations directly linking to the exact source chunks used for the answer."
  },
  {
    icon: <History className="w-5 h-5 text-ink" />,
    title: "Chat history",
    description: "Automatically saves your past conversations for easy reference and continuation."
  },
  {
    icon: <Lock className="w-5 h-5 text-ink" />,
    title: "Authentication (optional)",
    description: "Secure your application with built-in or custom user authentication out of the box."
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="bg-canvas p-6 rounded-md shadow-level-3 flex flex-col hover:-translate-y-1 transition-transform"
    >
      <div className="w-10 h-10 rounded-sm bg-canvas-soft flex items-center justify-center mb-4 border border-hairline">
        {feature.icon}
      </div>
      <h3 className="text-[16px] font-semibold mb-2 leading-tight text-ink">{feature.title}</h3>
      <p className="text-body text-[14px] leading-[20px] flex-1">{feature.description}</p>
    </motion.div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-[96px] lg:py-[128px] bg-canvas-soft border-y border-hairline">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-mono text-mute uppercase tracking-wider mb-4 block">Features</span>
          <h2 className="text-[32px] leading-[40px] tracking-[-1.28px] font-semibold text-ink mb-6">Comprehensive RAG Features</h2>
          <p className="text-[18px] leading-[28px] text-body">Everything you need to build, deploy, and scale intelligent document conversational agents.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
