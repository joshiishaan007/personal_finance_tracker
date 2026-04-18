interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4" aria-hidden>{icon}</span>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
