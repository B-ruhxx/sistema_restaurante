import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { CreditCard, Plus, Edit, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useMetodoPagos } from '../../hooks/useMetodoPagos';
import type { MetodoPago, MetodoPagoRequest } from '../../api/metodoPagos';

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
    estado: 'ACTIVO',
  });

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData({ nombre: '', estado: 'ACTIVO' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (method: MetodoPago) => {
    setEditingMethod(method);
    setFormData({
      nombre: method.nombre,
      estado: method.estado,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMethod) {
        await updateMetodoPago({ id: editingMethod.idMetodoPago, data: formData });
        toast.success('Método de pago actualizado');
      } else {
        await createMetodoPago(formData);
        toast.success('Método de pago creado');
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (method: MetodoPago) => {
    if (!confirm(`¿Desea eliminar el método "${method.nombre}"?`)) return;
    try {
      await deleteMetodoPago(method.idMetodoPago);
      toast.success('Método de pago eliminado');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data || 'Error al eliminar método de pago');
    }
  };

  const handleToggleStatus = async (method: MetodoPago) => {
    const newEstado: 'ACTIVO' | 'INACTIVO' = method.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await updateMetodoPago({
        id: method.idMetodoPago,
        data: { nombre: method.nombre, estado: newEstado },
      });
      toast.success(`Método ${newEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`);
    } catch (err) {
      toast.error('Error al cambiar estado');
    }
  };

  const activeMethods = metodoPagos.filter((m: MetodoPago) => m.estado === 'ACTIVO').length;
  const inactiveMethods = metodoPagos.filter((m: MetodoPago) => m.estado === 'INACTIVO').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Métodos de Pago</h1>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Método
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Configura los métodos de pago aceptados en tu negocio
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Métodos</CardDescription>
            <CardTitle className="text-3xl">{metodoPagos.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Configurados en el sistema</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Métodos Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeMethods}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Disponibles para ventas</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Métodos Inactivos</CardDescription>
            <CardTitle className="text-3xl text-red-600">{inactiveMethods}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Deshabilitados temporalmente</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos Configurados</CardTitle>
          <CardDescription>Administra los métodos de pago disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Habilitado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metodoPagos.map((method: MetodoPago) => (
                <TableRow key={method.idMetodoPago}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div className="font-medium">{method.nombre}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      #{method.idMetodoPago}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    {method.estado === 'ACTIVO' ? (
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
                  <TableCell className="text-center">
                    <Switch
                      checked={method.estado === 'ACTIVO'}
                      onCheckedChange={() => handleToggleStatus(method)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(method)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(method)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {metodoPagos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay métodos de pago configurados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </DialogTitle>
            <DialogDescription>
              Configura el nombre y estado del método de pago
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Método *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Tarjeta Visa, Yape, Efectivo..."
                  required
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Estado Activo</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.estado === 'ACTIVO'
                      ? 'El método estará disponible para ventas'
                      : 'El método no estará disponible para ventas'}
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
                {editingMethod ? 'Guardar Cambios' : 'Crear Método'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
