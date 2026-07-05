import { useState } from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Tag,
  RotateCcw,
  Loader2,
  CheckCircle2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { getFullImageUrl } from '../components/ui/utils';

import { useCategorias } from '../../hooks/useCategorias';
import { Categoria, CategoriaEstadoFiltro } from '../../api/categorias';
import { useProductos } from '../../hooks/useProductos';
import { ImageUploadZone } from '../components/ui/image-upload-zone';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';

const emptyForm = { nombre: '', descripcion: '', img: '' };

export function Categories() {
  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<CategoriaEstadoFiltro>('ACTIVO');
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
    updateCategoriaEstado,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategorias({ estado: estadoFilter });

  const { productos } = useProductos();

  const getProductsCount = (catId: number) => {
    return productos.filter(p => p.idCategoria === catId).length;
  };

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

  const handleReactivate = async (cat: Categoria) => {
    try {
      await updateCategoriaEstado({ id: cat.idCategoria, estado: 'ACTIVO' });
    } catch (error) {
      console.error(error);
    }
  };

  const totalActivas = categorias.filter(c => c.estado === 'ACTIVO').length;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Catálogo' },
          { label: 'Categorías' },
        ]}
        icon={Tag}
        iconColor="blue"
        title="Categorías"
        subtitle="Administra las categorías de platos, bebidas y menús para organizar la carta del POS."
        action={
          <Button onClick={openCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          icon={Tag}
          label="Total Categorías"
          value={categorias.length}
          color="slate"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Categorías Activas"
          value={totalActivas}
          color="green"
        />
      </div>

      {/* Toolbar */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar categoría por nombre...',
        }}
        filters={
          <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as CategoriaEstadoFiltro)}>
            <SelectTrigger className="w-44 h-11 rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ACTIVO" className="rounded-lg">Activas</SelectItem>
              <SelectItem value="INACTIVO" className="rounded-lg">Inactivas</SelectItem>
              <SelectItem value="TODOS" className="rounded-lg">Todas</SelectItem>
            </SelectContent>
          </Select>
        }
        actions={
          <div className="flex items-center border border-border rounded-xl bg-muted/20 p-1 overflow-hidden">
            <Button
              size="icon"
              onClick={() => setView('cards')}
              variant={view === 'cards' ? 'default' : 'ghost'}
              className="h-9 w-9 rounded-lg"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setView('table')}
              variant={view === 'table' ? 'default' : 'ghost'}
              className="h-9 w-9 rounded-lg"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando categorías...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin categorías encontradas"
          description="Crea una categoría para agrupar los platos y productos del menú."
          action={
            <Button onClick={openCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
            </Button>
          }
        />
      ) : view === 'cards' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(cat => (
            <Card key={cat.idCategoria} className="group border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex flex-col justify-between">
              <CardContent className="p-0 flex flex-col justify-between flex-1">
                <div>
                  <div className="relative aspect-[4/3] bg-muted border-b border-border/60">
                    <img
                      src={getCategoryImage(cat)}
                      alt={cat.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-7 w-7 shadow-xs rounded-lg">
                            <MoreHorizontal className="w-4 h-4 text-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(cat)} className="rounded-lg">
                            <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                          </DropdownMenuItem>
                          {cat.estado === 'INACTIVO' && (
                            <DropdownMenuItem onClick={() => handleReactivate(cat)} className="rounded-lg">
                              <RotateCcw className="w-4 h-4 mr-2 text-muted-foreground" /> Reactivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="ui-status-danger rounded-lg focus:bg-[var(--status-danger-surface)]"
                            onClick={() => { setDeleting(cat); setDeleteDialogOpen(true); }}
                            disabled={cat.estado === 'INACTIVO'}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Inactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-foreground text-sm truncate">{cat.nombre}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">{cat.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 w-fit px-2.5 py-1 rounded-lg">
                    <Tag className="w-3.5 h-3.5" />
                    {getProductsCount(cat.idCategoria)} productos
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <SectionCard
          title="Listado de categorías"
          description="Estructuración de menús y visualización en el salón."
          icon={Tag}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
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
                        className="w-10 h-10 rounded-lg object-cover bg-muted border border-border"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{cat.nombre}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs leading-normal font-medium">{cat.descripcion || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm font-semibold ui-tabular">{getProductsCount(cat.idCategoria)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(cat)} className="rounded-lg">
                            <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                          </DropdownMenuItem>
                          {cat.estado === 'INACTIVO' && (
                            <DropdownMenuItem onClick={() => handleReactivate(cat)} className="rounded-lg">
                              <RotateCcw className="w-4 h-4 mr-2 text-muted-foreground" /> Reactivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="ui-status-danger rounded-lg focus:bg-[var(--status-danger-surface)]"
                            onClick={() => { setDeleting(cat); setDeleteDialogOpen(true); }}
                            disabled={cat.estado === 'INACTIVO'}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Nombre *</Label>
              <Input
                placeholder="Ej: Hamburguesas"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Descripción</Label>
              <Textarea
                placeholder="Descripción breve sobre la categoría..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="resize-none rounded-xl"
                rows={3}
              />
            </div>
            <ImageUploadZone
              label="Imagen de categoría"
              value={form.img}
              onChange={(url) => setForm(f => ({ ...f, img: url }))}
              module="categorias"
              description="Sube una imagen o arrástrala desde tu equipo o internet. Formatos: JPG, PNG, WEBP."
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nombre.trim() || isCreating || isUpdating} className="h-10 rounded-xl gap-2 font-semibold">
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Inactivar categoría</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            ¿Seguro que deseas inactivar <strong>{deleting?.nombre}</strong>? Los productos asociados permanecerán activos pero sin filtro principal.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="h-10 rounded-xl gap-2 font-semibold">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Inactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
