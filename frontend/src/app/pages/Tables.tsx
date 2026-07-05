import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Armchair, Plus, RefreshCw, Users, MapPin, Pencil, Wallet, Loader2 } from 'lucide-react';
import { mesasApi, Mesa, MesaEstado, MesaRequest } from '../../api/mesas';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { PageWrapper, ModuleHeader, KpiCard, EmptyState } from '../components/ui/erp-layout';

const ESTADO_META: Record<MesaEstado, { label: string; className: string }> = {
  DISPONIBLE: { label: 'Disponible', className: 'ui-status-success-soft border' },
  ATENCION: { label: 'En atención', className: 'ui-status-warning-soft border' },
  EN_COCINA: { label: 'En cocina', className: 'ui-status-info-soft border' },
  SERVIDO: { label: 'Servido', className: 'ui-status-success-soft border' },
  CUENTA: { label: 'En cuenta', className: 'ui-status-info-soft border' },
  BLOQUEADA: { label: 'Bloqueada', className: 'bg-muted text-muted-foreground border border-border' },
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
  const libres = mesas.filter(m => m.estado === 'DISPONIBLE').length;
  const ocupadas = mesas.filter(m => m.estado !== 'DISPONIBLE').length;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Operaciones' },
          { label: 'Mesas' },
        ]}
        icon={Armchair}
        iconColor="blue"
        title="Mesas"
        subtitle="Control visual de salón, distribución y estados de pedidos activos por mesa."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => mesasQuery.refetch()} className="h-11 rounded-xl gap-2 font-semibold text-sm">
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
            <Button onClick={openCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold text-sm">
              <Plus className="w-4 h-4" />
              Nueva mesa
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={Armchair}
          label="Total mesas"
          value={mesas.length}
          color="slate"
        />
        <KpiCard
          icon={Armchair}
          label="Mesas libres"
          value={libres}
          color="green"
        />
        <KpiCard
          icon={Armchair}
          label="Mesas ocupadas"
          value={ocupadas}
          color="amber"
        />
      </div>

      {/* Grid of Tables */}
      {mesasQuery.isLoading ? (
        <div className="h-40 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando mesas...</span>
        </div>
      ) : mesas.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No hay mesas registradas"
          description="Crea la primera mesa para iniciar la asignación de pedidos en el salón."
          action={
            <Button onClick={openCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nueva mesa
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mesas.map((mesa) => {
            const meta = ESTADO_META[mesa.estado];
            return (
              <Card key={mesa.idMesa} className="overflow-hidden border border-border bg-card shadow-sm rounded-2xl hover:border-primary/30 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Mesa {mesa.numero}</CardTitle>
                      {mesa.nombre && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{mesa.nombre}</p>}
                    </div>
                    <Badge variant="outline" className={cn('border font-semibold shadow-2xs text-[10px] px-2 py-0.5', meta.className)}>{meta.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {mesa.capacidad} personas</span>
                      {mesa.ubicacion && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {mesa.ubicacion}</span>}
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-[10px] text-muted-foreground leading-normal font-medium">
                      El estado se actualiza automáticamente según el pedido, cocina y caja.
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/40">
                    <Button variant="outline" onClick={() => openEdit(mesa)} className="h-10 rounded-xl text-xs gap-1 font-semibold">
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                    {mesa.estado === 'CUENTA' ? (
                      <Button variant="secondary" onClick={() => navigate('/caja')} className="h-10 rounded-xl text-xs gap-1 font-semibold bg-primary/10 text-primary hover:bg-primary/20">
                        <Wallet className="w-3.5 h-3.5" />
                        Cobrar
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(`/pos?mesa=${mesa.idMesa}`)}
                        disabled={mesa.estado === 'BLOQUEADA'}
                        className="h-10 rounded-xl text-xs font-semibold"
                      >
                        {mesa.estado === 'DISPONIBLE' ? 'Atender' : mesa.estado === 'BLOQUEADA' ? 'Bloqueada' : 'Ver pedido'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Mesa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editing ? 'Editar mesa' : 'Nueva mesa'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Número *</Label>
              <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ej. 10" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Capacidad *</Label>
              <Input type="number" min={1} value={form.capacidad || 1} onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Nombre descriptivo</Label>
              <Input value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Terraza Central" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Ubicación</Label>
              <Input value={form.ubicacion || ''} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ej. Zona A" className="h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.numero || saveMutation.isPending} className="h-10 rounded-xl">
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
