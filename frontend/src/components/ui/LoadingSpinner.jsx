const LoadingSpinner = ({ text = 'Loading...', size = 'lg', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <span className={`loading loading-spinner loading-${size} text-primary`}></span>
      {text && <p className="text-sm font-medium text-base-content/70">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
