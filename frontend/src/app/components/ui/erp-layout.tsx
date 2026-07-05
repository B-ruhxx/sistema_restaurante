import React from 'react';
import { Link } from 'react-router';
import { ChevronRight, Search, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { cn } from './utils';

// Color map for semantic circles and backgrounds
const colorMap = {
  blue: {
    bg: 'ui-status-info-soft',
    border: 'border-[var(--status-info)]/20',
    primary: 'ui-status-info-bg',
  },
  green: {
    bg: 'ui-status-success-soft',
    border: 'border-[var(--status-success)]/20',
    primary: 'ui-status-success-bg',
  },
  amber: {
    bg: 'ui-status-warning-soft',
    border: 'border-[var(--status-warning)]/20',
    primary: 'ui-status-warning-bg',
  },
  red: {
    bg: 'ui-status-danger-soft',
    border: 'border-[var(--status-danger)]/20',
    primary: 'ui-status-danger-bg',
  },
  violet: {
    bg: 'ui-status-info-soft',
    border: 'border-[var(--status-info)]/20',
    primary: 'ui-status-info-bg',
  },
  slate: {
    bg: 'ui-surface-subtle',
    border: 'border-border',
    primary: 'bg-muted text-foreground',
  },
};

export type SemanticColor = keyof typeof colorMap;

/* 1. PageWrapper */
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn('p-6 space-y-8 max-w-7xl mx-auto w-full', className)}>
      {children}
    </div>
  );
}

/* 2. ModuleHeader */
interface BreadcrumbItem {
  label: string;
  path?: string;
}
interface ModuleHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  icon?: LucideIcon;
  iconColor?: SemanticColor;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}
export function ModuleHeader({
  breadcrumbs,
  icon: Icon,
  iconColor = 'blue',
  title,
  subtitle,
  action,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        {/* Breadcrumb Contextual */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              {b.path ? (
                <Link to={b.path} className="hover:text-foreground transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className={cn(i === breadcrumbs.length - 1 && 'text-foreground font-medium')}>
                  {b.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Title row */}
        <div className="flex items-center gap-3.5 mt-1.5">
          {Icon && (
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border', colorMap[iconColor].bg, colorMap[iconColor].border)}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>
          </div>
        </div>
      </div>

      {action && <div className="flex items-center gap-2 self-end md:self-center">{action}</div>}
    </div>
  );
}

/* 3. KpiCard */
interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  aux?: string;
  color?: SemanticColor;
}
export function KpiCard({
  icon: Icon,
  label,
  value,
  aux,
  color = 'slate',
}: KpiCardProps) {
  return (
    <Card className="border border-border bg-card text-card-foreground shadow-sm rounded-2xl">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner', colorMap[color].bg)}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight ui-tabular">{value}</p>
          {aux && <p className="text-xs text-muted-foreground mt-1 font-medium">{aux}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* 4. FilterToolbar */
interface SearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
interface FilterToolbarProps {
  search?: SearchProps;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}
export function FilterToolbar({ search, filters, actions }: FilterToolbarProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3.5 shadow-sm">
      {search && (
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || 'Buscar...'}
            className="pl-10 h-11 border-border bg-background/50 focus:bg-background rounded-xl text-sm"
          />
        </div>
      )}

      {filters && (
        <div className="flex flex-wrap items-center gap-3">
          {filters}
        </div>
      )}

      {actions && (
        <div className="flex items-center gap-2.5 ml-auto self-end md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}

/* 5. EmptyState */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/10 rounded-2xl border border-dashed border-border/80">
      <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground shadow-sm mb-4 border border-border/40">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mt-1.5 leading-normal">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* 6. SectionCard */
interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: SemanticColor;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
export function SectionCard({
  title,
  description,
  icon: Icon,
  iconColor = 'blue',
  footer,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn('border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden', className)}>
      <CardHeader className="border-b border-border/60 bg-muted/15 px-6 py-4 flex flex-row items-center gap-3">
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border', colorMap[iconColor].bg, colorMap[iconColor].border)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1">
          <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
          {description && <CardDescription className="text-xs text-muted-foreground mt-0.5">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
      {footer && (
        <div className="px-6 py-4 border-t border-border/60 bg-muted/10">
          {footer}
        </div>
      )}
    </Card>
  );
}
