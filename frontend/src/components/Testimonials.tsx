import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "VP of Operations, TechCorp",
    content: "This RAG application completely transformed how we access internal documentation. What used to take 20 minutes of searching now takes 5 seconds of chatting.",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    name: "Michael Chen",
    role: "Lead Researcher, BioGen",
    content: "The citation feature is a game-changer. Being able to instantly verify the AI's answers against our source PDFs gives us the confidence we need.",
    avatar: "https://i.pravatar.cc/150?u=michael"
  },
  {
    name: "Elena Rodriguez",
    role: "Legal Partner, Apex Law",
    content: "We process thousands of contracts a week. The multi-document querying capability has saved our associates hundreds of hours this month alone.",
    avatar: "https://i.pravatar.cc/150?u=elena"
  }
];

const Testimonials = () => {
  return (
    <section className="py-[96px] lg:py-[128px] relative z-10 bg-canvas-soft border-y border-hairline">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-[12px] font-mono text-mute uppercase tracking-wider mb-4 block">Testimonials</span>
          <h2 className="text-[32px] leading-[40px] tracking-[-1.28px] font-semibold text-ink mb-6">Loved by Industry Leaders</h2>
          <p className="text-[18px] leading-[28px] text-body">Don't just take our word for it. See what our enterprise clients are saying.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-canvas p-8 rounded-md border border-hairline shadow-level-3 flex flex-col"
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-ink text-ink" />
                ))}
              </div>
              
              <p className="text-[16px] text-ink leading-[24px] mb-8 flex-1 italic">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                  className="w-10 h-10 rounded-full border border-hairline"
                />
                <div>
                  <h4 className="text-[14px] font-semibold text-ink leading-tight">{testimonial.name}</h4>
                  <p className="text-[12px] text-mute">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
};

export default Testimonials;
