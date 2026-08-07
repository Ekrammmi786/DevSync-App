import PropTypes from "prop-types";

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-5xl bg-base-100 shadow-xl grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-primary text-primary-content p-10">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-3xl">⚡</span>
              <span className="text-2xl font-bold">DevSync</span>
            </div>
            <h2 className="text-3xl font-semibold leading-tight mb-3">
              Connect with developers who share your goals.
            </h2>
            <p className="base-content text-primary-content/80">
              Build your dev score, find learning buddies, and grow together in a
              community that ships.
            </p>
          </div>
          <div className="flex gap-2 text-primary-content/70 text-sm">
            <span className="badge badge-outline">Dev Score</span>
            <span className="badge badge-outline">Learning Buddies</span>
            <span className="badge badge-outline">Live Chat</span>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content">{title}</h1>
            <p className="text-sm text-base-content/60 mt-1">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-6">{footer}</div>}
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
