import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
} from 'lucide-react';
import { useSeguridad } from '../../hooks/useSeguridad';

interface SecurityAlert {
  id: string;
  tipo: 'warning' | 'error' | 'info';
  titulo: string;
  descripcion: string;
  fecha: string;
  usuario?: string;
}

const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    tipo: 'warning',
    titulo: 'Múltiples intentos fallidos',
    descripcion: 'Se registraron intentos fallidos de inicio de sesión en corto período',
    fecha: '2026-06-18 22:15:30',
    usuario: 'root',
  },
  {
    id: '2',
    tipo: 'info',
    titulo: 'Acceso de Administrador',
    descripcion: 'Sesión iniciada correctamente desde terminal autorizada',
    fecha: '2026-06-18 08:00:15',
    usuario: 'admin',
  },
];

export function Security() {
  const { sesiones, isLoading } = useSeguridad();

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando datos de seguridad...</p>
      </div>
    );
  }

  // Active sessions: sessions without a logout timestamp
  const activeSessions = sesiones.filter((s: any) => !s.logout);
  const loginHistory = sesiones;

  const activeSessionsCount = activeSessions.length;
  const criticalAlerts = mockAlerts.filter(a => a.tipo === 'error').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Centro de Seguridad</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitorea sesiones activas, historial de accesos y alertas de seguridad
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sesiones Activas</CardDescription>
            <CardTitle className="text-3xl">{activeSessionsCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Usuarios conectados ahora</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Registros Sesión</CardDescription>
            <CardTitle className="text-3xl">{loginHistory.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Historial acumulado</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alertas Críticas</CardDescription>
            <CardTitle className="text-3xl text-red-600">{criticalAlerts}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Requieren atención</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Estado del Sistema</CardDescription>
            <CardTitle className="text-lg text-green-600 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Protegido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Monitoreo en tiempo real</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Sesiones Activas</TabsTrigger>
          <TabsTrigger value="history">Historial de Accesos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Seguridad</TabsTrigger>
        </TabsList>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sesiones Activas</CardTitle>
                <CardDescription>{activeSessions.length} sesiones en este momento</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Monitor className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">{session.usuario}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          {session.dispositivo} · {session.navegador}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {session.ubicacion} · {session.ip}
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <Clock className="w-4 h-4" />
                          Inicio: {session.inicio}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay sesiones activas.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Accesos</CardTitle>
              <CardDescription>Registro de todos los intentos de inicio de sesión</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {loginHistory.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {log.usuario.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {log.usuario}
                        </div>
                      </TableCell>
                      <TableCell>{log.inicio}</TableCell>
                      <TableCell>{log.logout || <span className="text-green-600 font-semibold">Activa</span>}</TableCell>
                      <TableCell>{log.dispositivo}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{log.ip}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Exitoso
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loginHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay historial de acceso.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Seguridad</CardTitle>
              <CardDescription>Eventos de seguridad que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.tipo)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{alert.titulo}</h3>
                        <Badge
                          variant={
                            alert.tipo === 'error'
                              ? 'destructive'
                              : alert.tipo === 'warning'
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {alert.tipo === 'error'
                            ? 'Crítico'
                            : alert.tipo === 'warning'
                            ? 'Advertencia'
                            : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.descripcion}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.fecha}
                        </div>
                        {alert.usuario && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Usuario: {alert.usuario}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
