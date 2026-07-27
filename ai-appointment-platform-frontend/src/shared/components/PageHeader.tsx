import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, action, children }: PageHeaderProps) => (
  <div className="card-modern overflow-hidden">
    <div className="p-5 md:p-6 border-b border-border">
      <div
        className={
          action
            ? 'flex flex-col md:flex-row justify-between items-start md:items-center gap-3'
            : undefined
        }
      >
        <div>
          <h2 className="text-lg font-bold text-txt">{title}</h2>
          {subtitle && <p className="text-sm text-txt-muted mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
    {children}
  </div>
);
