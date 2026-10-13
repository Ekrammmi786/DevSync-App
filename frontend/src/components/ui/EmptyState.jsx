import { Link } from 'react-router-dom';

const EmptyState = ({ icon = '📭', title, message, actionLabel, actionTo }) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body items-center text-center py-10">
        <span className="text-5xl mb-3">{icon}</span>
        <h3 className="text-lg font-semibold text-base-content">{title}</h3>
        {message && <p className="text-sm text-base-content/60 mt-1">{message}</p>}
        {actionLabel && actionTo && (
          <Link to={actionTo} className="btn btn-primary btn-sm mt-3">
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
