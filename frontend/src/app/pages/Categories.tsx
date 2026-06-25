import { useState } from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Tag,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { cn, getFullImageUrl } from '../components/ui/utils';

import { useCategorias } from '../../hooks/useCategorias';
import { Categoria } from '../../api/categorias';
import { useProductos } from '../../hooks/useProductos';
import authApi from '../../api/auth';
import { toast } from '../../lib/notifications';
import { ImageUploadZone } from '../components/ui/image-upload-zone';

const emptyForm = { nombre: '', descripcion: '', img: '' };

export function Categories() {
  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [deleting, setDeleting] = useState<Categoria | null>(null);
  const [form, setForm] = useState(emptyForm);

  const {
    categorias,
    isLoading,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategorias();

  const { productos } = useProductos();

  // Helper to count products in category
  const getProductsCount = (catId: number) => {
    return productos.filter(p => p.idCategoria === catId).length;
  };

  // Local helper for category images based on name or default
  const getCategoryImage = (cat: Categoria) => {
    const imageUrl = cat.img || cat.imagenUrl;
    if (imageUrl) {
      return getFullImageUrl(imageUrl);
    }
    const name = cat.nombre;
    const images: Record<string, string> = {
      hamburguesas: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&h=160&fit=crop&auto=format',
      pizzas: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&h=160&fit=crop&auto=format',
      ensaladas: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=160&h=160&fit=crop&auto=format',
      pastas: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=160&h=160&fit=crop&auto=format',
      bebidas: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=160&h=160&fit=crop&auto=format',
      postres: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=160&h=160&fit=crop&auto=format',
      entradas: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=160&h=160&fit=crop&auto=format',
      combos: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&h=160&fit=crop&auto=format',
    };
    return images[name.toLowerCase()] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&h=160&fit=crop&auto=format';
  };



  const filtered = categorias.filter(c => {
    if (c.estado === 'INACTIVO') return false;
    return c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(search.toLowerCase()));
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditing(cat);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '', img: cat.img || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateCategoria({
          id: editing.idCategoria,
          data: {
            nombre: form.nombre,
            descripcion: form.descripcion || undefined,
            img: form.img || undefined,
          },
        });
      } else {
        await createCategoria({
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          img: form.img || undefined,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (deleting) {
      try {
        await deleteCategoria(deleting.idCategoria);
        setDeleteDialogOpen(false);
        setDeleting(null);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorías</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categorias.length} categorías registradas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        )}
        <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setView('cards')}
            className={cn('p-2 transition-colors', view === 'cards' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={cn('p-2 transition-colors', view === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(cat => (
            <Card key={cat.idCategoria} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={getCategoryImage(cat)}
                    alt={cat.nombre}
                    className="w-full h-36 object-cover rounded-t-lg bg-muted"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-7 w-7 shadow">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(cat)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setDeleting(cat); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">{cat.nombre}</h3>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{cat.descripcion || 'Sin descripción'}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <Tag className="w-3.5 h-3.5" />
                    {getProductsCount(cat.idCategoria)} productos
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="hidden sm:table-cell">Productos</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(cat => (
                <TableRow key={cat.idCategoria}>
                  <TableCell>
                    <img
                      src={getCategoryImage(cat)}
                      alt={cat.nombre}
                      className="w-10 h-10 rounded-lg object-cover bg-muted"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{cat.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{cat.descripcion || '-'}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{getProductsCount(cat.idCategoria)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(cat)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setDeleting(cat); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Hamburguesas"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción breve..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            <ImageUploadZone
              label="Imagen"
              value={form.img}
              onChange={(url) => setForm(f => ({ ...f, img: url }))}
              module="categorias"
              description="Sube una imagen o arrástrala desde tu equipo o internet. Formatos: JPG, PNG, WEBP."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nombre.trim() || isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que deseas eliminar <strong>{deleting?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
