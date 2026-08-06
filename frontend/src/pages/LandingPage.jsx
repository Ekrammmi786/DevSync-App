import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🎯',
    title: 'Dev Score',
    desc: 'Build a measurable profile that grows as you learn, contribute, and connect.',
  },
  {
    icon: '🤝',
    title: 'Learning Buddies',
    desc: 'Get matched with developers who share your goals and interests — grow together.',
  },
  {
    icon: '💬',
    title: 'Live Chat & Calls',
    desc: 'Stay in the loop with real-time messaging and video calls with your study partners.',
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* ===== Navbar ===== */}
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-30">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2 px-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-primary">DevSync</span>
          </Link>
        </div>
        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal px-1">
            <li><a href="#features" className="font-medium">Features</a></li>
            <li><a href="#how" className="font-medium">How it works</a></li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <Link to="/login" className="btn btn-ghost">Login</Link>
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </div>

      {/* ===== Hero ===== */}
      <section className="bg-gradient-to-br from-primary to-accent text-primary-content">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <span className="badge badge-outline border-primary-content/40 text-primary-content mb-6">
            A community that ships 🚀
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            Connect with developers
            <br className="hidden sm:block" /> who share your goals
          </h1>
          <p className="text-lg sm:text-xl text-primary-content/85 max-w-2xl mx-auto mb-10">
            Track your dev score, find learning buddies, and grow together in a
            community built for collaboration.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn btn-lg btn-neutral text-lg w-full sm:w-auto">
              Get Started — it's free
            </Link>
            <Link
              to="/login"
              className="btn btn-lg btn-outline border-primary-content/50 text-primary-content hover:bg-primary-content hover:text-primary w-full sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
          <p className="text-sm text-primary-content/70 mt-6">
            Free forever for developers · No credit card required
          </p>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-base-content">
            Everything you need to stay motivated
          </h2>
          <p className="text-base-content/60 mt-3 max-w-xl mx-auto">
            DevSync turns your learning journey into a collaborative adventure.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition">
              <div className="card-body items-center text-center">
                <span className="text-4xl mb-2">{f.icon}</span>
                <h3 className="card-title text-xl">{f.title}</h3>
                <p className="text-base-content/60 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="bg-base-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-base-content">
              How it works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Create your account', desc: 'Sign up in seconds with your email and name.' },
              { step: '2', title: 'Tell us about you', desc: 'Set your coding languages, interests, and what you want to learn.' },
              { step: '3', title: 'Start connecting', desc: 'Get matched with buddies, chat, and grow your dev score.' },
            ].map((s) => (
              <div key={s.step} className="card bg-base-100 shadow-sm">
                <div className="card-body items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-content grid place-items-center font-bold text-xl">
                    {s.step}
                  </div>
                  <h3 className="card-title text-lg mt-2">{s.title}</h3>
                  <p className="text-base-content/60 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-primary text-primary-content">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to level up your learning?
          </h2>
          <p className="text-primary-content/85 mb-8">
            Join DevSync today and never code alone again.
          </p>
          <Link to="/signup" className="btn btn-lg btn-neutral text-lg">
            Start now — it's free
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="footer footer-center bg-base-100 text-base-content p-6">
        <div>
          <p className="font-bold text-primary">⚡ DevSync</p>
          <p className="text-sm">Building a community that ships since 2025.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
