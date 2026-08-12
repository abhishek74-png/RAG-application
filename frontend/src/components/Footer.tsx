import React from 'react';
import { Bot, Globe, MessageCircle, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-hairline bg-canvas pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                <Bot className="w-5 h-5 text-on-primary" />
              </div>
              <span className="font-semibold text-[18px] tracking-tight text-ink">RAGFlow</span>
            </div>
            <p className="text-body text-[14px] leading-[24px] mb-6">
              Transforming how teams interact with their knowledge base through advanced AI and secure vector search.
            </p>
            <div className="flex gap-4 text-mute">
              <a href="#" className="hover:text-ink transition-colors"><Globe className="w-5 h-5" /></a>
              <a href="#" className="hover:text-ink transition-colors"><MessageCircle className="w-5 h-5" /></a>
              <a href="#" className="hover:text-ink transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-6 text-ink text-[14px]">Product</h4>
            <ul className="space-y-4 text-[14px] text-body">
              <li><a href="#" className="hover:text-ink transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-6 text-ink text-[14px]">Resources</h4>
            <ul className="space-y-4 text-[14px] text-body">
              <li><a href="#" className="hover:text-ink transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-6 text-ink text-[14px]">Legal</h4>
            <ul className="space-y-4 text-[14px] text-body">
              <li><a href="#" className="hover:text-ink transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-ink transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-hairline pt-8 flex flex-col md:flex-row items-center justify-between text-[14px] text-mute">
          <p>© {new Date().getFullYear()} RAGFlow AI. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Designed for the future of work.</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;
