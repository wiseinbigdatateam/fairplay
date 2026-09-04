import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && (
        <Link to={action.to} className="btn btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function LoadingState({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      {label}
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="error-state" role="alert">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export function StatGrid({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <span className="stat-label">{item.label}</span>
          <strong className="stat-value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Section({ label, title, children }: { label?: string; title: string; children: ReactNode }) {
  return (
    <section className="section">
      {label && <p className="section-label">{label}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  );
}
