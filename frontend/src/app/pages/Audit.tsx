import { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Pencil,
  Trash2,
  Plus,
  User,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useAuditoria } from '../../hooks/useAuditoria';
import type { AuditoriaLog } from '../../api/auditoria';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const getActionColor = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return 'ui-status-success-soft';
    case 'UPDATE':
      return 'ui-status-info-soft';
    case 'DELETE':
      return 'ui-status-danger-soft';
    case 'VIEW':
    case 'READ':
      return 'ui-surface-subtle';
    default:
      return 'ui-surface-subtle';
  }
};

const getActionBadgeVariant = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return 'success' as const;
    case 'UPDATE':
      return 'info' as const;
    case 'DELETE':
      return 'danger' as const;
    case 'VIEW':
    case 'READ':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

const getActionIcon = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return <Plus className="w-4 h-4" />;
    case 'UPDATE':
      return <Pencil className="w-3.5 h-3.5" />;
    case 'DELETE':
      return <Trash2 className="w-3.5 h-3.5" />;
    case 'VIEW':
    case 'READ':
      return <Eye className="w-3.5 h-3.5" />;
    default:
      return null;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').slice(0, 19);
};

const safeParseJson = (str?: string) => {
  if (!str) return null;
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
};

const escapeCsvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function Audit() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [viewingLog, setViewingLog] = useState<AuditoriaLog | null>(null);
  const { logs, allLogs, isLoading, isError, refetch } = useAuditoria({
    tabla: tableFilter === 'all' ? undefined : tableFilter,
  });

  const uniqueTables = useMemo(
    () => Array.from(new Set(allLogs.map((l: AuditoriaLog) => l.tablaAfectada).filter(Boolean))),
    [allLogs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log: AuditoriaLog) => {
      const searchStr = `${log.nombreEmpleado || ''} ${log.tablaAfectada || ''} ${log.accion || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesAction =
        actionFilter === 'all' || log.accion?.toUpperCase() === actionFilter.toUpperCase();
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const handleExport = () => {
    const csv = [
      ['ID', 'Empleado', 'Tabla', 'Accion', 'Registro', 'Fecha'],
      ...filteredLogs.map((l: AuditoriaLog) => [
        l.idAuditoria,
        l.nombreEmpleado || '',
        l.tablaAfectada || '',
        l.accion || '',
        l.idRegistro || '',
        formatDate(l.fechaEvento),
      ]),
    ]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte exportado correctamente');
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando registros de auditoría...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-destructive">Error al cargar los registros de auditoría.</p>
        <Button variant="outline" onClick={() => refetch()} className="h-10 rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const createCount = logs.filter(
    (l: AuditoriaLog) => l.accion?.toUpperCase() === 'CREATE' || l.accion?.toUpperCase() === 'INSERT'
  ).length;
  const updateCount = logs.filter((l: AuditoriaLog) => l.accion?.toUpperCase() === 'UPDATE').length;
  const deleteCount = logs.filter((l: AuditoriaLog) => l.accion?.toUpperCase() === 'DELETE').length;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Auditoría' },
        ]}
        icon={History}
        iconColor="blue"
        title="Auditoría del Sistema"
        subtitle="Bitácora e historial de cambios y transacciones críticas realizados en el sistema."
        action={
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => refetch()} className="h-11 rounded-xl gap-2 font-semibold">
              <RefreshCw className="w-4 h-4 text-muted-foreground" /> Actualizar
            </Button>
            <Button variant="outline" onClick={handleExport} className="h-11 rounded-xl gap-2 font-semibold border-primary/20 text-primary hover:bg-primary/5">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={History} label="Total Eventos" value={logs.length} color="slate" />
        <KpiCard icon={Plus} label="Creaciones" value={createCount} color="green" />
        <KpiCard icon={Pencil} label="Modificaciones" value={updateCount} color="blue" />
        <KpiCard icon={Trash2} label="Eliminaciones" value={deleteCount} color="red" />
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Buscar por empleado, tabla o acción...',
        }}
        filters={
          <>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-44 h-11 rounded-xl">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Acciones" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todas las acciones</SelectItem>
                <SelectItem value="CREATE" className="rounded-lg">Creaciones</SelectItem>
                <SelectItem value="UPDATE" className="rounded-lg">Actualizaciones</SelectItem>
                <SelectItem value="DELETE" className="rounded-lg">Eliminaciones</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-44 h-11 rounded-xl">
                <SelectValue placeholder="Todas las tablas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todas las tablas</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table} className="rounded-lg">
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Timeline Event Feed */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin logs de auditoría"
          description="No se encontraron registros de eventos para los filtros ingresados."
        />
      ) : (
        <SectionCard
          title="Bitácora de Cambios"
          description={`Visualizando ${filteredLogs.length} eventos en orden cronológico.`}
          icon={History}
          iconColor="blue"
        >
          <div className="space-y-4">
            {filteredLogs.map((log: AuditoriaLog, idx: number) => (
              <div key={log.idAuditoria} className="relative">
                {idx !== filteredLogs.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border/40" />
                )}
                <div className="flex gap-4">
                  <div
                    className={cn(
                      'relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-transparent shadow-xs',
                      getActionColor(log.accion)
                    )}
                  >
                    {getActionIcon(log.accion)}
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card p-4 hover:border-primary/20 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-border">
                          <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                            {(log.nombreEmpleado || 'SIS')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground text-xs">
                            {log.nombreEmpleado || 'Sistema'}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground/80" />
                            {formatDate(log.fechaEvento)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={getActionBadgeVariant(log.accion)} className="text-[9px] font-bold shadow-3xs h-5 px-2">
                          {log.accion}
                        </Badge>
                        {log.tablaAfectada && (
                          <Badge variant="secondary" className="text-[9px] font-bold h-5 px-2 bg-muted/65 text-muted-foreground">{log.tablaAfectada}</Badge>
                        )}
                        {log.idRegistro && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-lg font-mono">
                            ID: {log.idRegistro}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground/75" />
                        ID Empleado: {log.idEmpleado || 'Sistema'}
                      </div>
                      {(log.datosAnteriores || log.datosNuevos) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] rounded-lg font-bold gap-1 text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={() => setViewingLog(log)}
                        >
                          <Eye className="w-3 h-3" />
                          Inspeccionar Cambios
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* JSON Viewer Dialog */}
      <Dialog open={Boolean(viewingLog)} onOpenChange={(open) => !open && setViewingLog(null)}>
        {viewingLog && (
          <DialogContent className="max-w-4xl rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Detalles del Evento #{viewingLog.idAuditoria}</DialogTitle>
              <DialogDescription className="text-xs">
                Auditoría técnica de los datos modificados.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 p-4 rounded-xl border border-border bg-muted/10 text-xs font-semibold">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Usuario</p>
                  <p className="font-bold text-foreground mt-0.5">{viewingLog.nombreEmpleado || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Acción</p>
                  <div className="mt-1">
                    <Badge variant={getActionBadgeVariant(viewingLog.accion)} className="text-[9px] font-bold">
                      {viewingLog.accion}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Entidad</p>
                  <p className="font-bold text-foreground mt-0.5">{viewingLog.tablaAfectada || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Registro ID</p>
                  <p className="font-bold text-foreground mt-0.5 font-mono">{viewingLog.idRegistro || 'N/A'}</p>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Fecha Evento</p>
                  <p className="font-bold text-foreground mt-0.5 font-mono">{formatDate(viewingLog.fechaEvento)}</p>
                </div>
              </div>

              {viewingLog.datosAnteriores && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Datos Anteriores (Estado previo)</Label>
                  <pre className="overflow-auto rounded-xl border border-border bg-muted/30 p-4 text-xs font-mono font-bold leading-relaxed text-foreground max-h-56">
                    {safeParseJson(viewingLog.datosAnteriores)}
                  </pre>
                </div>
              )}

              {viewingLog.datosNuevos && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Datos Nuevos (Estado actual)</Label>
                  <pre className="overflow-auto rounded-xl border border-border bg-muted/30 p-4 text-xs font-mono font-bold leading-relaxed text-foreground max-h-56">
                    {safeParseJson(viewingLog.datosNuevos)}
                  </pre>
                </div>
              )}
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-border/40">
              <Button onClick={() => setViewingLog(null)} className="h-10 rounded-xl font-semibold">Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </PageWrapper>
  );
}
