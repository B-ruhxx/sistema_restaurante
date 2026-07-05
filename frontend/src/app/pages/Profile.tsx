import { Mail, Shield, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export function Profile() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <UserCircle className="w-6 h-6" />
          Mi perfil
        </h1>
        <p className="text-sm text-muted-foreground">Datos de la sesión autenticada y permisos asignados.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user?.nombre || 'Usuario'}</CardTitle>
          <CardDescription>{user?.rol || 'Rol no informado'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-md border p-4">
              <div className="text-muted-foreground flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                Usuario de acceso
              </div>
              <div className="font-medium">{user?.email || 'No registrado'}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-muted-foreground flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4" />
                Rol
              </div>
              <div className="font-medium">{user?.rol || 'No registrado'}</div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-2">Permisos</h2>
            <div className="flex flex-wrap gap-2">
              {(user?.permisos || []).map((permiso) => (
                <Badge key={permiso} variant="outline">{permiso}</Badge>
              ))}
              {(user?.permisos || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Sin permisos cargados.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
