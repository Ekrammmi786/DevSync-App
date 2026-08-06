import PropTypes from "prop-types";

const FormField = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  icon,
  rightSlot,
  autoComplete,
}) => {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text font-medium text-base-content">{label}</span>
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`input input-bordered w-full ${icon ? "pl-10" : ""} ${
            rightSlot ? "pr-12" : ""
          } ${error ? "input-error" : ""}`}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      )}
    </label>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  icon: PropTypes.node,
  rightSlot: PropTypes.node,
  autoComplete: PropTypes.string,
};

export default FormField;
