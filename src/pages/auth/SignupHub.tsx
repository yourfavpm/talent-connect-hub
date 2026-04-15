import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const SignupHub = () => {
  const navigate = useNavigate();
  const [hoveredOption, setHoveredOption] = useState<"talent" | "client" | null>(null);

  const handleTalentSignup = () => {
    navigate("/auth/signup/talent");
  };

  const handleClientSignup = () => {
    navigate("/auth/signup/client");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8 md:mb-12">
            <Logo variant="light" showText={false} imgHeight="h-32 md:h-56" />
        </div>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 md:mb-16"
        >
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Get Started with OPSlyHR
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Choose your signup path and join thousands of professionals and companies
          </p>
        </motion.div>

        {/* Signup Options Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 mb-12">
          {/* Talent Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleTalentSignup}
            onMouseEnter={() => setHoveredOption("talent")}
            onMouseLeave={() => setHoveredOption(null)}
            className="group relative block text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
            <div className="relative bg-white rounded-3xl p-6 md:p-12 shadow-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                </div>
                <ArrowRight
                  className={`w-6 h-6 text-slate-300 transition-all duration-300 ${
                    hoveredOption === "talent"
                      ? "translate-x-1 text-blue-600"
                      : ""
                  }`}
                />
              </div>

              <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-2">
                For Professionals
              </h2>

              <p className="text-slate-600 mb-4 text-sm md:text-base leading-relaxed">
                Join our talent network and access global remote work opportunities with competitive compensation.
              </p>

              <div className="hidden sm:block space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">
                    Global job opportunities
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">
                    Flexible employment options
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">
                    Professional development
                  </span>
                </div>
              </div>

              <div className="text-sm font-semibold text-blue-600">
                Sign Up as Talent →
              </div>
            </div>
          </motion.button>

          {/* Client Option */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleClientSignup}
            onMouseEnter={() => setHoveredOption("client")}
            onMouseLeave={() => setHoveredOption(null)}
            className="group relative block text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
            <div className="relative bg-white rounded-3xl p-6 md:p-12 shadow-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                </div>
                <ArrowRight
                  className={`w-6 h-6 text-slate-300 transition-all duration-300 ${
                    hoveredOption === "client"
                      ? "translate-x-1 text-emerald-600"
                      : ""
                  }`}
                />
              </div>

              <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-2">
                For Companies
              </h2>

              <p className="text-slate-600 mb-4 text-sm md:text-base leading-relaxed">
                Build your global team with vetted professionals. Scale fast with flexible hiring models.
              </p>

              <div className="hidden sm:block space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">
                    Vetted talent pool
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">
                    Multiple hiring models
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">
                    Dedicated HR support
                  </span>
                </div>
              </div>

              <div className="text-sm font-semibold text-emerald-600">
                Sign Up as Company →
              </div>
            </div>
          </motion.button>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-slate-400 mb-4">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/auth/login")}
              className="font-semibold text-white hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>
          </p>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} OPSlyHR. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupHub;
