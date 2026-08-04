const FormInput = ({ label, error, rightElement, ...props }) => {
  const hasRightElement = Boolean(rightElement);

  return (
    <div className="mb-4">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          {...props}
          className={`
            w-full
            rounded-lg
            border
            px-3
            py-2
            text-sm
            outline-none
            transition
            focus:ring-2
            focus:ring-brand-light
            ${hasRightElement ? 'pr-20' : ''}
            ${error ? "border-red-400" : "border-gray-300"}
          `}
        />

        {hasRightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;