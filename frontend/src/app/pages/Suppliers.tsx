import { useState } from 'react';
import {
  Plus, Pencil, Trash2, MoreHorizontal, Building2, Phone, Mail, Loader2, RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
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
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';

const emptyForm: ProveedorRequest = {
  razonSocial: '',
  ruc: '',
  contacto: '',
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
  const [estadoFilter, setEstadoFilter] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('ACTIVO');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<ProveedorRequest>(emptyForm);

  const filtered = proveedores.filter((s: Proveedor) => {
    const q = search.toLowerCase();
    const estado = (s.estado || 'ACTIVO') as 'ACTIVO' | 'INACTIVO';
    const matchesEstado = estadoFilter === 'TODOS' || estado === estadoFilter;
    const matchesSearch = (
      s.razonSocial.toLowerCase().includes(q) ||
      (s.ruc && s.ruc.includes(q)) ||
      (s.contacto && s.contacto.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
    return matchesEstado && matchesSearch;
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
      ruc: s.ruc || '',
      contacto: s.contacto || '',
      email: s.email || '',
      telefono: s.telefono || '',
      direccion: s.direccion || '',
      estado: s.estado || 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: ProveedorRequest = {
      razonSocial: form.razonSocial.trim(),
      ruc: form.ruc?.trim() || undefined,
      contacto: form.contacto?.trim() || undefined,
      email: form.email?.trim() || undefined,
      telefono: form.telefono?.trim() || undefined,
      direccion: form.direccion?.trim() || undefined,
      estado: form.estado,
    };

    if (!payload.razonSocial) {
      toast.error('La razón social es obligatoria');
      return;
    }
    if (payload.ruc && payload.ruc.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos');
      return;
    }
    try {
      if (editing) {
        await updateProveedor({ id: editing.idProveedor, data: payload });
        toast.success('Proveedor actualizado correctamente');
      } else {
        await createProveedor(payload);
        toast.success('Proveedor creado correctamente');
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Error al guardar proveedor');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProveedor(deleting.idProveedor);
      toast.success('Proveedor inactivado correctamente');
      setDeleteOpen(false);
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Error al inactivar proveedor');
    }
  };

  const handleReactivate = async (proveedor: Proveedor) => {
    try {
      await updateProveedor({
        id: proveedor.idProveedor,
        data: {
          razonSocial: proveedor.razonSocial,
          ruc: proveedor.ruc,
          contacto: proveedor.contacto,
          email: proveedor.email,
          telefono: proveedor.telefono,
          direccion: proveedor.direccion,
          estado: 'ACTIVO',
        },
      });
      toast.success('Proveedor reactivado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al reactivar proveedor');
    }
  };

  const activos = proveedores.filter((s: Proveedor) => s.estado !== 'INACTIVO').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Inventario' },
          { label: 'Proveedores' },
        ]}
        icon={Building2}
        iconColor="blue"
        title="Proveedores"
        subtitle="Directorio de proveedores para compras, abastecimiento y control de contratos."
        action={
          <Button onClick={openCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Total Proveedores" value={proveedores.length} color="slate" />
        <KpiCard icon={Building2} label="Activos" value={activos} color="green" />
        <KpiCard icon={Building2} label="Inactivos" value={proveedores.length - activos} color="red" />
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar proveedor, RUC, contacto...',
        }}
        filters={
          <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as 'ACTIVO' | 'INACTIVO' | 'TODOS')}>
            <SelectTrigger className="w-44 h-11 rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ACTIVO" className="rounded-lg">Activos</SelectItem>
              <SelectItem value="INACTIVO" className="rounded-lg">Inactivos</SelectItem>
              <SelectItem value="TODOS" className="rounded-lg">Todos</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin proveedores encontrados"
          description="Registra tus proveedores para poder asociarlos a órdenes de compra y abastecimiento."
          action={
            <Button onClick={openCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Directorio de Proveedores"
          description={`Listando ${filtered.length} proveedores.`}
          icon={Building2}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
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
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{s.razonSocial}</p>
                          {s.direccion && (
                            <p className="text-xs text-muted-foreground font-medium">{s.direccion}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs font-bold text-foreground">
                      {s.ruc || <span className="text-muted-foreground italic not-italic font-medium">Sin RUC</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-semibold text-muted-foreground">
                      {s.contacto || <span className="italic not-italic font-medium">Sin contacto</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-xs space-y-1">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Mail className="w-3 h-3" />
                            {s.email}
                          </div>
                        )}
                        {s.telefono && (
                          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Phone className="w-3 h-3" />
                            {s.telefono}
                          </div>
                        )}
                        {!s.email && !s.telefono && (
                          <span className="italic font-medium not-italic text-muted-foreground">Sin contacto</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.estado !== 'INACTIVO' ? (
                        <Badge variant="success" className="shadow-2xs">Activo</Badge>
                      ) : (
                        <Badge variant="danger" className="shadow-2xs">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(s)} className="rounded-lg">
                            <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                          </DropdownMenuItem>
                          {s.estado === 'INACTIVO' && (
                            <DropdownMenuItem onClick={() => handleReactivate(s)} className="rounded-lg">
                              <RotateCcw className="w-4 h-4 mr-2 text-muted-foreground" /> Reactivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="ui-status-danger rounded-lg focus:bg-[var(--status-danger-surface)]"
                            onClick={() => { setDeleting(s); setDeleteOpen(true); }}
                            disabled={s.estado === 'INACTIVO'}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Inactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2 mt-1">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Razón Social *</Label>
              <Input
                placeholder="Ej: Distribuidora El Sol S.A.C."
                value={form.razonSocial}
                onChange={(e) => setForm((f) => ({ ...f, razonSocial: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">RUC</Label>
              <Input
                placeholder="20512345678"
                value={form.ruc}
                onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))}
                className="h-11 rounded-xl font-mono"
                maxLength={11}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Persona de contacto</Label>
              <Input
                placeholder="Nombre completo"
                value={form.contacto}
                onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Teléfono</Label>
              <Input
                placeholder="01-234-5678"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Correo electrónico</Label>
              <Input
                type="email"
                placeholder="contacto@empresa.pe"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Dirección</Label>
              <Input
                placeholder="Calle, número, distrito"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!form.razonSocial.trim()} className="h-10 rounded-xl font-semibold">
              {editing ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Inactivar proveedor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            ¿Estás seguro de que deseas inactivar a <strong>{deleting?.razonSocial}</strong>? No podrá ser seleccionado en futuras compras.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="h-10 rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="h-10 rounded-xl font-semibold">
              Inactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
