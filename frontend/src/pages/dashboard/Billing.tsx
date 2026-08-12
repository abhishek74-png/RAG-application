import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Download, CheckCircle2, Zap, HardDrive, FileText, MessageSquare, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { billingService } from '../../services/billing';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const plans = [
  { name: 'Free', price: '$0', storage: '1 GB', docs: '10', queries: '100', model: 'Standard', color: 'bg-mute', priceId: '' },
  { name: 'Starter', price: '$19', storage: '10 GB', docs: '100', queries: '1,000', model: 'Fast', color: 'bg-link', priceId: 'price_starter_mock' },
  { name: 'Pro', price: '$49', storage: '50 GB', docs: 'Unlimited', queries: 'Unlimited', model: 'Premium', color: 'bg-violet', priceId: 'price_pro_mock' },
  { name: 'Business', price: '$149', storage: '200 GB', docs: 'Unlimited', queries: 'Unlimited', model: 'Ultra', color: 'bg-ink', priceId: 'price_business_mock' },
];

const Billing = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'history'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Fetch dynamic subscription data
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
      return data || { plan_tier: 'free', current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString(), status: 'active' };
    }
  });

  // Fetch dynamic usage data (Mocked from DB for now)
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      // In production, this would query a usage tracking table
      return {
        storage: { used: 12.5, total: 50, unit: 'GB', percentage: 25 },
        docs: { used: 450, total: 'Unlimited', unit: '', percentage: 45 },
        queries: { used: 1200, total: 'Unlimited', unit: '', percentage: 12 },
        tokens: { used: 150, total: 1000, unit: 'M', percentage: 15 }
      };
    }
  });

  const handleStripePortal = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("Redirecting to Stripe Customer Portal...");
    try {
      await billingService.createPortalSession();
    } catch (error: any) {
      toast.error(error.message || "Failed to open portal", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) return;
    setCheckoutLoading(priceId);
    const toastId = toast.loading("Preparing checkout...");
    try {
      await billingService.createCheckoutSession(priceId);
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout", { id: toastId });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentPlanDetails = plans.find(p => p.name.toLowerCase() === subscription?.plan_tier?.toLowerCase()) || plans[0];

  const UsageMeter = ({ title, used, total, unit, icon, colorClass, percentage }: any) => {
    const isWarning = percentage >= 90;
    const isCaution = percentage >= 70 && percentage < 90;

    return (
      <div className="bg-canvas rounded-xl border border-hairline shadow-level-1 p-6 relative overflow-hidden transition-all hover:shadow-level-2">
        {isWarning && <div className="absolute top-0 right-0 w-2 h-full bg-error"></div>}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-ink font-medium text-[14px]">
            {icon} {title}
          </div>
          <div className="text-[12px] font-mono">
            <span className={isWarning ? 'text-error font-bold' : 'text-ink'}>{used}</span>
            <span className="text-mute"> / {total} {unit}</span>
          </div>
        </div>
        
        <div className="h-2 w-full bg-canvas-soft rounded-sm overflow-hidden border border-hairline relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-sm ${isWarning ? 'bg-error' : isCaution ? 'bg-warning' : colorClass}`}
          ></motion.div>
        </div>
        <p className="text-[12px] mt-3 flex justify-between items-center">
          <span className="text-mute">{percentage.toFixed(1)}% used</span>
          {isWarning && <span className="text-error font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Almost Limit</span>}
        </p>
      </div>
    );
  };

  if (subLoading || usageLoading) {
    return (
      <div className="max-w-6xl mx-auto pb-12 flex flex-col gap-8 animate-pulse">
        <div className="h-10 w-48 bg-canvas-soft rounded-md"></div>
        <div className="h-64 w-full bg-canvas-soft rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-canvas-soft rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.96px] text-ink mb-1">Billing & Subscription</h1>
          <p className="text-body text-[14px]">Manage your SaaS subscription, limits, and payment methods.</p>
        </div>
        <button 
          onClick={handleStripePortal}
          disabled={isProcessing}
          className="bg-canvas text-ink border border-hairline h-[40px] px-5 rounded-lg font-medium hover:bg-canvas-soft transition-colors shadow-level-1 text-[14px] flex items-center gap-2 hover:scale-[0.98]"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Manage in Stripe
        </button>
      </div>

      <div className="flex gap-2 p-1.5 bg-canvas-soft rounded-xl border border-hairline w-max mb-8 shadow-inner">
        {['overview', 'plans', 'history'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2 text-[14px] font-medium rounded-lg capitalize transition-all duration-200 ${activeTab === tab ? 'bg-canvas text-ink shadow-sm' : 'text-mute hover:text-ink hover:bg-canvas/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-canvas rounded-2xl border-2 border-link shadow-level-3 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-link/10 -mr-20 -mt-20 rounded-full blur-3xl group-hover:bg-link/20 transition-all duration-700"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-[28px] font-semibold tracking-[-0.96px] text-ink capitalize">{currentPlanDetails.name} Plan</h2>
                    <span className="px-2.5 py-1 rounded-md bg-success/10 text-success text-[12px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                       <CheckCircle2 className="w-3.5 h-3.5" /> {subscription?.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-[14px] text-mute mb-8">Your subscription automatically renews on <strong className="text-ink">{new Date(subscription?.current_period_end).toLocaleDateString()}</strong>.</p>
                  
                  <div className="flex flex-wrap gap-10">
                    <div>
                      <p className="text-[11px] text-mute uppercase tracking-widest font-mono mb-1.5">Monthly Price</p>
                      <p className="font-semibold text-ink text-[18px]">{currentPlanDetails.price}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-mute uppercase tracking-widest font-mono mb-1.5">AI Model</p>
                      <p className="font-semibold text-ink text-[18px]">{currentPlanDetails.model}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto z-10 relative">
                  <button onClick={() => setActiveTab('plans')} className="bg-ink text-on-primary h-[44px] px-6 rounded-xl font-medium hover:scale-[0.98] transition-transform shadow-level-2 text-[14px]">
                    Upgrade Plan
                  </button>
                  <button onClick={handleStripePortal} className="text-error font-medium hover:bg-error-soft px-6 h-[44px] rounded-xl transition-colors text-[14px]">
                    Cancel Subscription
                  </button>
                </div>
              </div>

              <div className="bg-canvas rounded-2xl border border-hairline p-8 shadow-level-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-ink mb-6">Payment Method</h2>
                  
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-canvas-soft border border-hairline shadow-sm mb-4">
                    <div className="w-12 h-8 bg-canvas border border-hairline rounded-md flex items-center justify-center shrink-0 shadow-sm">
                      <div className="flex -space-x-2">
                        <div className="w-4 h-4 rounded-full bg-[#EB001B] opacity-90 mix-blend-multiply"></div>
                        <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90 mix-blend-multiply"></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-[14px] text-ink">Mastercard ending in 4242</p>
                      <p className="text-[12px] text-mute font-mono">Expires 12/28</p>
                    </div>
                  </div>
                </div>
                <button onClick={handleStripePortal} className="text-link text-[14px] font-medium hover:text-link-deep transition-colors w-max">Update Payment Method</button>
              </div>
            </div>

            <div>
              <h2 className="text-[18px] font-semibold text-ink mb-6">Current Usage Cycle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <UsageMeter title="Storage" used={usage?.storage.used} total={usage?.storage.total} unit={usage?.storage.unit} icon={<HardDrive className="w-4 h-4"/>} colorClass="bg-violet" percentage={usage?.storage.percentage} />
                <UsageMeter title="Documents" used={usage?.docs.used} total={usage?.docs.total} unit={usage?.docs.unit} icon={<FileText className="w-4 h-4"/>} colorClass="bg-ink" percentage={usage?.docs.percentage} />
                <UsageMeter title="AI Queries" used={usage?.queries.used} total={usage?.queries.total} unit={usage?.queries.unit} icon={<MessageSquare className="w-4 h-4"/>} colorClass="bg-link" percentage={usage?.queries.percentage} />
                <UsageMeter title="API Tokens" used={usage?.tokens.used} total={usage?.tokens.total} unit={usage?.tokens.unit} icon={<Zap className="w-4 h-4"/>} colorClass="bg-cyan" percentage={usage?.tokens.percentage} />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div key={plan.name} className={`bg-canvas rounded-2xl border ${plan.name.toLowerCase() === currentPlanDetails.name.toLowerCase() ? 'border-2 border-link shadow-level-4 scale-[1.02] z-10' : 'border-hairline shadow-level-1'} p-8 flex flex-col relative overflow-hidden transition-all duration-300`}>
                  {plan.name.toLowerCase() === currentPlanDetails.name.toLowerCase() && (
                    <div className="absolute top-0 inset-x-0 bg-link text-white text-[10px] font-bold tracking-widest uppercase text-center py-1.5">Current Plan</div>
                  )}
                  <div className={`mt-4 mb-8 ${plan.name.toLowerCase() === currentPlanDetails.name.toLowerCase() ? 'pt-2' : ''}`}>
                    <h3 className="text-[20px] font-semibold text-ink mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[36px] font-bold tracking-tight text-ink">{plan.price}</span>
                      <span className="text-mute text-[14px]">/ mo</span>
                    </div>
                  </div>
                  
                  <div className="space-y-5 mb-10 flex-1 text-[14px]">
                    <div className="flex justify-between border-b border-hairline pb-3">
                      <span className="text-body">Storage</span>
                      <span className="font-medium text-ink">{plan.storage}</span>
                    </div>
                    <div className="flex justify-between border-b border-hairline pb-3">
                      <span className="text-body">Documents</span>
                      <span className="font-medium text-ink">{plan.docs}</span>
                    </div>
                    <div className="flex justify-between border-b border-hairline pb-3">
                      <span className="text-body">AI Queries</span>
                      <span className="font-medium text-ink">{plan.queries}</span>
                    </div>
                    <div className="flex justify-between pb-3">
                      <span className="text-body">AI Model</span>
                      <span className="font-medium text-ink">{plan.model}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSubscribe(plan.priceId)}
                    disabled={plan.name.toLowerCase() === currentPlanDetails.name.toLowerCase() || checkoutLoading === plan.priceId}
                    className={`w-full h-[44px] rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-[14px] ${plan.name.toLowerCase() === currentPlanDetails.name.toLowerCase() ? 'bg-canvas-soft border border-hairline text-mute cursor-not-allowed' : 'bg-ink text-on-primary hover:scale-[0.98] shadow-level-2'}`}
                  >
                    {checkoutLoading === plan.priceId && <Loader2 className="w-4 h-4 animate-spin" />}
                    {plan.name.toLowerCase() === currentPlanDetails.name.toLowerCase() ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-canvas rounded-2xl border border-hairline overflow-hidden shadow-level-1">
            <div className="p-6 border-b border-hairline flex justify-between items-center bg-canvas-soft/50">
              <h2 className="text-[16px] font-semibold text-ink">Billing History</h2>
              <button className="flex items-center gap-2 text-[14px] text-ink font-medium bg-canvas border border-hairline px-4 py-2 rounded-lg hover:bg-canvas-soft transition-colors shadow-sm hover:shadow-md">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-canvas text-mute border-b border-hairline text-[11px] uppercase tracking-widest font-mono">
                  <tr>
                    <th className="px-6 py-4 font-medium">Invoice Number</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {[1, 2, 3].map((_, idx) => (
                    <tr key={idx} className="hover:bg-canvas-soft/50 transition-colors text-ink">
                      <td className="px-6 py-5 font-medium font-mono text-[13px]">INV-5849-01{4-idx}</td>
                      <td className="px-6 py-5 text-body">{new Date(Date.now() - idx * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                      <td className="px-6 py-5 font-mono font-medium">{currentPlanDetails.price}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-[12px] text-success bg-success/10 px-2.5 py-1 rounded-md w-max font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={handleStripePortal} className="text-link hover:text-link-deep transition-colors font-medium text-[13px] flex items-center gap-1 justify-end w-full">
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Billing;
