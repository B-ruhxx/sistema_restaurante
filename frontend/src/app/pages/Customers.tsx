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
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  CreditCard,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClientes } from '../../hooks/useClientes';
import type { Cliente, ClienteRequest } from '../../api/clientes';

type TipoDoc = 'DNI' | 'RUC' | 'CE';

const getSegmentColor = (estado: string) => {
  if (estado === 'INACTIVO') return 'bg-gray-500 text-white';
  return 'bg-blue-500 text-white';
};

export function Customers() {
  const { clientes, isLoading, createCliente, updateCliente, deleteCliente } = useClientes();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Cliente | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI' as TipoDoc,
    documentoIdentidad: '',
    telefono: '',
    email: '',
    direccion: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
  });

  const filteredClientes = clientes
    .filter((c: Cliente) => c.estado !== 'INACTIVO')
    .filter((c: Cliente) => {
      const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        c.documentoIdentidad.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.telefono && c.telefono.includes(searchTerm));

      const matchesTipo = tipoFilter === 'all' || c.tipoDocumento === tipoFilter;

      return matchesSearch && matchesTipo;
    });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      nombre: '',
      apellido: '',
      tipoDocumento: 'DNI',
      documentoIdentidad: '',
      telefono: '',
      email: '',
      direccion: '',
      estado: 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setEditingCustomer(cliente);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      tipoDocumento: cliente.tipoDocumento,
      documentoIdentidad: cliente.documentoIdentidad,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado || 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleOpenProfile = (cliente: Cliente) => {
    setViewingCustomer(cliente);
    setProfileDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: ClienteRequest = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      tipoDocumento: formData.tipoDocumento,
      documentoIdentidad: formData.documentoIdentidad,
      telefono: formData.telefono || undefined,
      email: formData.email || undefined,
      direccion: formData.direccion || undefined,
      estado: formData.estado,
    };

    try {
      if (editingCustomer) {
        await updateCliente({ id: editingCustomer.idCliente, data: payload });
        toast.success('Cliente actualizado correctamente');
      } else {
        await createCliente(payload);
        toast.success('Cliente creado correctamente');
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!confirm(`¿Desea inactivar al cliente ${cliente.nombre} ${cliente.apellido}?`)) return;
    try {
      await deleteCliente(cliente.idCliente);
      toast.success('Cliente inactivado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al inactivar cliente');
    }
  };

  const totalClientes = clientes.filter((c: Cliente) => c.estado !== 'INACTIVO').length;
  const activos = clientes.filter((c: Cliente) => c.estado === 'ACTIVO').length;
  const dniCount = clientes.filter((c: Cliente) => c.estado !== 'INACTIVO' && c.tipoDocumento === 'DNI').length;
  const rucCount = clientes.filter((c: Cliente) => c.estado !== 'INACTIVO' && c.tipoDocumento === 'RUC').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Administra tu base de clientes y su información de contacto
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Clientes</CardDescription>
            <CardTitle className="text-3xl">{totalClientes}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">En la base de datos</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Clientes Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activos}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {totalClientes > 0 ? ((activos / totalClientes) * 100).toFixed(1) : 0}% del total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con DNI</CardDescription>
            <CardTitle className="text-3xl">{dniCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Personas naturales</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con RUC</CardDescription>
            <CardTitle className="text-3xl">{rucCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Empresas / Personas jurídicas</div>
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
                  placeholder="Buscar por nombre, documento, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente: Cliente) => (
                <TableRow key={cliente.idCliente}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className={getSegmentColor(cliente.estado || 'ACTIVO')}>
                          {cliente.nombre[0]}{cliente.apellido[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                        <div className="text-xs text-muted-foreground">ID: {cliente.idCliente}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {cliente.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {cliente.email}
                        </div>
                      )}
                      {cliente.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {cliente.telefono}
                        </div>
                      )}
                      {!cliente.email && !cliente.telefono && (
                        <span className="text-xs text-muted-foreground italic">Sin contacto</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">{cliente.tipoDocumento}</Badge>
                      <div className="text-sm flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        {cliente.documentoIdentidad}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(cliente.estado || 'ACTIVO') === 'ACTIVO' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.direccion ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-[180px] truncate">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {cliente.direccion}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sin dirección</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenProfile(cliente)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(cliente)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(cliente)}
                        disabled={(cliente.estado || 'ACTIVO') === 'INACTIVO'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron clientes.
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
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Actualiza la información del cliente'
                : 'Completa los datos del nuevo cliente'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
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
                <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(val) => setFormData({ ...formData, tipoDocumento: val as TipoDoc })}
                >
                  <SelectTrigger id="tipoDocumento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="RUC">RUC</SelectItem>
                    <SelectItem value="CE">CE (Carné Extranjería)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Número de Documento *</Label>
                <Input
                  id="documento"
                  value={formData.documentoIdentidad}
                  onChange={(e) => setFormData({ ...formData, documentoIdentidad: e.target.value })}
                  maxLength={formData.tipoDocumento === 'RUC' ? 11 : 12}
                  required
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
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. Principal 123, Lima"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Perfil de Cliente</DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className={getSegmentColor(viewingCustomer.estado || 'ACTIVO')}>
                    {viewingCustomer.nombre[0]}{viewingCustomer.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">
                      {viewingCustomer.nombre} {viewingCustomer.apellido}
                    </h3>
                    <Badge variant="outline">{viewingCustomer.tipoDocumento}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      {viewingCustomer.documentoIdentidad}
                    </div>
                    {viewingCustomer.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {viewingCustomer.telefono}
                      </div>
                    )}
                    {viewingCustomer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {viewingCustomer.email}
                      </div>
                    )}
                    {viewingCustomer.direccion && (
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                        {viewingCustomer.direccion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    handleOpenEdit(viewingCustomer);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
