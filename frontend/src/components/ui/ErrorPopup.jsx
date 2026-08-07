const ErrorPopup = ({ open, title, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-base-100 p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-4xl text-error">
          <i className="fa-solid fa-circle-exclamation" />
        </div>
        <h3 className="text-lg font-bold text-base-content">{title}</h3>
        <p className="mt-2 text-sm text-base-content/70">{message}</p>
        <button type="button" onClick={onClose} className="mt-6 btn btn-error btn-block">
          Try Again
        </button>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-base-content/50 hover:text-base-content"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  );
};

export default ErrorPopup;
