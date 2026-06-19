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
import { PlusCircle, Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ProductExtra {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'Ingredientes' | 'Salsas' | 'Acompañamientos' | 'Bebidas';
  usosHoy: number;
}

const mockExtras: ProductExtra[] = [
  {
    id: '1',
    nombre: 'Extra Queso',
    descripcion: 'Queso mozzarella adicional',
    precio: 3.50,
    categoria: 'Ingredientes',
    usosHoy: 45,
  },
  {
    id: '2',
    nombre: 'Tocino',
    descripcion: 'Tocino ahumado crujiente',
    precio: 5.00,
    categoria: 'Ingredientes',
    usosHoy: 38,
  },
  {
    id: '3',
    nombre: 'Salsa BBQ',
    descripcion: 'Salsa barbecue casera',
    precio: 1.50,
    categoria: 'Salsas',
    usosHoy: 62,
  },
  {
    id: '4',
    nombre: 'Salsa Picante',
    descripcion: 'Salsa picante de la casa',
    precio: 1.50,
    categoria: 'Salsas',
    usosHoy: 54,
  },
  {
    id: '5',
    nombre: 'Papas Fritas',
    descripcion: 'Porción adicional de papas',
    precio: 6.00,
    categoria: 'Acompañamientos',
    usosHoy: 28,
  },
  {
    id: '6',
    nombre: 'Aros de Cebolla',
    descripcion: 'Aros de cebolla empanizados',
    precio: 7.50,
    categoria: 'Acompañamientos',
    usosHoy: 19,
  },
  {
    id: '7',
    nombre: 'Aguacate',
    descripcion: 'Aguacate fresco en rodajas',
    precio: 4.00,
    categoria: 'Ingredientes',
    usosHoy: 31,
  },
  {
    id: '8',
    nombre: 'Champiñones',
    descripcion: 'Champiñones salteados',
    precio: 4.50,
    categoria: 'Ingredientes',
    usosHoy: 22,
  },
];

export function ProductExtras() {
  const [extras, setExtras] = useState<ProductExtra[]>(mockExtras);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'Ingredientes' as ProductExtra['categoria'],
  });

  const filteredExtras = extras.filter(extra =>
    extra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    extra.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingExtra(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: 'Ingredientes',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (extra: ProductExtra) => {
    setEditingExtra(extra);
    setFormData({
      nombre: extra.nombre,
      descripcion: extra.descripcion,
      precio: String(extra.precio),
      categoria: extra.categoria,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingExtra) {
      setExtras(
        extras.map(ex =>
          ex.id === editingExtra.id
            ? { ...ex, ...formData, precio: parseFloat(formData.precio) }
            : ex
        )
      );
      toast.success('Extra actualizado correctamente');
    } else {
      const newExtra: ProductExtra = {
        id: String(extras.length + 1),
        ...formData,
        precio: parseFloat(formData.precio),
        usosHoy: 0,
      };
      setExtras([...extras, newExtra]);
      toast.success('Extra creado correctamente');
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setExtras(extras.filter(ex => ex.id !== id));
    toast.success('Extra eliminado correctamente');
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'Ingredientes':
        return 'bg-orange-500';
      case 'Salsas':
        return 'bg-red-500';
      case 'Acompañamientos':
        return 'bg-yellow-500';
      case 'Bebidas':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const totalExtras = extras.length;
  const totalUsosHoy = extras.reduce((sum, ex) => sum + ex.usosHoy, 0);
  const ingresosPorExtras = extras.reduce((sum, ex) => sum + ex.precio * ex.usosHoy, 0);
  const extraMasVendido = [...extras].sort((a, b) => b.usosHoy - a.usosHoy)[0];

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardDescription>Vendidos Hoy</CardDescription>
            <CardTitle className="text-3xl">{totalUsosHoy}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Unidades</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos por Extras</CardDescription>
            <CardTitle className="text-3xl">S/ {ingresosPorExtras.toFixed(0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Hoy</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Más Vendido</CardDescription>
            <CardTitle className="text-lg truncate">{extraMasVendido?.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {extraMasVendido?.usosHoy} unidades hoy
            </div>
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
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Vendidos Hoy</TableHead>
                <TableHead className="text-right">Ingresos Hoy</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExtras.map(extra => (
                <TableRow key={extra.id}>
                  <TableCell className="font-medium">{extra.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{extra.descripcion}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getCategoryColor(extra.categoria)}>
                      {extra.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    S/ {extra.precio.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{extra.usosHoy}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    S/ {(extra.precio * extra.usosHoy).toFixed(2)}
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
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción breve del extra"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        categoria: e.target.value as ProductExtra['categoria'],
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="Ingredientes">Ingredientes</option>
                    <option value="Salsas">Salsas</option>
                    <option value="Acompañamientos">Acompañamientos</option>
                    <option value="Bebidas">Bebidas</option>
                  </select>
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
