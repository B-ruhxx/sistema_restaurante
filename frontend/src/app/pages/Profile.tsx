import { Mail, Shield, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export function Profile() {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-2xl border bg-card px-5 py-6 shadow-sm sm:px-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-16 h-36 w-36 rounded-full bg-muted blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm">
            <UserCircle className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Mi perfil
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Datos de la sesión autenticada y permisos asignados.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-semibold tracking-tight">
                {user?.nombre || 'Usuario'}
              </CardTitle>
              <CardDescription className="text-sm">
                Información principal de la cuenta
              </CardDescription>
            </div>

            <Badge
              variant="outline"
              className="w-fit rounded-full bg-background px-3 py-1 text-xs font-medium shadow-sm"
            >
              {user?.rol || 'Rol no informado'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-5 py-6 sm:px-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="group rounded-xl border bg-muted/10 p-5 transition-colors hover:bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Usuario de acceso
                  </p>
                  <p className="truncate text-sm font-semibold sm:text-base">
                    {user?.email || 'No registrado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border bg-muted/10 p-5 transition-colors hover:bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Rol asignado
                  </p>
                  <p className="truncate text-sm font-semibold sm:text-base">
                    {user?.rol || 'No registrado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Permisos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Accesos habilitados para esta cuenta.
              </p>
            </div>

            <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border bg-muted/10 p-4">
              {(user?.permisos || []).map((permiso) => (
                <Badge
                  key={permiso}
                  variant="outline"
                  className="rounded-lg bg-background px-3 py-1.5 text-xs font-medium shadow-sm"
                >
                  {permiso}
                </Badge>
              ))}

              {(user?.permisos || []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sin permisos cargados.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
