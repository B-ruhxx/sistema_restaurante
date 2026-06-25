import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Armchair, Plus, RefreshCw, Users, MapPin, Pencil, Wallet } from 'lucide-react';
import { mesasApi, Mesa, MesaEstado, MesaRequest } from '../../api/mesas';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';

const ESTADO_META: Record<MesaEstado, { label: string; className: string }> = {
  LIBRE: { label: 'Libre', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OCUPADA: { label: 'Ocupada', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ESPERANDO_COCINA: { label: 'En cocina', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  SERVIDO: { label: 'Servido', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  CUENTA_EMITIDA: { label: 'Cuenta emitida', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  PAGADA: { label: 'Pagada', className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const emptyForm: MesaRequest = { numero: '', nombre: '', capacidad: 4, ubicacion: '' };

export function Tables() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Mesa | null>(null);
  const [form, setForm] = useState<MesaRequest>(emptyForm);

  const mesasQuery = useQuery({
    queryKey: ['mesas'],
    queryFn: mesasApi.getAll,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: MesaRequest) => editing ? mesasApi.update(editing.idMesa, payload) : mesasApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      setDialogOpen(false);
      toast.success(editing ? 'Mesa actualizada' : 'Mesa creada');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (mesa: Mesa) => {
    setEditing(mesa);
    setForm({
      numero: mesa.numero,
      nombre: mesa.nombre || '',
      capacidad: mesa.capacidad,
      ubicacion: mesa.ubicacion || '',
      estado: mesa.estado,
    });
    setDialogOpen(true);
  };

  const mesas = mesasQuery.data || [];
  const libres = mesas.filter(m => m.estado === 'LIBRE').length;
  const ocupadas = mesas.filter(m => m.estado !== 'LIBRE').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Armchair className="w-6 h-6" />
            Mesas
          </h1>
          <p className="text-sm text-muted-foreground">Control visual de salón y pedidos activos por mesa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mesasQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva mesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{mesas.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Libres</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-600">{libres}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">En atención</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{ocupadas}</CardContent>
        </Card>
      </div>

      {mesasQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando mesas...</div>
      ) : mesas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No hay mesas registradas. Crea la primera para iniciar el flujo POS.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mesas.map((mesa) => {
            const meta = ESTADO_META[mesa.estado];
            return (
              <Card key={mesa.idMesa} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl">Mesa {mesa.numero}</CardTitle>
                      {mesa.nombre && <p className="text-sm text-muted-foreground">{mesa.nombre}</p>}
                    </div>
                    <Badge variant="outline" className={cn('border', meta.className)}>{meta.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {mesa.capacidad} personas</span>
                    {mesa.ubicacion && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {mesa.ubicacion}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => openEdit(mesa)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    {mesa.estado === 'CUENTA_EMITIDA' ? (
                      <Button variant="secondary" onClick={() => navigate('/caja')}>
                        <Wallet className="w-4 h-4 mr-2" />
                        Ir a caja
                      </Button>
                    ) : (
                      <Button onClick={() => navigate(`/pos?mesa=${mesa.idMesa}`)}>
                        Atender POS
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar mesa' : 'Nueva mesa'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input type="number" min={1} value={form.capacidad || 1} onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={form.ubicacion || ''} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.numero || saveMutation.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
