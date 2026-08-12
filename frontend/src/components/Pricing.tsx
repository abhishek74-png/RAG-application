import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for individuals trying out RAG.",
    features: ["Up to 50 documents", "100 queries per month", "Standard retrieval speed", "Community support"],
    highlighted: false,
    cta: "Get Started"
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For professionals who need more power.",
    features: ["Up to 10,000 documents", "Unlimited queries", "Lightning fast retrieval", "Priority support", "API Access"],
    highlighted: true,
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for large organizations.",
    features: ["Unlimited documents", "Custom AI models", "On-premise deployment", "Dedicated account manager", "SSO & Advanced Security"],
    highlighted: false,
    cta: "Contact Sales"
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-[96px] lg:py-[128px] relative z-10 bg-canvas border-y border-hairline">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-[12px] font-mono text-mute uppercase tracking-wider mb-4 block">Pricing</span>
          <h2 className="text-[32px] leading-[40px] tracking-[-1.28px] font-semibold text-ink mb-6">Simple, Transparent Pricing</h2>
          <p className="text-[18px] leading-[28px] text-body">Choose the perfect plan for your document processing needs.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-md p-8 relative flex flex-col ${
                plan.highlighted 
                  ? 'bg-canvas border-2 border-ink shadow-level-5 transform lg:-translate-y-4 z-10' 
                  : 'bg-canvas border border-hairline shadow-level-2'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink text-on-primary text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-[20px] font-semibold mb-2 text-ink">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-[48px] font-bold tracking-[-2.4px] text-ink">{plan.price}</span>
                {plan.period && <span className="text-mute">{plan.period}</span>}
              </div>
              <p className="text-body text-[14px] leading-[20px] mb-8">{plan.description}</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-ink' : 'text-mute'}`} />
                    <span className="text-[14px] text-ink">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full h-[40px] flex items-center justify-center rounded-sm font-medium transition-colors text-[14px] ${
                plan.highlighted 
                  ? 'bg-ink text-on-primary hover:bg-ink/90' 
                  : 'bg-canvas text-ink border border-hairline hover:bg-canvas-soft'
              }`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
};

export default Pricing;
