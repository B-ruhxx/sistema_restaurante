import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
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
import { CreditCard, Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useMetodoPagos } from '../../hooks/useMetodoPagos';
import type { MetodoPago, MetodoPagoRequest } from '../../api/metodoPagos';
import { PageWrapper, ModuleHeader, KpiCard, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

export function PaymentMethods() {
  const {
    metodoPagos,
    isLoading,
    createMetodoPago,
    updateMetodoPago,
    deleteMetodoPago,
  } = useMetodoPagos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<MetodoPago | null>(null);
  const [formData, setFormData] = useState<MetodoPagoRequest>({
    nombre: '',
    codigo: '',
    requiereReferencia: false,
    estado: 'ACTIVO',
  });

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData({ nombre: '', codigo: '', requiereReferencia: false, estado: 'ACTIVO' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (method: MetodoPago) => {
    setEditingMethod(method);
    setFormData({
      nombre: method.nombre,
      codigo: method.codigo,
      requiereReferencia: method.requiereReferencia ?? false,
      estado: method.estado,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: MetodoPagoRequest = {
      nombre: formData.nombre.trim(),
      codigo: formData.codigo.trim().toUpperCase(),
      requiereReferencia: formData.requiereReferencia ?? false,
      estado: formData.estado,
    };

    if (!payload.nombre || !payload.codigo) {
      toast.error('El nombre y el código son obligatorios');
      return;
    }

    try {
      if (editingMethod) {
        await updateMetodoPago({ id: editingMethod.idMetodoPago, data: payload });
        toast.success('Método de pago actualizado');
      } else {
        await createMetodoPago(payload);
        toast.success('Método de pago creado');
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

  const handleDelete = async (method: MetodoPago) => {
    if (!confirm(`¿Desea eliminar el método "${method.nombre}"?`)) return;
    try {
      await deleteMetodoPago(method.idMetodoPago);
      toast.success('Método de pago eliminado');
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Error al eliminar método de pago');
    }
  };

  const handleToggleStatus = async (method: MetodoPago) => {
    const newEstado: 'ACTIVO' | 'INACTIVO' = method.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await updateMetodoPago({
        id: method.idMetodoPago,
        data: {
          nombre: method.nombre,
          codigo: method.codigo,
          requiereReferencia: method.requiereReferencia ?? false,
          estado: newEstado,
        },
      });
      toast.success(`Método ${newEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`);
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const activeMethods = metodoPagos.filter((m: MetodoPago) => m.estado === 'ACTIVO').length;
  const inactiveMethods = metodoPagos.filter((m: MetodoPago) => m.estado === 'INACTIVO').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Finanzas' },
          { label: 'Métodos de Pago' },
        ]}
        icon={CreditCard}
        iconColor="blue"
        title="Métodos de Pago"
        subtitle="Administra los medios de cobro y pago (Efectivo, Tarjetas, Yape, Plin) disponibles en caja."
        action={
          <Button onClick={handleOpenCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Método
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={CreditCard} label="Total Métodos" value={metodoPagos.length} color="slate" />
        <KpiCard icon={CheckCircle2} label="Métodos Activos" value={activeMethods} color="green" />
        <KpiCard icon={XCircle} label="Deshabilitados" value={inactiveMethods} color="red" />
      </div>

      {/* Table Section */}
      {metodoPagos.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin métodos configurados"
          description="Debes configurar al menos un método de pago activo para realizar ventas en el sistema de POS."
          action={
            <Button onClick={handleOpenCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Método
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Métodos de Pago Configurados"
          description="Habilita, deshabilita y controla los códigos operativos de cada medio de cobro."
          icon={CreditCard}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Requiere Referencia</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Habilitado</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metodoPagos.map((method: MetodoPago) => (
                  <TableRow key={method.idMetodoPago}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="font-bold text-foreground text-sm">{method.nombre}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted font-bold font-mono px-2.5 py-1 rounded-lg text-foreground">
                        {method.codigo}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={method.requiereReferencia ? 'secondary' : 'outline'} className="shadow-3xs text-[10px] font-bold">
                        {method.requiereReferencia ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {method.estado === 'ACTIVO' ? (
                        <Badge variant="success" className="shadow-2xs font-bold gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="shadow-2xs font-bold gap-1">
                          <XCircle className="w-3 h-3" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex justify-center">
                        <Switch
                          checked={method.estado === 'ACTIVO'}
                          onCheckedChange={() => handleToggleStatus(method)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenEdit(method)}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)]"
                          onClick={() => handleDelete(method)}
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
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define el nombre, código operativo del sistema y si exige referencia numérica al cobrar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4 py-2 mt-1">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre del Método *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Tarjeta Visa, Yape, Efectivo..."
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="codigo" className="text-sm font-semibold">Código interno *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ej: EFECTIVO, YAPE, VISA"
                  maxLength={30}
                  required
                  className="h-11 rounded-xl font-mono uppercase font-bold"
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-border/60 rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Requiere referencia</Label>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Obliga a registrar el número de operación, POS o celular al confirmar cobros.
                  </p>
                </div>
                <Switch
                  checked={formData.requiereReferencia ?? false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiereReferencia: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-border/60 rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Estado Activo</Label>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {formData.estado === 'ACTIVO'
                      ? 'El método estará disponible inmediatamente en pantallas de caja.'
                      : 'El método se ocultará y no podrá ser utilizado en ventas.'}
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
                {editingMethod ? 'Guardar Cambios' : 'Crear Método'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
