import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { Shield, Plus, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoles } from '../../hooks/useRoles';
import { usePermisos } from '../../hooks/usePermisos';

export function Roles() {
  const { roles, isLoading: rolesLoading, createRol, updateRol, deleteRol } = useRoles();
  const { permisos, isLoading: permisosLoading } = usePermisos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  
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

  const handleOpenEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: (role.estado || 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
    });
    setSelectedPermisoIds(role.permisos.map((p: any) => p.idPermiso));
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

    const payload = {
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Ocurrió un error al guardar');
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
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando roles y permisos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Roles y Permisos</h1>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Rol
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Sistema RBAC - Control de acceso basado en roles
        </p>
      </div>

      {/* Roles Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Roles</CardDescription>
            <CardTitle className="text-3xl">{roles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">En el sistema</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Módulos de Seguridad</CardDescription>
            <CardTitle className="text-3xl">{permisos.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Permisos individuales de negocio</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Roles Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {roles.filter((r: any) => r.estado !== 'INACTIVO').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Listos para asignar</div>
          </CardContent>
        </Card>
      </div>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>Gestiona roles y sus permisos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Permisos Activos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role: any) => (
                <TableRow key={role.idRol}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div className="font-semibold">{role.nombre}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{role.descripcion || 'Sin descripción'}</TableCell>
                  <TableCell className="text-center">
                    {role.estado !== 'INACTIVO' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">
                      {role.permisos.length} / {permisos.length}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(role.idRol)}
                        disabled={role.estado === 'INACTIVO'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permisos</CardTitle>
          <CardDescription>Vista general de permisos por rol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Permiso / Funcionalidad</th>
                  {roles.map((role: any) => (
                    <th key={role.idRol} className="p-3 text-center font-semibold min-w-[120px]">
                      {role.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permisos.map((permiso: any) => (
                  <tr key={permiso.idPermiso} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-sm">{permiso.nombre}</div>
                        <div className="text-xs text-muted-foreground">{permiso.descripcion}</div>
                      </div>
                    </td>
                    {roles.map((role: any) => {
                      const hasPerm = role.permisos.some((p: any) => p.idPermiso === permiso.idPermiso);
                      return (
                        <td key={role.idRol} className="p-3 text-center">
                          {hasPerm ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600">
                              <Check className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-500">
                              <X className="w-4 h-4" />
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Actualiza el rol y sus permisos'
                : 'Define el nuevo rol y asigna permisos'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Rol *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="e.g. COCINERO"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="e.g. Despacho y preparación de pizzas"
                    required
                  />
                </div>
              </div>

              {/* Permissions Checklist */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Permisos Disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                  {permisos.map((permiso: any) => {
                    const isChecked = selectedPermisoIds.includes(permiso.idPermiso);
                    return (
                      <div key={permiso.idPermiso} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`perm-${permiso.idPermiso}`}
                          checked={isChecked}
                          onCheckedChange={() => handlePermissionToggle(permiso.idPermiso)}
                        />
                        <div className="grid gap-0.5 leading-none">
                          <label
                            htmlFor={`perm-${permiso.idPermiso}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {permiso.nombre}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permiso.descripcion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
