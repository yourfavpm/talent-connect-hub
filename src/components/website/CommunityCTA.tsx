import { motion } from "framer-motion";

const CommunityCTA = () => {
  return (
    <section className="py-24 px-1 sm:px-6 bg-white font-inter border-t border-slate-100">
      <div className="container max-w-[1200px] mx-auto">
        <div className="bg-slate-900 rounded-2xl sm:rounded-[48px] p-10 sm:p-20 relative overflow-hidden shadow-2xl shadow-slate-900/20">
          {/* Modern Gradient Burst */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 sm:gap-20">
            <div className="max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-blue-400 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                Talent Network
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold text-white mb-8 leading-[1.15] tracking-tight">
                Join our Global <br className="hidden md:block" /> Talent Community
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium mb-0">
                Connect with high-impact operations leaders, share tactical insights, and stay ahead of the curve with our vetted Slack community.
              </p>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-8 shrink-0">
              <motion.a
                href="https://join.slack.com/t/taskive/shared_invite/zt-3un5ge6yc-2gnqUuov5bdYMgysrObquQ"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 w-full sm:w-auto justify-center"
              >
                <div className="bg-white p-1 rounded-md">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 127 127" fill="currentColor">
                    <path d="M27.2 80c0 7.5-6.1 13.6-13.6 13.6C6.1 93.6 0 87.5 0 80c0-7.5 6.1-13.6 13.6-13.6h13.6v13.6zm6.8 0c0-7.5 6.1-13.6 13.6-13.6 7.5 0 13.6 6.1 13.6 13.6v34c0 7.5-6.1 13.6-13.6 13.6-7.5 0-13.6-6.1-13.6-13.6v-34zM47 27.2c-7.5 0-13.6-6.1-13.6-13.6C33.4 6.1 39.5 0 47 0c7.5 0 13.6 6.1 13.6 13.6v13.6H47zm0 6.8c7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6H13c-7.5 0-13.6-6.1-13.6-13.6 0-7.5 6.1-13.6 13.6-13.6h34zm52.8-6.8c0-7.5 6.1-13.6 13.6-13.6 7.5 0 13.6 6.1 13.6 13.6v13.6H99.8zm-6.8 0c0 7.5-6.1 13.6-13.6 13.6-7.5 0-13.6-6.1-13.6-13.6V13.6C66.8 6.1 72.9 0 80.4 0c7.5 0 13.6 6.1 13.6 13.6v20.4zm-13.6 47c7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6-7.5 0-13.6-6.1-13.6-13.6v-13.6h13.6zm0-6.8c-7.5 0-13.6-6.1-13.6-13.6 0-7.5 6.1-13.6 13.6-13.6h34c7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6h-34z" />
                  </svg>
                </div>
                Join on Slack
              </motion.a>
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span>1,200+ Operators Joined</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityCTA;
