import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
  Search,
  Edit,
  Trash2,
  Eye,
  Shield,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmpleados } from '../../hooks/useEmpleados';
import authApi from '../../api/auth';

interface EmployeeSession {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  duracion: string;
  actividades: number;
}

interface EmployeeActivity {
  id: string;
  accion: string;
  modulo: string;
  fecha: string;
  detalles: string;
}

const mockSessions: Record<string, EmployeeSession[]> = {
  '1': [
    {
      id: 'S1',
      fecha: '2026-06-08',
      horaInicio: '08:00',
      horaFin: '14:30',
      duracion: '6h 30m',
      actividades: 45,
    },
    {
      id: 'S2',
      fecha: '2026-06-07',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracion: '9h',
      actividades: 67,
    },
  ],
};

const mockActivities: Record<string, EmployeeActivity[]> = {
  '1': [
    {
      id: 'A1',
      accion: 'Creó producto',
      modulo: 'Productos',
      fecha: '2026-06-08 14:25',
      detalles: 'Hamburguesa Premium',
    },
    {
      id: 'A2',
      accion: 'Editó proveedor',
      modulo: 'Proveedores',
      fecha: '2026-06-08 14:15',
      detalles: 'Distribuidora Lima SAC',
    },
    {
      id: 'A3',
      accion: 'Cerró caja',
      modulo: 'Caja',
      fecha: '2026-06-08 14:00',
      detalles: 'Caja #12 - S/ 2,450.00',
    },
  ],
};

export function Employees() {
  const {
    empleados,
    roles,
    isLoading,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
  } = useEmpleados();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVO');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const filteredEmployees = empleados.filter((emp: any) => {
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

  const handleOpenEdit = (employee: any) => {
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

  const handleOpenProfile = (employee: any) => {
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
      // The API returns fileUrl relative, e.g. /api/uploads/filename
      setFormData((prev) => ({ ...prev, avatarUrl: response.data.fileUrl }));
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

    const payload: any = {
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Ocurrió un error al guardar');
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
    if (name.includes('ADMIN')) return 'bg-red-500 text-white';
    if (name.includes('GERENTE') || name.includes('MANAGER')) return 'bg-purple-500 text-white';
    if (name.includes('CAJERO') || name.includes('CAJA')) return 'bg-blue-500 text-white';
    if (name.includes('COCINERO') || name.includes('COCINA') || name.includes('PIZZERO')) return 'bg-orange-500 text-white';
    if (name.includes('MESERO')) return 'bg-green-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getFullAvatarUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  };

  const activeCount = empleados.filter((e: any) => e.estado === 'ACTIVO').length;
  const inactiveCount = empleados.filter((e: any) => e.estado === 'INACTIVO').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando personal...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UserCog className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Gestión de Empleados</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Administra el personal, roles y monitorea la actividad del sistema
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Empleados</CardDescription>
            <CardTitle className="text-3xl">{empleados.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">En toda la organización</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {empleados.length > 0 ? ((activeCount / empleados.length) * 100).toFixed(1) : 0}% del total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactivos</CardDescription>
            <CardTitle className="text-3xl text-red-600">{inactiveCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Usuarios deshabilitados</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Roles Registrados</CardDescription>
            <CardTitle className="text-3xl">{roles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Niveles de acceso configurados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, usuario o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <Shield className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {roles.map((r: any) => (
                    <SelectItem key={r.idRol} value={String(r.idRol)}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVO">Activos</SelectItem>
                  <SelectItem value="INACTIVO">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Empleado
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee: any) => (
                <TableRow key={employee.idEmpleado}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {employee.avatarUrl ? (
                          <AvatarImage
                            src={getFullAvatarUrl(employee.avatarUrl)}
                            alt={employee.nombre}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className={getRoleColor(employee.nombreRol)}>
                          {employee.nombre[0]}
                          {employee.apellido?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {employee.nombre} {employee.apellido}
                        </div>
                        <div className="text-xs text-muted-foreground">ID: {employee.idEmpleado}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{employee.username}</code>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(employee.nombreRol)}>
                      {employee.nombreRol}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <div>{employee.email || <span className="text-muted-foreground italic">Sin correo</span>}</div>
                      <div className="text-muted-foreground">{employee.telefono || 'Sin teléfono'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.estado === 'ACTIVO' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenProfile(employee)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(employee.idEmpleado)}
                        disabled={employee.estado === 'INACTIVO'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron empleados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? 'Actualiza la información del empleado'
                : 'Completa los datos del nuevo empleado'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              {/* Foto de Perfil Upload */}
              <div className="col-span-2 flex flex-col items-center gap-3 pb-4 border-b">
                <Avatar className="w-20 h-20 border">
                  {formData.avatarUrl ? (
                    <AvatarImage src={getFullAvatarUrl(formData.avatarUrl)} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-lg">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
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
                      className="text-destructive text-xs"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario">Nombre de Usuario *</Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña {editingEmployee ? '(dejar en blanco para mantener)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingEmployee}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={formData.idRol}
                  onValueChange={(value) => setFormData({ ...formData, idRol: value })}
                >
                  <SelectTrigger id="rol">
                    <SelectValue placeholder="Seleccione un Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r: any) => (
                      <SelectItem key={r.idRol} value={String(r.idRol)}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Estado del Usuario</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.estado === 'ACTIVO'
                      ? 'El empleado puede acceder al sistema'
                      : 'El empleado no puede acceder al sistema'}
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil de Empleado</DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Avatar className="w-16 h-16">
                  {viewingEmployee.avatarUrl ? (
                    <AvatarImage src={getFullAvatarUrl(viewingEmployee.avatarUrl)} className="object-cover" />
                  ) : null}
                  <AvatarFallback className={getRoleColor(viewingEmployee.nombreRol)}>
                    {viewingEmployee.nombre[0]}
                    {viewingEmployee.apellido?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">
                      {viewingEmployee.nombre} {viewingEmployee.apellido}
                    </h3>
                    <Badge className={getRoleColor(viewingEmployee.nombreRol)}>
                      {viewingEmployee.nombreRol}
                    </Badge>
                    {viewingEmployee.estado === 'ACTIVO' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="text-muted-foreground">Usuario:</span>{' '}
                      <code className="bg-muted px-2 py-0.5 rounded">
                        {viewingEmployee.username}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      {viewingEmployee.email || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>{' '}
                      {viewingEmployee.telefono || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID de Rol:</span>{' '}
                      {viewingEmployee.idRol}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Historial de Sesiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      {mockSessions['1'].map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.fecha}</TableCell>
                          <TableCell>{session.horaInicio}</TableCell>
                          <TableCell>{session.horaFin || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{session.duracion}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{session.actividades}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockActivities['1'].map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium">{activity.accion}</div>
                            <Badge variant="outline" className="text-xs">
                              {activity.modulo}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {activity.detalles}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.fecha}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
