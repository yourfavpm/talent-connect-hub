import { motion } from "framer-motion";

const CommunityCTA = () => {
  return (
    <section className="py-24 px-6 bg-white font-inter border-t border-slate-100">
      <div className="container max-w-[1200px] mx-auto">
        <div className="bg-slate-900 rounded-[32px] p-8 md:p-16 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">
                Talent Network
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold text-white mb-6 leading-tight tracking-tight">
                Join our Global <br className="hidden md:block" /> Talent Community
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed font-medium mb-0">
                Connect with high-impact operations leaders, share tactical insights, and stay ahead of the curve with our vetted Slack community.
              </p>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-6 shrink-0">
              <motion.a
                href="https://join.slack.com/t/taskive/shared_invite/zt-3un5ge6yc-2gnqUuov5bdYMgysrObquQ"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#2b53e3] text-white font-bold rounded-2xl hover:bg-[#3b63f3] transition-all shadow-xl shadow-blue-900/40"
              >
                <div className="bg-white p-1 rounded-md">
                  <svg className="w-4 h-4 text-[#2b53e3]" viewBox="0 0 127 127" fill="currentColor">
                    <path d="M27.2 80c0 7.5-6.1 13.6-13.6 13.6C6.1 93.6 0 87.5 0 80c0-7.5 6.1-13.6 13.6-13.6h13.6v13.6zm6.8 0c0-7.5 6.1-13.6 13.6-13.6 7.5 0 13.6 6.1 13.6 13.6v34c0 7.5-6.1 13.6-13.6 13.6-7.5 0-13.6-6.1-13.6-13.6v-34zM47 27.2c-7.5 0-13.6-6.1-13.6-13.6C33.4 6.1 39.5 0 47 0c7.5 0 13.6 6.1 13.6 13.6v13.6H47zm0 6.8c7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6H13c-7.5 0-13.6-6.1-13.6-13.6 0-7.5 6.1-13.6 13.6-13.6h34zm52.8-6.8c0-7.5 6.1-13.6 13.6-13.6 7.5 0 13.6 6.1 13.6 13.6v13.6H99.8zm-6.8 0c0 7.5-6.1 13.6-13.6 13.6-7.5 0-13.6-6.1-13.6-13.6V13.6C66.8 6.1 72.9 0 80.4 0c7.5 0 13.6 6.1 13.6 13.6v20.4zm-13.6 47c7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6-7.5 0-13.6-6.1-13.6-13.6v-13.6h13.6zm0-6.8c-7.5 0-13.6-6.1-13.6-13.6 0-7.5 6.1-13.6 13.6-13.6h34c7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6h-34z" />
                  </svg>
                </div>
                Join on Slack
              </motion.a>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <span>Professionals already joined</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityCTA;
