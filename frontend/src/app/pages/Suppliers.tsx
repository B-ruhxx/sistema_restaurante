import { useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, MoreHorizontal, Building2, Phone, Mail, Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { toast } from '../../lib/notifications';
import { useProveedores } from '../../hooks/useProveedores';
import type { Proveedor, ProveedorRequest } from '../../api/proveedores';

const emptyForm: ProveedorRequest = {
  razonSocial: '',
  nombreComercial: '',
  ruc: '',
  contactoPrincipal: '',
  email: '',
  telefono: '',
  direccion: '',
  estado: 'ACTIVO',
};

export function Suppliers() {
  const {
    proveedores,
    isLoading,
    createProveedor,
    updateProveedor,
    deleteProveedor,
  } = useProveedores();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<ProveedorRequest>(emptyForm);

  const filtered = proveedores.filter((s: Proveedor) => {
    if (s.estado === 'INACTIVO') return false;
    const q = search.toLowerCase();
    return (
      s.razonSocial.toLowerCase().includes(q) ||
      (s.ruc && s.ruc.includes(q)) ||
      (s.contactoPrincipal && s.contactoPrincipal.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Proveedor) => {
    setEditing(s);
    setForm({
      razonSocial: s.razonSocial,
      nombreComercial: s.nombreComercial || '',
      ruc: s.ruc || '',
      contactoPrincipal: s.contactoPrincipal || '',
      email: s.email || '',
      telefono: s.telefono || '',
      direccion: s.direccion || '',
      estado: s.estado || 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.razonSocial.trim()) {
      toast.error('La razón social es obligatoria');
      return;
    }
    try {
      if (editing) {
        await updateProveedor({ id: editing.idProveedor, data: form });
        toast.success('Proveedor actualizado correctamente');
      } else {
        await createProveedor(form);
        toast.success('Proveedor creado correctamente');
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Error al guardar proveedor');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProveedor(deleting.idProveedor);
      toast.success('Proveedor eliminado correctamente');
      setDeleteOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Error al eliminar proveedor');
    }
  };

  const activos = proveedores.filter((s: Proveedor) => s.estado !== 'INACTIVO').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Proveedores</h1>
          </div>
          <p className="text-sm text-muted-foreground">{activos} proveedores activos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Proveedores</CardDescription>
            <CardTitle className="text-3xl">{proveedores.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">En la base de datos</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activos}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Disponibles para compras</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactivos</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {proveedores.length - activos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Suspendidos temporalmente</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedor, RUC, contacto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead className="hidden md:table-cell">RUC</TableHead>
              <TableHead className="hidden lg:table-cell">Contacto</TableHead>
              <TableHead className="hidden sm:table-cell">Email / Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s: Proveedor) => (
              <TableRow key={s.idProveedor}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{s.razonSocial}</p>
                      {s.nombreComercial && (
                        <p className="text-xs text-muted-foreground">{s.nombreComercial}</p>
                      )}
                      {s.direccion && (
                        <p className="text-xs text-muted-foreground">{s.direccion}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm font-mono">
                  {s.ruc || <span className="text-muted-foreground italic text-xs">Sin RUC</span>}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {s.contactoPrincipal || <span className="text-muted-foreground italic text-xs">Sin contacto</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="text-xs space-y-0.5">
                    {s.email && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {s.email}
                      </div>
                    )}
                    {s.telefono && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {s.telefono}
                      </div>
                    )}
                    {!s.email && !s.telefono && (
                      <span className="italic text-muted-foreground">Sin contacto</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {s.estado !== 'INACTIVO' ? (
                    <Badge variant="default">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => { setDeleting(s); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Razón Social *</Label>
              <Input
                placeholder="Ej: Distribuidora El Sol S.A.C."
                value={form.razonSocial}
                onChange={(e) => setForm((f) => ({ ...f, razonSocial: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nombre Comercial</Label>
              <Input
                placeholder="Nombre que usa normalmente"
                value={form.nombreComercial}
                onChange={(e) => setForm((f) => ({ ...f, nombreComercial: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>RUC</Label>
              <Input
                placeholder="20512345678"
                value={form.ruc}
                onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))}
                className="mt-1"
                maxLength={11}
              />
            </div>
            <div>
              <Label>Persona de contacto</Label>
              <Input
                placeholder="Nombre completo"
                value={form.contactoPrincipal}
                onChange={(e) => setForm((f) => ({ ...f, contactoPrincipal: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                placeholder="01-234-5678"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="contacto@empresa.pe"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Dirección</Label>
              <Input
                placeholder="Calle, número, distrito"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!form.razonSocial.trim()}>
              {editing ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>{deleting?.razonSocial}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
