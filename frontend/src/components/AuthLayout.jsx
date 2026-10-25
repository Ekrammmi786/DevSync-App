import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import CosmicBackground from "./layout/CosmicBackground";

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center p-4 relative overflow-hidden">
      <CosmicBackground />

      <div className="relative z-10 w-full max-w-4xl bg-base-100/85 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rounded-3xl grid md:grid-cols-2 overflow-hidden">
        {/* Left branding panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-950/90 border-r border-white/10 relative">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
              <span className="text-3xl transition-transform duration-300 group-hover:scale-110">⚡</span>
              <span className="text-2xl font-black bg-gradient-to-r from-amber-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                DevSync
              </span>
            </Link>
            <h2 className="text-3xl font-extrabold leading-tight mb-4 text-white">
              Connect with developers who share your goals.
            </h2>
            <p className="text-base-content/75 text-sm leading-relaxed">
              Build your DevScore, find learning buddies, and ship code together in a
              vibrant 3D developer universe.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 text-xs">
            <span className="badge badge-outline border-amber-400/40 text-amber-300 bg-amber-400/5 px-3 py-2">
              ✦ DevScore
            </span>
            <span className="badge badge-outline border-purple-400/40 text-purple-300 bg-purple-400/5 px-3 py-2">
              ✦ Learning Buddies
            </span>
            <span className="badge badge-outline border-cyan-400/40 text-cyan-300 bg-cyan-400/5 px-3 py-2">
              ✦ HD Video Calls
            </span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
            <p className="text-sm text-base-content/70 mt-1">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-6 border-t border-white/5 pt-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

AuthLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

export default AuthLayout;
