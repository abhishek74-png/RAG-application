import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: "100K+", label: "Documents Processed" },
  { value: "98%", label: "Retrieval Accuracy" },
  { value: "<1s", label: "Response Time" },
  { value: "24/7", label: "AI Availability" }
];

const Statistics = () => {
  return (
    <section className="py-[96px] relative z-10 bg-canvas">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-lg p-12 border border-white/10 relative overflow-hidden shadow-level-4">
          
          <div className="absolute inset-0 hero-mesh opacity-20"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="text-[40px] md:text-[48px] font-semibold text-on-primary mb-2 tracking-[-2.4px]">
                  {stat.value}
                </div>
                <div className="text-[14px] text-mute font-mono uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Statistics;
