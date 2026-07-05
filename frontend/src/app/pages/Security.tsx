import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Lock,
  Monitor,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  LogOut,
} from 'lucide-react';
import { useSeguridad } from '../../hooks/useSeguridad';
import type { SecurityAlert, SecuritySession } from '../../api/seguridad';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { PageWrapper, ModuleHeader, KpiCard, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const getSessionId = (session: SecuritySession) =>
  String(session.id ?? `${session.usuario ?? 'session'}-${session.inicio ?? ''}`);

const getSessionUser = (session: SecuritySession) =>
  session.usuario ?? 'Usuario';

const getSessionStart = (session: SecuritySession) =>
  session.inicio ?? 'Sin registro';

const getSessionEnd = (session: SecuritySession) =>
  session.logout ?? '';

const isPersistedAlert = (alert: SecurityAlert) => /^\d+$/.test(alert.id);

const getAlertBadgeVariant = (tipo: string) => {
  switch (tipo) {
    case 'error':
      return 'danger' as const;
    case 'warning':
      return 'warning' as const;
    case 'info':
      return 'info' as const;
    default:
      return 'secondary' as const;
  }
};

export function Security() {
  const { sesiones, alertas, isLoading, resolverAlerta, cerrarSesion, isResolvingAlert, isClosingSession } = useSeguridad();

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'error':
        return <XCircle className="w-5 h-5 ui-status-danger" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 ui-status-warning" />;
      case 'info':
        return <Shield className="w-5 h-5 ui-status-info" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando datos de seguridad...</p>
      </div>
    );
  }

  const loginHistory = sesiones;
  const activeSessions = loginHistory.filter((session) => !getSessionEnd(session));

  const activeSessionsCount = activeSessions.length;
  const criticalAlerts = alertas.filter(a => a.tipo === 'error').length;
  const warningAlerts = alertas.filter(a => a.tipo === 'warning').length;
  const systemState = criticalAlerts > 0 ? 'Crítico' : warningAlerts > 0 ? 'Atención' : 'Estable';
  const systemStateClass = criticalAlerts > 0 ? 'ui-status-danger' : warningAlerts > 0 ? 'ui-status-warning' : 'ui-status-success';
  const systemStateSurfaceClass = criticalAlerts > 0 ? 'ui-status-danger-soft' : warningAlerts > 0 ? 'ui-status-warning-soft' : 'ui-status-success-soft';
  const SystemIcon = criticalAlerts > 0 ? XCircle : warningAlerts > 0 ? AlertTriangle : CheckCircle2;

  const handleCerrarSesion = async (session: SecuritySession) => {
    if (!window.confirm(`¿Cerrar la sesión de ${getSessionUser(session)}?`)) return;
    await cerrarSesion(getSessionId(session));
    toast.success('Sesión cerrada correctamente');
  };

  const handleResolverAlerta = async (id: string) => {
    if (!/^\d+$/.test(id)) {
      toast.warning('Esta alerta es calculada y se resolverá cuando desaparezca la condición que la origina');
      return;
    }
    await resolverAlerta(id);
    toast.success('Alerta resuelta correctamente');
  };

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Centro de Seguridad' },
        ]}
        icon={Lock}
        iconColor="blue"
        title="Centro de Seguridad"
        subtitle="Monitoreo en tiempo real de sesiones de usuario activas, historial de accesos y alertas de seguridad."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={Monitor} label="Sesiones Activas" value={activeSessionsCount} color="blue" />
        <KpiCard icon={Clock} label="Total Registros" value={loginHistory.length} color="slate" />
        <KpiCard icon={AlertTriangle} label="Alertas Críticas" value={criticalAlerts} color="red" />
        <div className="rounded-2xl border border-border p-5 bg-card shadow-sm flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            systemStateSurfaceClass
          )}>
            <SystemIcon className={cn('w-5 h-5', systemStateClass)} />
          </div>
          <div>
            <p className={cn('text-lg font-black leading-none', systemStateClass)}>{systemState}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Estado de Seguridad</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-11 bg-muted/40 p-1 rounded-xl">
          <TabsTrigger value="sessions" className="rounded-lg text-xs font-bold transition-all">Sesiones Activas</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-bold transition-all">Historial de Accesos</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg text-xs font-bold transition-all">Alertas de Seguridad</TabsTrigger>
        </TabsList>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <SectionCard
            title="Sesiones de Usuario Activas"
            description={`Hay ${activeSessions.length} terminales con sesión abierta en este momento.`}
            icon={Monitor}
            iconColor="blue"
          >
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={getSessionId(session)}
                  className="flex items-start gap-4 p-4.5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/5">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div className="font-bold text-sm text-foreground">{getSessionUser(session)}</div>
                      <Badge variant="outline" className="text-[9px] font-bold bg-muted/50 border border-border/80 h-5 px-2">Caja / Terminal</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground/80 flex-shrink-0" />
                        {session.dispositivo ?? 'Dispositivo'} · {session.navegador ?? 'Navegador'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/80 flex-shrink-0" />
                        {session.ubicacion ?? 'Ubicación'} · <span className="font-mono">{session.ip ?? 'IP no registrada'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:col-span-2 font-mono mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/80 flex-shrink-0 font-sans" />
                        Inicio: {getSessionStart(session)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isClosingSession}
                    onClick={() => handleCerrarSesion(session)}
                    className="h-9 rounded-xl text-xs gap-1.5 border-[var(--status-danger)]/20 ui-status-danger hover:bg-[var(--status-danger-surface)] hover:border-[var(--status-danger)]/30 flex-shrink-0 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                  </Button>
                </div>
              ))}
              {activeSessions.length === 0 && (
                <div className="text-center py-10 border border-dashed rounded-2xl text-xs font-semibold text-muted-foreground">
                  No hay sesiones activas registradas.
                </div>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="history" className="space-y-4">
          <SectionCard
            title="Historial de Accesos"
            description="Historial acumulado de logins validados e ingresos registrados por el backend."
            icon={Clock}
            iconColor="slate"
          >
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Inicio Sesión</TableHead>
                    <TableHead>Cierre Sesión</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((log) => (
                    <TableRow key={getSessionId(log)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7 border border-border shadow-3xs">
                            <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
                              {getSessionUser(log).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-foreground text-xs">{getSessionUser(log)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">{getSessionStart(log)}</TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">
                        {getSessionEnd(log) || <span className="font-bold ui-status-success-soft px-2 py-0.5 rounded-lg border border-[var(--status-success)]/20">Activa</span>}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{log.dispositivo ?? 'No registrado'}</TableCell>
                      <TableCell>
                        <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono font-bold text-foreground">{log.ip ?? 'N/A'}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="shadow-3xs text-[9px] font-bold">
                          <CheckCircle2 className="mr-1 w-3 h-3" />
                          Registrada
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loginHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-xs font-semibold text-muted-foreground">
                        No hay historial de acceso registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <SectionCard
            title="Alertas de Seguridad"
            description="Eventos de auditoría de seguridad que requieren atención y revisión del administrador."
            icon={AlertTriangle}
            iconColor="red"
          >
            <div className="space-y-3">
              {alertas.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4.5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all shadow-xs"
                >
                  <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                      <h3 className="font-bold text-sm text-foreground">{alert.titulo}</h3>
                      <Badge
                        variant={getAlertBadgeVariant(alert.tipo)}
                        className="text-[9px] font-bold shadow-3xs"
                      >
                        {alert.tipo === 'error'
                          ? 'Crítico'
                          : alert.tipo === 'warning'
                          ? 'Advertencia'
                          : 'Info'}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2.5 leading-relaxed">{alert.descripcion}</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/80 font-sans" />
                        {alert.fecha}
                      </div>
                      {alert.usuario && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground/80" />
                          Usuario: {alert.usuario}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground/80" />
                        {isPersistedAlert(alert) ? 'Persistida' : 'Calculada'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isResolvingAlert || !isPersistedAlert(alert)}
                    onClick={() => handleResolverAlerta(alert.id)}
                    className="h-9 rounded-xl text-xs flex-shrink-0 font-bold border-border"
                    title={isPersistedAlert(alert) ? 'Resolver alerta persistida' : 'La alerta se cerrará automáticamente al solventarse el desencadenador'}
                  >
                    {isPersistedAlert(alert) ? 'Resolver' : 'Condición viva'}
                  </Button>
                </div>
              ))}
              {alertas.length === 0 && (
                <div className="text-center py-10 border border-dashed rounded-2xl text-xs font-semibold text-muted-foreground">
                  No hay alertas de seguridad pendientes.
                </div>
              )}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
