import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
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
  Edit,
  Trash2,
  Plus,
  User,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuditoria } from '../../hooks/useAuditoria';
import type { AuditoriaLog } from '../../api/auditoria';

const getActionColor = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return 'bg-green-500 text-white';
    case 'UPDATE':
      return 'bg-blue-500 text-white';
    case 'DELETE':
      return 'bg-red-500 text-white';
    case 'VIEW':
    case 'READ':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getActionIcon = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return <Plus className="w-3 h-3" />;
    case 'UPDATE':
      return <Edit className="w-3 h-3" />;
    case 'DELETE':
      return <Trash2 className="w-3 h-3" />;
    case 'VIEW':
    case 'READ':
      return <Eye className="w-3 h-3" />;
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

export function Audit() {
  const { logs, isLoading, isError, refetch } = useAuditoria();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [viewingLog, setViewingLog] = useState<AuditoriaLog | null>(null);

  const uniqueTables = useMemo(
    () => Array.from(new Set(logs.map((l: AuditoriaLog) => l.tablaAfectada).filter(Boolean))),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log: AuditoriaLog) => {
      const searchStr = `${log.nombreEmpleado || ''} ${log.tablaAfectada || ''} ${log.accion || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesAction =
        actionFilter === 'all' || log.accion?.toUpperCase() === actionFilter.toUpperCase();
      const matchesTable = tableFilter === 'all' || log.tablaAfectada === tableFilter;
      return matchesSearch && matchesAction && matchesTable;
    });
  }, [logs, searchTerm, actionFilter, tableFilter]);

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
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte exportado');
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando registros de auditoría...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">Error al cargar los registros de auditoría.</p>
        <Button variant="outline" onClick={() => refetch()}>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Auditoría del Sistema</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Registro completo de todas las acciones realizadas en el sistema
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Eventos</CardDescription>
            <CardTitle className="text-3xl">{logs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Registros en el historial</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Creaciones</CardDescription>
            <CardTitle className="text-3xl text-green-600">{createCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Registros nuevos</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Modificaciones</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{updateCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Cambios realizados</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Eliminaciones</CardDescription>
            <CardTitle className="text-3xl text-red-600">{deleteCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Registros borrados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empleado, tabla o acción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="CREATE">Creaciones</SelectItem>
                  <SelectItem value="UPDATE">Actualizaciones</SelectItem>
                  <SelectItem value="DELETE">Eliminaciones</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tablas</SelectItem>
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Eventos</CardTitle>
          <CardDescription>{filteredLogs.length} eventos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron registros de auditoría.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log: AuditoriaLog, idx: number) => (
                <div key={log.idAuditoria} className="relative">
                  {idx !== filteredLogs.length - 1 && (
                    <div className="absolute left-[21px] top-10 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-full ${getActionColor(log.accion)} flex items-center justify-center flex-shrink-0 relative z-10`}
                    >
                      {getActionIcon(log.accion)}
                    </div>
                    <div className="flex-1 bg-muted/50 border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {(log.nombreEmpleado || 'SIS')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {log.nombreEmpleado || 'Sistema'}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.fechaEvento)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(log.accion)}>
                            {log.accion}
                          </Badge>
                          {log.tablaAfectada && (
                            <Badge variant="secondary">{log.tablaAfectada}</Badge>
                          )}
                          {log.idRegistro && (
                            <Badge variant="outline" className="text-xs">
                              #{log.idRegistro}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          ID Empleado: {log.idEmpleado || 'N/A'}
                        </div>
                        {(log.datosAnteriores || log.datosNuevos) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setViewingLog(log)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver detalles
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {viewingLog && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingLog(null)}
        >
          <div
            className="bg-background rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Detalles del Evento #{viewingLog.idAuditoria}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Empleado</Label>
                  <div className="font-medium">{viewingLog.nombreEmpleado || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Acción</Label>
                  <div>
                    <Badge className={getActionColor(viewingLog.accion)}>
                      {viewingLog.accion}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tabla Afectada</Label>
                  <div className="font-medium">{viewingLog.tablaAfectada || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID Registro</Label>
                  <div className="font-medium">{viewingLog.idRegistro || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Fecha y Hora</Label>
                  <div className="font-medium">{formatDate(viewingLog.fechaEvento)}</div>
                </div>
              </div>

              {viewingLog.datosAnteriores && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Datos Anteriores</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                    {safeParseJson(viewingLog.datosAnteriores)}
                  </pre>
                </div>
              )}

              {viewingLog.datosNuevos && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Datos Nuevos</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                    {safeParseJson(viewingLog.datosNuevos)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button onClick={() => setViewingLog(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
