import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Switch } from '../components/ui/switch';
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Shield,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Filter,
  Upload,
  Loader2,
} from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useEmpleados } from '../../hooks/useEmpleados';
import authApi from '../../api/auth';
import type { Empleado, EmpleadoRequest, EmpleadoRol } from '../../api/empleados';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn, getFullImageUrl } from '../components/ui/utils';

export function Employees() {
  const {
    empleados,
    roles,
    isLoading,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    getSesionesEmpleado,
    getActividadEmpleado,
  } = useEmpleados();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Empleado | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const viewingEmployeeId = viewingEmployee?.idEmpleado ? Number(viewingEmployee.idEmpleado) : undefined;

  const employeeSessionsQuery = useQuery({
    queryKey: ['empleados', viewingEmployeeId, 'sesiones'],
    queryFn: () => getSesionesEmpleado(viewingEmployeeId!),
    enabled: profileDialogOpen && !!viewingEmployeeId,
  });

  const employeeActivityQuery = useQuery({
    queryKey: ['empleados', viewingEmployeeId, 'actividad'],
    queryFn: () => getActividadEmpleado(viewingEmployeeId!),
    enabled: profileDialogOpen && !!viewingEmployeeId,
  });

  const employeeSessions = employeeSessionsQuery.data || [];
  const employeeActivities = employeeActivityQuery.data || [];

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    password: '',
    idRol: '',
    email: '',
    telefono: '',
    avatarUrl: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
  });

  const filteredEmployees = empleados.filter((emp: Empleado) => {
    const fullName = `${emp.nombre} ${emp.apellido}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || String(emp.idRol) === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.estado === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      nombre: '',
      apellido: '',
      usuario: '',
      password: '',
      idRol: roles[0]?.idRol ? String(roles[0].idRol) : '',
      email: '',
      telefono: '',
      avatarUrl: '',
      estado: 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (employee: Empleado) => {
    setEditingEmployee(employee);
    setFormData({
      nombre: employee.nombre,
      apellido: employee.apellido || '',
      usuario: employee.username,
      password: '',
      idRol: String(employee.idRol),
      email: employee.email || '',
      telefono: employee.telefono || '',
      avatarUrl: employee.avatarUrl || '',
      estado: employee.estado as 'ACTIVO' | 'INACTIVO',
    });
    setDialogOpen(true);
  };

  const handleOpenProfile = (employee: Empleado) => {
    setViewingEmployee(employee);
    setProfileDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    setIsUploading(true);
    try {
      const response = await authApi.post('/uploads', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData((prev) => ({ ...prev, avatarUrl: response.data.fileUrl || response.data.url || '' }));
      toast.success('Imagen subida con éxito');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.idRol) {
      toast.error('El rol es obligatorio');
      return;
    }

    const payload: EmpleadoRequest = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      username: formData.usuario,
      idRol: Number(formData.idRol),
      email: formData.email || undefined,
      telefono: formData.telefono || undefined,
      avatarUrl: formData.avatarUrl || undefined,
      estado: formData.estado,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (editingEmployee) {
        await updateEmpleado({
          id: editingEmployee.idEmpleado,
          data: payload,
        });
        toast.success('Empleado actualizado correctamente');
      } else {
        if (!formData.password) {
          toast.error('La contraseña es obligatoria para nuevos empleados');
          return;
        }
        await createEmpleado(payload);
        toast.success('Empleado creado correctamente');
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
    if (confirm('¿Está seguro de que desea inactivar este empleado?')) {
      try {
        await deleteEmpleado(id);
        toast.success('Empleado inactivado correctamente');
      } catch (err) {
        console.error(err);
        toast.error('Error al eliminar empleado');
      }
    }
  };

  const getRoleColor = (rolName: string) => {
    const name = (rolName || '').toUpperCase();
    if (name.includes('ADMIN')) return 'ui-status-danger-soft';
    if (name.includes('GERENTE') || name.includes('MANAGER')) return 'ui-status-info-soft';
    if (name.includes('CAJERO') || name.includes('CAJA')) return 'ui-status-info-soft';
    if (name.includes('COCINERO') || name.includes('COCINA') || name.includes('PIZZERO')) return 'ui-status-warning-soft';
    if (name.includes('MESERO')) return 'ui-status-success-soft';
    return 'ui-surface-subtle';
  };

  const activeCount = empleados.filter((e: Empleado) => e.estado === 'ACTIVO').length;
  const inactiveCount = empleados.filter((e: Empleado) => e.estado === 'INACTIVO').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando personal...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Empleados' },
        ]}
        icon={UserCog}
        iconColor="blue"
        title="Gestión de Personal"
        subtitle="Administra las credenciales, perfiles, asignación de roles y audita la actividad del personal."
        action={
          <Button onClick={handleOpenCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Empleado
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={UserCog} label="Total Empleados" value={empleados.length} color="slate" />
        <KpiCard icon={CheckCircle2} label="Personal Activo" value={activeCount} color="green" />
        <KpiCard icon={XCircle} label="Deshabilitados" value={inactiveCount} color="red" />
        <KpiCard icon={Shield} label="Roles Registrados" value={roles.length} color="blue" />
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Buscar por nombre, usuario o email...',
        }}
        filters={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 h-11 rounded-xl">
                <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todos los roles</SelectItem>
                {roles.map((r: EmpleadoRol) => (
                  <SelectItem key={r.idRol} value={String(r.idRol)} className="rounded-lg">
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-11 rounded-xl">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todos</SelectItem>
                <SelectItem value="ACTIVO" className="rounded-lg">Activos</SelectItem>
                <SelectItem value="INACTIVO" className="rounded-lg">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Table */}
      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Sin empleados encontrados"
          description="Crea perfiles de personal para permitirles acceder al sistema de punto de venta, caja o cocina."
          action={
            <Button onClick={handleOpenCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Empleado
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Lista de Empleados"
          description={`Gestionando ${filteredEmployees.length} empleados en total.`}
          icon={UserCog}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee: Empleado) => (
                  <TableRow key={employee.idEmpleado}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-border">
                          {employee.avatarUrl ? (
                             <AvatarImage
                               src={getFullImageUrl(employee.avatarUrl)}
                               alt={employee.nombre}
                               className="object-cover"
                             />
                          ) : null}
                          <AvatarFallback className={cn('text-xs font-bold', getRoleColor(employee.nombreRol))}>
                            {employee.nombre[0]}
                            {employee.apellido?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground text-sm">
                            {employee.nombre} {employee.apellido}
                          </div>
                          <div className="text-xs font-semibold text-muted-foreground">ID: {employee.idEmpleado}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted font-bold font-mono px-2.5 py-1 rounded-lg text-foreground">{employee.username}</code>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-2xs', getRoleColor(employee.nombreRol))}>
                        {employee.nombreRol}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs font-semibold">
                        <div className="text-foreground">{employee.email || <span className="text-muted-foreground italic not-italic font-medium">Sin correo</span>}</div>
                        <div className="text-muted-foreground">{employee.telefono || 'Sin teléfono'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.estado === 'ACTIVO' ? (
                        <Badge variant="success" className="shadow-2xs gap-1 px-2.5 font-bold h-6">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="shadow-2xs gap-1 px-2.5 font-bold h-6">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenProfile(employee)}
                          title="Ver Perfil & Auditoría"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenEdit(employee)}
                          title="Editar Datos"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)]"
                          onClick={() => handleDelete(employee.idEmpleado)}
                          disabled={employee.estado === 'INACTIVO'}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingEmployee
                ? 'Actualiza la información y credenciales de acceso del empleado.'
                : 'Completa los datos para registrar un nuevo integrante del personal.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Foto de Perfil Upload */}
              <div className="col-span-2 flex flex-col items-center gap-3 pb-4 border-b border-border/40">
                <Avatar className="w-20 h-20 border border-border/60">
                  {formData.avatarUrl ? (
                    <AvatarImage src={getFullImageUrl(formData.avatarUrl)} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-lg font-bold">
                    {formData.nombre?.[0] || 'U'}
                    {formData.apellido?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    id="avatarFile"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="avatarFile"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold cursor-pointer hover:bg-muted transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    )}
                    {isUploading ? 'Subiendo...' : 'Subir Foto'}
                  </Label>
                  {formData.avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ui-status-danger rounded-xl hover:bg-[var(--status-danger-surface)] text-xs font-bold"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido" className="text-sm font-semibold">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usuario" className="text-sm font-semibold">Nombre de Usuario *</Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Contraseña {editingEmployee ? '(dejar en blanco para mantener)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingEmployee}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rol" className="text-sm font-semibold">Rol *</Label>
                <Select
                  value={formData.idRol}
                  onValueChange={(value) => setFormData({ ...formData, idRol: value })}
                >
                  <SelectTrigger id="rol" className="h-11 rounded-xl">
                    <SelectValue placeholder="Seleccione un Rol" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {roles.map((r: EmpleadoRol) => (
                      <SelectItem key={r.idRol} value={String(r.idRol)} className="rounded-lg">
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="text-sm font-semibold">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-4 border border-border/60 rounded-xl mt-2 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Estado del Usuario</Label>
                  <p className="text-xs text-muted-foreground font-medium">
                    {formData.estado === 'ACTIVO'
                      ? 'El empleado tiene acceso permitido para loguearse y operar.'
                      : 'El empleado está bloqueado temporalmente y no puede iniciar sesión.'}
                  </p>
                </div>
                <Switch
                  checked={formData.estado === 'ACTIVO'}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, estado: checked ? 'ACTIVO' : 'INACTIVO' })
                  }
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="h-10 rounded-xl font-semibold">
                {editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-5xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Perfil de Empleado & Actividad</DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-6 mt-3">
              {/* Employee Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 border border-border/60 bg-muted/10 rounded-2xl">
                <Avatar className="w-16 h-16 border border-border/50">
                  {viewingEmployee.avatarUrl ? (
                    <AvatarImage src={getFullImageUrl(viewingEmployee.avatarUrl)} className="object-cover" />
                  ) : null}
                  <AvatarFallback className={cn('text-sm font-bold', getRoleColor(viewingEmployee.nombreRol))}>
                    {viewingEmployee.nombre[0]}
                    {viewingEmployee.apellido?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 justify-center sm:justify-start">
                    <h3 className="text-lg font-bold text-foreground">
                      {viewingEmployee.nombre} {viewingEmployee.apellido}
                    </h3>
                    <div className="flex gap-1.5 justify-center sm:justify-start">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-lg font-bold shadow-3xs', getRoleColor(viewingEmployee.nombreRol))}>
                        {viewingEmployee.nombreRol}
                      </span>
                      {viewingEmployee.estado === 'ACTIVO' ? (
                        <Badge variant="success" className="text-[9px] font-bold px-2 py-0">Activo</Badge>
                      ) : (
                        <Badge variant="danger" className="text-[9px] font-bold px-2 py-0">Inactivo</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3.5 font-semibold text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground">Nombre de Usuario:</span>{' '}
                      <code className="bg-muted px-2 py-0.5 rounded-lg text-foreground font-mono font-bold">
                        {viewingEmployee.username}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span className="text-foreground">{viewingEmployee.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>{' '}
                      <span className="text-foreground">{viewingEmployee.telefono || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rol ID:</span>{' '}
                      <span className="text-foreground">{viewingEmployee.idRol}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions History */}
              <SectionCard
                title="Historial de Sesiones"
                description="Listado de ingresos y salidas del sistema en terminales."
                icon={Clock}
                iconColor="blue"
              >
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora Inicio</TableHead>
                        <TableHead>Hora Fin</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead className="text-right">Actividades</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeSessionsQuery.isLoading && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6 text-center text-xs font-semibold text-muted-foreground">
                            <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                            Cargando sesiones...
                          </TableCell>
                        </TableRow>
                      )}
                      {!employeeSessionsQuery.isLoading && employeeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="text-xs font-bold text-foreground">{session.fecha}</TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground">{session.horaInicio}</TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground">{session.horaFin || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold">{session.duracion}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground text-xs">{session.actividades}</TableCell>
                        </TableRow>
                      ))}
                      {!employeeSessionsQuery.isLoading && employeeSessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-xs font-semibold text-muted-foreground">
                            Este empleado aún no tiene sesiones registradas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>

              {/* Recent Activity */}
              <SectionCard
                title="Actividad Reciente"
                description="Auditoría de operaciones y transacciones críticas en el sistema."
                icon={Activity}
                iconColor="amber"
              >
                <div className="space-y-2.5">
                  {employeeActivityQuery.isLoading && (
                    <div className="flex items-center justify-center py-6 text-xs font-semibold text-muted-foreground">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando actividad...
                    </div>
                  )}
                  {!employeeActivityQuery.isLoading && employeeActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/25 transition-all"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <div className="font-bold text-foreground text-xs">{activity.accion}</div>
                          <Badge variant="outline" className="text-[9px] font-bold px-2 h-5">
                            {activity.modulo}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold mb-1">
                          {activity.detalles}
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 font-bold">
                          {activity.fecha}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!employeeActivityQuery.isLoading && employeeActivities.length === 0 && (
                    <div className="py-8 text-center text-xs font-semibold text-muted-foreground border border-dashed rounded-xl">
                      No hay actividad reciente registrada para este empleado.
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          )}
          <DialogFooter className="mt-4 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)} className="h-10 rounded-xl">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
