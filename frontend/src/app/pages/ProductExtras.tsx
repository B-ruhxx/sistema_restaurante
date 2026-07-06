import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { PlusCircle, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useExtras } from '../../hooks/useExtras';
import { useInsumos } from '../../hooks/useInsumos';
import type { ExtraProducto, ExtraProductoRequest } from '../../api/extras';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';

interface ProductExtra {
  id: string;
  nombre: string;
  precio: number | null;
  idInsumo?: number;
  nombreInsumo?: string;
  unidadMedidaInsumo?: string;
  cantidadConsumida?: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export function ProductExtras() {
  const { extras: apiExtras, isLoading, createExtra, updateExtra, deleteExtra } = useExtras();
  const { insumos, isLoading: isLoadingInsumos } = useInsumos();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    idInsumo: '',
    cantidadConsumida: '',
  });

  if (isLoading || isLoadingInsumos) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando extras...</p>
      </div>
    );
  }

  const extras: ProductExtra[] = apiExtras.map((e: ExtraProducto) => ({
    id: String(e.idExtra),
    nombre: e.nombre,
    precio: e.precio,
    idInsumo: e.idInsumo,
    nombreInsumo: e.nombreInsumo,
    unidadMedidaInsumo: e.unidadMedidaInsumo,
    cantidadConsumida: e.cantidadConsumida,
    estado: e.estado || 'ACTIVO',
  }));
  const activeInsumos = insumos.filter(insumo => insumo.estado !== 'INACTIVO');

  const filteredExtras = extras.filter(extra => {
    if (extra.estado === 'INACTIVO') return false;
    return extra.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenCreate = () => {
    setEditingExtra(null);
    setFormData({
      nombre: '',
      precio: '',
      idInsumo: '',
      cantidadConsumida: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (extra: ProductExtra) => {
    setEditingExtra(extra);
    setFormData({
      nombre: extra.nombre,
      precio: String(extra.precio),
      idInsumo: extra.idInsumo ? String(extra.idInsumo) : '',
      cantidadConsumida: extra.cantidadConsumida ? String(extra.cantidadConsumida) : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.precio || !formData.idInsumo || !formData.cantidadConsumida) {
      toast.error('Nombre, precio, insumo y cantidad consumida son obligatorios');
      return;
    }

    const cantidadConsumida = parseFloat(formData.cantidadConsumida);
    if (Number.isNaN(cantidadConsumida) || cantidadConsumida <= 0) {
      toast.error('La cantidad consumida debe ser mayor a 0');
      return;
    }

    const payload: ExtraProductoRequest = {
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      idInsumo: Number(formData.idInsumo),
      cantidadConsumida,
    };

    try {
      if (editingExtra) {
        await updateExtra({
          id: Number(editingExtra.id),
          data: payload,
        });
        toast.success('Extra actualizado correctamente');
      } else {
        await createExtra(payload);
        toast.success('Extra creado correctamente');
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el extra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desea eliminar este extra?')) return;
    try {
      await deleteExtra(Number(id));
      toast.success('Extra eliminado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar extra');
    }
  };

  const totalExtras = extras.length;
  const activeExtras = extras.filter(extra => extra.estado !== 'INACTIVO').length;
  const inactiveExtras = totalExtras - activeExtras;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Catálogo' },
          { label: 'Extras' },
        ]}
        icon={PlusCircle}
        iconColor="blue"
        title="Extras de Productos"
        subtitle="Administra los ingredientes y adicionales opcionales para personalizar los platos."
        action={
          <Button onClick={handleOpenCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Extra
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={PlusCircle}
          label="Total Extras"
          value={totalExtras}
          color="slate"
        />
        <KpiCard
          icon={PlusCircle}
          label="Activos"
          value={activeExtras}
          color="green"
        />
        <KpiCard
          icon={PlusCircle}
          label="Inactivos"
          value={inactiveExtras}
          color="red"
        />
      </div>

      {/* Toolbar */}
      <FilterToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Buscar extras por nombre...',
        }}
      />

      {/* Card Table */}
      <SectionCard
        title="Extras Configurados"
        description="Lista de adicionales configurados y sus relaciones de descuento de almacén."
        icon={PlusCircle}
        iconColor="blue"
      >
        {filteredExtras.length === 0 ? (
          <EmptyState
            icon={PlusCircle}
            title="Sin extras encontrados"
            description="Registra un extra para ofrecer a tus clientes ingredientes opcionales adicionales (ej. queso extra, papas)."
            action={
              <Button onClick={handleOpenCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Extra
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Insumo Asociado</TableHead>
                  <TableHead>Consumo Almacén</TableHead>
                  <TableHead className="text-right">Precio adicional</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExtras.map(extra => (
                  <TableRow key={extra.id}>
                    <TableCell className="font-bold text-foreground">{extra.nombre}</TableCell>
                    <TableCell className="font-semibold text-muted-foreground text-sm">{extra.nombreInsumo || 'Sin insumo'}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">
                      {extra.cantidadConsumida
                        ? `${extra.cantidadConsumida} ${extra.unidadMedidaInsumo || ''}`
                        : 'Sin consumo'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground ui-tabular">
                      S/ {extra.precio != null ? extra.precio.toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenEdit(extra)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(extra.id)}
                          title="Eliminar"
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
        )}
      </SectionCard>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingExtra ? 'Editar Extra' : 'Nuevo Extra'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Asocia el adicional a un insumo para el descuento automatizado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-sm font-semibold">Nombre del extra *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Extra Queso Cheddar"
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio" className="text-sm font-semibold">Precio adicional (S/) *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={e => setFormData({ ...formData, precio: e.target.value })}
                placeholder="0.00"
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idInsumo" className="text-sm font-semibold">Insumo que consume de almacén *</Label>
              <select
                id="idInsumo"
                value={formData.idInsumo}
                onChange={e => setFormData({ ...formData, idInsumo: e.target.value })}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Selecciona el insumo...</option>
                {activeInsumos.map(insumo => (
                  <option key={insumo.idInsumo} value={String(insumo.idInsumo)}>
                    {insumo.nombre} ({insumo.unidad})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cantidadConsumida" className="text-sm font-semibold">Cantidad consumida del insumo por porción *</Label>
              <Input
                id="cantidadConsumida"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cantidadConsumida}
                onChange={e => setFormData({ ...formData, cantidadConsumida: e.target.value })}
                placeholder="Ej: 20"
                required
                className="h-11 rounded-xl"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="h-10 rounded-xl font-semibold">
                {editingExtra ? 'Guardar Cambios' : 'Crear Extra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
