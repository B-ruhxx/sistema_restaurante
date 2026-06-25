import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { PlusCircle, Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useExtras } from '../../hooks/useExtras';

interface ProductExtra {
  id: string;
  nombre: string;
  precio: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export function ProductExtras() {
  const { extras: apiExtras, isLoading, createExtra, updateExtra, deleteExtra } = useExtras();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando extras...</p>
      </div>
    );
  }

  const extras: ProductExtra[] = apiExtras.map((e: any) => ({
    id: String(e.idExtra),
    nombre: e.nombre,
    precio: e.precio,
    estado: e.estado || 'ACTIVO',
  }));

  const filteredExtras = extras.filter(extra => {
    if (extra.estado === 'INACTIVO') return false;
    return extra.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenCreate = () => {
    setEditingExtra(null);
    setFormData({
      nombre: '',
      precio: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (extra: ProductExtra) => {
    setEditingExtra(extra);
    setFormData({
      nombre: extra.nombre,
      precio: String(extra.precio),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.precio) {
      toast.error('El nombre y el precio son obligatorios');
      return;
    }

    try {
      if (editingExtra) {
        await updateExtra({
          id: Number(editingExtra.id),
          data: {
            nombre: formData.nombre,
            precio: parseFloat(formData.precio),
          },
        });
        toast.success('Extra actualizado correctamente');
      } else {
        await createExtra({
          nombre: formData.nombre,
          precio: parseFloat(formData.precio),
        });
        toast.success('Extra creado correctamente');
      }
      setDialogOpen(false);
    } catch (err: any) {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Extras de Productos</h1>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Extra
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Administra los extras adicionales que los clientes pueden agregar a sus pedidos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Extras</CardDescription>
            <CardTitle className="text-3xl">{totalExtras}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-3xl">{activeExtras}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Se pueden usar en pedidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactivos</CardDescription>
            <CardTitle className="text-3xl">{inactiveExtras}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Ocultos del POS</div>
          </CardContent>
        </Card>
      </div>

      {/* Extras Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extras Configurados</CardTitle>
              <CardDescription>Lista de todos los extras disponibles</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar extras..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExtras.map(extra => (
                <TableRow key={extra.id}>
                  <TableCell className="font-medium">{extra.nombre}</TableCell>
                  <TableCell className="text-right font-medium">
                    S/ {extra.precio.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(extra)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(extra.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExtra ? 'Editar Extra' : 'Nuevo Extra'}</DialogTitle>
            <DialogDescription>
              {editingExtra
                ? 'Actualiza la información del extra'
                : 'Completa los datos del nuevo extra'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Extra Queso"
                  required
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="precio">Precio (S/) *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={e => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="0.00"
                    required
                  />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingExtra ? 'Guardar Cambios' : 'Crear Extra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
