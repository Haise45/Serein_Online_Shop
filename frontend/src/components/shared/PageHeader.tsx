"use client";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 border-b border-gray-300 pb-5 sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl leading-7 font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="mt-4 flex sm:mt-0 sm:ml-4">{actions}</div>}
    </div>
  );
}
