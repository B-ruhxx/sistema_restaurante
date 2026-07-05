import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Shield, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useRoles } from '../../hooks/useRoles';
import { usePermisos } from '../../hooks/usePermisos';
import type { Permiso, Rol, RolRequest } from '../../api/roles';
import { PageWrapper, ModuleHeader, KpiCard, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

export function Roles() {
  const { roles, isLoading: rolesLoading, createRol, updateRol, deleteRol } = useRoles();
  const { permisos, isLoading: permisosLoading } = usePermisos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Rol | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
  });

  const [selectedPermisoIds, setSelectedPermisoIds] = useState<number[]>([]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    setSelectedPermisoIds([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (role: Rol) => {
    setEditingRole(role);
    setFormData({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: (role.estado || 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
    });
    setSelectedPermisoIds(role.permisos.map((p: Permiso) => p.idPermiso));
    setDialogOpen(true);
  };

  const handlePermissionToggle = (idPermiso: number) => {
    setSelectedPermisoIds((prev) =>
      prev.includes(idPermiso)
        ? prev.filter((id) => id !== idPermiso)
        : [...prev, idPermiso]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: RolRequest = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      estado: formData.estado,
      permisoIds: selectedPermisoIds,
    };

    try {
      if (editingRole) {
        await updateRol({
          id: editingRole.idRol,
          data: payload,
        });
        toast.success('Rol actualizado correctamente');
      } else {
        await createRol(payload);
        toast.success('Rol creado correctamente');
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de que desea inactivar este rol?')) {
      try {
        await deleteRol(id);
        toast.success('Rol inactivado correctamente');
      } catch (err) {
        console.error(err);
        toast.error('Error al inactivar el rol');
      }
    }
  };

  if (rolesLoading || permisosLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando roles y permisos...</p>
      </div>
    );
  }

  const activeRolesCount = roles.filter((r: Rol) => r.estado !== 'INACTIVO').length;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Roles y Permisos' },
        ]}
        icon={Shield}
        iconColor="blue"
        title="Roles y Permisos"
        subtitle="Configura el sistema de control de acceso basado en roles (RBAC) y asigna permisos específicos."
        action={
          <Button onClick={handleOpenCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Rol
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={Shield} label="Total Roles" value={roles.length} color="slate" />
        <KpiCard icon={Shield} label="Módulos de Seguridad" value={permisos.length} color="blue" />
        <KpiCard icon={Shield} label="Roles Activos" value={activeRolesCount} color="green" />
      </div>

      {/* Roles List Section */}
      {roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Sin roles definidos"
          description="Debes configurar al menos un rol para poder registrar empleados en el sistema."
          action={
            <Button onClick={handleOpenCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Rol
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Roles del Sistema"
          description="Administra perfiles de autorización y alcances dentro del ERP."
          icon={Shield}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Permisos Activos</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role: Rol) => (
                  <TableRow key={role.idRol}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="font-bold text-foreground text-sm">{role.nombre}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{role.descripcion || 'Sin descripción'}</TableCell>
                    <TableCell className="text-center">
                      {role.estado !== 'INACTIVO' ? (
                        <Badge variant="success" className="shadow-2xs font-bold">Activo</Badge>
                      ) : (
                        <Badge variant="danger" className="shadow-2xs font-bold">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold text-foreground text-xs">
                      {role.permisos.length} / {permisos.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenEdit(role)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)]"
                          onClick={() => handleDelete(role.idRol)}
                          disabled={role.estado === 'INACTIVO'}
                          title="Inactivar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* Permissions Matrix */}
      {permisos.length > 0 && roles.length > 0 && (
        <SectionCard
          title="Matriz de Permisos"
          description="Vista general del mapa cruzado de autorizaciones RBAC."
          icon={Shield}
          iconColor="blue"
        >
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Permiso / Funcionalidad</th>
                  {roles.map((role: Rol) => (
                    <th key={role.idRol} className="p-3.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">
                      {role.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permisos.map((permiso: Permiso) => (
                  <tr key={permiso.idPermiso} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div>
                        <div className="font-bold text-foreground text-sm">{permiso.nombre}</div>
                        <div className="text-xs font-semibold text-muted-foreground mt-0.5">{permiso.descripcion}</div>
                      </div>
                    </td>
                    {roles.map((role: Rol) => {
                      const hasPerm = role.permisos.some((p: Permiso) => p.idPermiso === permiso.idPermiso);
                      return (
                        <td key={role.idRol} className="p-3 text-center">
                          {hasPerm ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg ui-status-success-soft">
                              <Check className="w-3.5 h-3.5 font-black" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg ui-status-danger-soft">
                              <X className="w-3.5 h-3.5 font-black" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingRole
                ? 'Actualiza el rol, su descripción y sus permisos asignados.'
                : 'Define el nombre del rol y selecciona los accesos a módulos de negocio.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4 py-2">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="text-sm font-semibold">Nombre del Rol *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="e.g. COCINERO"
                    required
                    className="h-11 rounded-xl font-bold uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="descripcion" className="text-sm font-semibold">Descripción *</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="e.g. Despacho y preparación de pizzas"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-foreground">Permisos de Acceso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border border-border p-4 rounded-xl max-h-80 overflow-y-auto bg-muted/10">
                  {permisos.map((permiso: Permiso) => {
                    const isChecked = selectedPermisoIds.includes(permiso.idPermiso);
                    return (
                      <div key={permiso.idPermiso} className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                        <Checkbox
                          id={`perm-${permiso.idPermiso}`}
                          checked={isChecked}
                          onCheckedChange={() => handlePermissionToggle(permiso.idPermiso)}
                          className="mt-0.5"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`perm-${permiso.idPermiso}`}
                            className="text-sm font-bold text-foreground cursor-pointer"
                          >
                            {permiso.nombre}
                          </label>
                          <p className="text-xs text-muted-foreground font-semibold">
                            {permiso.descripcion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="h-10 rounded-xl font-semibold">
                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
