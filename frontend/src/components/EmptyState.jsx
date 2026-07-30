// Shared empty-state block — consistent icon + message styling everywhere
// instead of one-off <p> tags with slightly different wording/spacing.
const EmptyState = ({ icon = "○", title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
    <span className="text-3xl text-gray-300">{icon}</span>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    {subtitle && <p className="max-w-xs text-xs text-gray-400">{subtitle}</p>}
  </div>
);

export default EmptyState;
