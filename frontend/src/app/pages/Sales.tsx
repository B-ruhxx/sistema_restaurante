import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
  Ban,
  Eye,
  Loader2,
  ReceiptText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useVentas } from '../../hooks/useVentas';
import { ventasApi, type Venta } from '../../api/ventas';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const statusStyle: Record<Venta['estado'], string> = {
  EMITIDA: 'ui-status-success-soft',
  ANULADA: 'ui-status-danger-soft',
};

export function Sales() {
  const { ventas, isLoading, anularVenta, isAnulling } = useVentas();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | Venta['estado']>('TODAS');
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const ventaLabel = (venta: Venta) => venta.comprobante || [venta.serie, venta.numero].filter(Boolean).join('-') || `#${venta.idVenta}`;

  const filteredVentas = ventas.filter((venta) => {
    const query = search.trim().toLowerCase();
    const matchesStatus = statusFilter === 'TODAS' || venta.estado === statusFilter;
    if (!matchesStatus) return false;
    if (!query) return true;
    return [
      venta.comprobante,
      venta.serie,
      venta.numero,
      venta.idVenta,
      venta.cajeroNombre,
      venta.tipoComprobante,
      venta.estado,
      venta.idPedido,
      venta.idCaja,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const totals = ventas.reduce(
    (acc, venta) => {
      acc[venta.estado] += 1;
      if (venta.estado === 'EMITIDA') acc.emitidasTotal += venta.total || 0;
      return acc;
    },
    { EMITIDA: 0, ANULADA: 0, emitidasTotal: 0 }
  );

  const openDetail = async (venta: Venta) => {
    setDetailLoading(true);
    try {
      const detail = await ventasApi.getById(venta.idVenta);
      setSelectedVenta(detail);
    } catch (error) {
      console.error(error);
      setSelectedVenta(venta);
      toast.error('No se pudo cargar el detalle completo de la venta');
    } finally {
      setDetailLoading(false);
    }
  };

  const openVoidDialog = (venta: Venta) => {
    setSelectedVenta(venta);
    setVoidReason('');
    setVoidOpen(true);
  };

  const closeVoidDialog = () => {
    setVoidOpen(false);
    setSelectedVenta(null);
  };

  const handleVoid = async () => {
    if (!selectedVenta) return;
    if (selectedVenta.estado === 'ANULADA') {
      toast.error('La venta ya esta anulada');
      return;
    }
    if (voidReason.trim().length < 5) {
      toast.error('Ingresa un motivo de anulacion mas descriptivo');
      return;
    }
    await anularVenta({ id: selectedVenta.idVenta, motivo: voidReason.trim() });
    toast.success('Venta anulada. Se actualizaron stock, caja y pedido vinculado si corresponde.');
    setVoidOpen(false);
    setSelectedVenta(null);
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando ventas...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Ventas' },
        ]}
        icon={ReceiptText}
        iconColor="blue"
        title="Ventas"
        subtitle="Gestiona ventas emitidas y anulaciones con impacto en caja, pedidos e inventario."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={ReceiptText}
          label="Total ventas"
          value={ventas.length}
          color="slate"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Emitidas"
          value={totals.EMITIDA}
          aux={`S/ ${totals.emitidasTotal.toFixed(2)} acumulado`}
          color="green"
        />
        <KpiCard
          icon={XCircle}
          label="Anuladas"
          value={totals.ANULADA}
          color="red"
        />
      </div>

      {/* Toolbar */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar código, cajero o pedido...',
        }}
        filters={
          <select
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'TODAS' | Venta['estado'])}
          >
            <option value="TODAS">Todos los estados</option>
            <option value="EMITIDA">Emitidas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
        }
      />

      {/* Card Principal */}
      <SectionCard
        title="Registro de ventas"
        description="Abre el detalle para revisar pagos o ejecutar acciones controladas."
        icon={ReceiptText}
        iconColor="blue"
      >
        {filteredVentas.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Sin ventas registradas"
            description="No se encontraron ventas para los criterios de búsqueda o filtros seleccionados."
          />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentas.map((venta) => (
                  <TableRow key={venta.idVenta}>
                    <TableCell>
                      <div className="font-medium text-foreground">{ventaLabel(venta)}</div>
                      <div className="text-xs text-muted-foreground">
                        Pedido {venta.idPedido ? `#${venta.idPedido}` : 'directo'} · Caja #{venta.idCaja}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(venta.fecha), 'dd MMM yyyy HH:mm', { locale: es })}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{venta.tipoComprobante}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{venta.cajeroNombre || 'Sin registro'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-medium shadow-2xs', statusStyle[venta.estado])}>
                        {venta.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground ui-tabular">S/ {(venta.total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openDetail(venta)} title="Ver detalle">
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        {venta.estado !== 'ANULADA' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => openVoidDialog(venta)}
                            title="Anular venta"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Detalle de Venta */}
      <Dialog open={!!selectedVenta && !voidOpen} onOpenChange={() => setSelectedVenta(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detalle de venta {selectedVenta ? ventaLabel(selectedVenta) : ''}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {detailLoading ? 'Cargando detalle...' : 'Comprobante, pagos y líneas registradas.'}
            </DialogDescription>
          </DialogHeader>
          {selectedVenta && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</div>
                  <Badge variant="outline" className={cn('mt-1.5 font-medium', statusStyle[selectedVenta.estado])}>{selectedVenta.estado}</Badge>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</div>
                  <div className="text-lg font-bold text-foreground mt-1 ui-tabular">S/ {(selectedVenta.total || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IGV</div>
                  <div className="text-lg font-bold text-foreground mt-1 ui-tabular">S/ {(selectedVenta.igv || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Caja</div>
                  <div className="text-lg font-bold text-foreground mt-1 ui-tabular">#{selectedVenta.idCaja}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Líneas de Comprobante</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedVenta.detalles || []).map((detalle) => (
                        <TableRow key={detalle.idDetalle}>
                          <TableCell className="font-medium text-foreground">{detalle.nombreProducto || detalle.nombreCombo || 'Item'}</TableCell>
                          <TableCell className="text-right ui-tabular">{detalle.cantidad}</TableCell>
                          <TableCell className="text-right ui-tabular">S/ {(detalle.precioUnitario || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-foreground ui-tabular">S/ {(detalle.subtotal || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {(selectedVenta.detalles || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                            Sin detalle disponible.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Desglose de Pagos</h3>
                <div className="space-y-2.5">
                  {(selectedVenta.pagos || []).map((pago) => (
                    <div key={pago.idVentaPago} className="flex items-center justify-between rounded-xl border border-border bg-muted/10 p-3.5 text-sm">
                      <div>
                        <div className="font-semibold text-foreground">{pago.nombreMetodoPago}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Estado {pago.estado}{pago.referencia ? ` · Ref. ${pago.referencia}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground ui-tabular">S/ {(pago.monto || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {(selectedVenta.pagos || []).length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Sin pagos registrados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            {selectedVenta && selectedVenta.estado !== 'ANULADA' && (
              <Button variant="destructive" onClick={() => openVoidDialog(selectedVenta)} className="gap-2 h-10 rounded-xl">
                <Ban className="w-4 h-4" />
                Anular venta
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedVenta(null)} className="h-10 rounded-xl">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Anulación */}
      <Dialog open={voidOpen} onOpenChange={(open) => (open ? setVoidOpen(true) : closeVoidDialog())}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Anular venta {selectedVenta ? ventaLabel(selectedVenta) : ''}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Esta acción revierte inventario y registra el movimiento financiero vinculado a la venta emitida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Label htmlFor="void-reason" className="text-sm font-semibold">Motivo de anulación *</Label>
            <Textarea
              id="void-reason"
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              rows={4}
              placeholder="Describe detalladamente por qué se anula la venta (mínimo 5 caracteres)"
              className="rounded-xl resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={closeVoidDialog} className="h-10 rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={isAnulling} className="gap-2 h-10 rounded-xl">
              <Ban className="w-4 h-4" />
              {isAnulling ? 'Anulando...' : 'Anular venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
