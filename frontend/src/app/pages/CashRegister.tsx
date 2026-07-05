import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2, ReceiptText, CreditCard, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useERP } from '../contexts/ERPContextValue';
import { cajasApi } from '../../api/cajas';
import { Pedido } from '../../api/pedidos';
import { metodoPagosApi } from '../../api/metodoPagos';
import { precuentasApi } from '../../api/precuentas';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

export function CashRegister() {
  const queryClient = useQueryClient();
  const { cashRegister, openCashRegister, closeCashRegister, addCashMovement } = useERP();
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showCobroDialog, setShowCobroDialog] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [pedidoSearch, setPedidoSearch] = useState('');
  const [cobroMetodoId, setCobroMetodoId] = useState('');
  const [cobroMonto, setCobroMonto] = useState('');
  const [cobroOperacion, setCobroOperacion] = useState('');
  const [cobroComprobante, setCobroComprobante] = useState<'BOLETA' | 'FACTURA' | 'TICKET'>('BOLETA');
  const [openingBalance, setOpeningBalance] = useState('500');
  const [actualBalance, setActualBalance] = useState('');
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [movementMethod, setMovementMethod] = useState<'efectivo' | 'tarjeta' | 'yape' | 'plin'>('efectivo');
  const [movementReferenceType, setMovementReferenceType] = useState('MOVIMIENTO_MANUAL');
  const [movementReferenceId, setMovementReferenceId] = useState('');
  const [movementComprobante, setMovementComprobante] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const totalIngresos = cashRegister?.movements
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const totalEgresos = cashRegister?.movements
    .filter(m => m.type === 'egreso')
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const expectedBalance = (cashRegister?.openingBalance || 0) + totalIngresos - totalEgresos;
  const difference = actualBalance ? parseFloat(actualBalance) - expectedBalance : 0;
  const shiftDurationHours = useMemo(() => {
    if (!cashRegister) return 0;
    return Math.round((currentTime - cashRegister.openedAt.getTime()) / 3600000);
  }, [cashRegister, currentTime]);

  const cajaAbierta = !!cashRegister && cashRegister.status === 'abierta';
  const pedidoSearchTerm = pedidoSearch.trim();

  const pedidosPendientesQuery = useQuery({
    queryKey: ['caja', 'pedidos-pendientes', pedidoSearchTerm],
    queryFn: () => pedidoSearchTerm ? cajasApi.buscarPedidos(pedidoSearchTerm) : cajasApi.getPedidosPendientes(),
    enabled: cajaAbierta,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  });

  const metodosPagoQuery = useQuery({
    queryKey: ['metodoPagos', 'activos'],
    queryFn: metodoPagosApi.getActivos,
    enabled: cajaAbierta,
    staleTime: 60000,
  });

  const precuentasPedidoQuery = useQuery({
    queryKey: ['precuentas', 'pedido', selectedPedido?.idPedido],
    queryFn: () => precuentasApi.getByPedido(selectedPedido!.idPedido),
    enabled: showCobroDialog && !!selectedPedido,
  });

  const selectedMetodoPago = (metodosPagoQuery.data || []).find(
    (metodo) => String(metodo.idMetodoPago) === cobroMetodoId
  );
  const isCobroEfectivo = selectedMetodoPago
    ? selectedMetodoPago.codigo.trim().toUpperCase() === 'EFECTIVO'
    : false;
  const selectedPedidoTotal = selectedPedido?.total || 0;
  const cobroMontoNumber = Number(cobroMonto);
  const cobroVuelto = isCobroEfectivo && Number.isFinite(cobroMontoNumber)
    ? Math.max(cobroMontoNumber - selectedPedidoTotal, 0)
    : 0;
  const cobroFaltante = Number.isFinite(cobroMontoNumber)
    ? Math.max(selectedPedidoTotal - cobroMontoNumber, 0)
    : selectedPedidoTotal;

  const cobrarPedidoMutation = useMutation({
    mutationFn: (pedido: Pedido) => cajasApi.cobrarPedido(pedido.idPedido, {
        tipoComprobante: cobroComprobante,
        pagos: [{
          idMetodoPago: Number(cobroMetodoId),
          monto: Number((pedido.total || 0).toFixed(2)),
          referencia: cobroOperacion.trim() || undefined,
        }],
      }),
    onSuccess: (venta) => {
      queryClient.invalidateQueries({ queryKey: ['caja', 'pedidos-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['cajas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['precuentas'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['cocina', 'comandas'] });
      setShowCobroDialog(false);
      setSelectedPedido(null);
      setCobroMonto('');
      setCobroOperacion('');
      const ventaComprobante = venta.comprobante || [venta.serie, venta.numero].filter(Boolean).join('-') || `#${venta.idVenta}`;
      const vueltoMsg = cobroVuelto > 0 ? ` Vuelto calculado: S/ ${cobroVuelto.toFixed(2)}` : '';
      toast.success(`Venta ${ventaComprobante} cobrada correctamente.${vueltoMsg}`);
    },
  });

  const handleOpenCash = () => {
    openCashRegister(parseFloat(openingBalance), 'Apertura de turno.');
  };

  const handleCloseCash = () => {
    const realAmount = parseFloat(actualBalance);
    const diff = realAmount - expectedBalance;
    const obs = diff !== 0 
      ? `Arqueo con diferencia de S/ ${diff.toFixed(2)}. Saldo real contado: S/ ${realAmount.toFixed(2)}. Saldo esperado: S/ ${expectedBalance.toFixed(2)}.`
      : 'Cierre de caja sin descuadre.';
    closeCashRegister(realAmount, obs);
    setShowCloseDialog(false);
    setActualBalance('');
  };

  const handleAddMovement = () => {
    const amount = parseFloat(movementAmount);
    const referenceId = Number(movementReferenceId);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Ingresa un monto mayor a cero');
      return;
    }
    if (!movementDescription.trim()) {
      toast.error('Ingresa un concepto para el movimiento');
      return;
    }
    if (!movementReferenceType.trim()) {
      toast.error('Ingresa el tipo de referencia');
      return;
    }
    if (!Number.isInteger(referenceId) || referenceId <= 0) {
      toast.error('Ingresa un ID de referencia válido');
      return;
    }
    if (!movementComprobante.trim()) {
      toast.error('Ingresa un comprobante o documento interno');
      return;
    }
    addCashMovement({
      type: movementType,
      amount,
      description: movementDescription.trim(),
      method: movementMethod,
      referenceType: movementReferenceType.trim(),
      referenceId,
      comprobante: movementComprobante.trim(),
    });
    setShowMovementDialog(false);
    setMovementAmount('');
    setMovementDescription('');
    setMovementReferenceType('MOVIMIENTO_MANUAL');
    setMovementReferenceId('');
    setMovementComprobante('');
  };

  const openMovementDialog = () => {
    setMovementReferenceType('MOVIMIENTO_MANUAL');
    setMovementReferenceId(cashRegister?.id || '');
    setMovementComprobante(cashRegister ? `MOV-CAJA-${cashRegister.id}` : '');
    setShowMovementDialog(true);
  };

  const openCobro = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setCobroMonto((pedido.total || 0).toFixed(2));
    const firstMetodo = metodosPagoQuery.data?.[0];
    setCobroMetodoId(firstMetodo ? String(firstMetodo.idMetodoPago) : '');
    setCobroOperacion('');
    setCobroComprobante('BOLETA');
    setShowCobroDialog(true);
  };

  const handleCobrarPedido = () => {
    if (!selectedPedido) return;
    if (!cobroMetodoId) {
      toast.error('Selecciona un método de pago');
      return;
    }
    const montoRecibido = Number(cobroMonto);
    const totalPedido = selectedPedido.total || 0;
    if (!cobroMonto || !Number.isFinite(montoRecibido) || montoRecibido <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (montoRecibido < totalPedido) {
      toast.error(`El monto recibido es insuficiente. Faltan S/ ${(totalPedido - montoRecibido).toFixed(2)}`);
      return;
    }
    if (!isCobroEfectivo && Math.abs(montoRecibido - totalPedido) >= 0.01) {
      toast.error('Para pagos no efectivos, el monto debe ser exacto.');
      return;
    }
    if (selectedMetodoPago?.requiereReferencia && !cobroOperacion.trim()) {
      toast.error('La referencia es obligatoria para este método de pago');
      return;
    }
    if (cobroComprobante === 'FACTURA') {
      const documento = selectedPedido.clienteDocumentoIdentidad || '';
      if (selectedPedido.clienteTipoDocumento !== 'RUC' || !/^\d{11}$/.test(documento)) {
        toast.error('Para emitir factura el pedido debe tener un cliente con RUC válido de 11 dígitos');
        return;
      }
    }
    cobrarPedidoMutation.mutate(selectedPedido);
  };

  const pedidosPendientes = pedidosPendientesQuery.data || [];

  if (!cashRegister || cashRegister.status === 'cerrada') {
    return (
      <div className="p-6 bg-background min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Card className="w-full max-w-md border border-border shadow-md rounded-2xl overflow-hidden bg-card text-card-foreground">
          <CardHeader className="text-center pb-2 pt-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">Apertura de Caja</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Inicia el turno registrando el saldo inicial de caja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="opening" className="text-sm font-semibold text-foreground">Saldo de apertura *</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                  S/
                </span>
                <Input
                  id="opening"
                  type="number"
                  step="0.01"
                  className="pl-10 h-11 rounded-xl focus:ring-2 focus:ring-ring border-border bg-background"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted/30 border border-border/60 p-4 rounded-xl space-y-2 text-xs leading-normal">
              <p className="font-bold text-foreground">
                Instrucciones importantes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 font-medium">
                <li>Cuenta minuciosamente el dinero en efectivo físico de caja.</li>
                <li>Registra el monto inicial exacto para evitar descuadres.</li>
                <li>Valida la autenticidad de billetes y monedas.</li>
              </ul>
            </div>

            <Button onClick={handleOpenCash} className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm" size="lg">
              Abrir Caja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Operaciones' },
          { label: 'Caja' },
        ]}
        icon={Wallet}
        iconColor="blue"
        title="Gestión de Caja"
        subtitle={`Turno activo desde las ${format(cashRegister.openedAt, "HH:mm", { locale: es })}.`}
        action={
          <div className="flex gap-2">
            <Button onClick={openMovementDialog} className="h-11 rounded-xl gap-2 font-semibold text-sm">
              <Plus className="w-4 h-4" />
              Movimiento manual
            </Button>
            <Button variant="destructive" onClick={() => setShowCloseDialog(true)} className="h-11 rounded-xl font-semibold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/95">
              Cerrar caja
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="Saldo Inicial"
          value={`S/ ${cashRegister.openingBalance.toFixed(2)}`}
          color="slate"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Ingresos"
          value={`S/ ${totalIngresos.toFixed(2)}`}
          aux={`${cashRegister.movements.filter(m => m.type === 'ingreso').length} movimientos`}
          color="green"
        />
        <KpiCard
          icon={TrendingDown}
          label="Total Egresos"
          value={`S/ ${totalEgresos.toFixed(2)}`}
          aux={`${cashRegister.movements.filter(m => m.type === 'egreso').length} movimientos`}
          color="red"
        />
        <KpiCard
          icon={Wallet}
          label="Saldo Esperado"
          value={`S/ ${cashRegister.currentBalance.toFixed(2)}`}
          aux="Efectivo + transacciones"
          color="blue"
        />
      </div>

      {/* Toolbar Pedidos por Cobrar */}
      <FilterToolbar
        search={{
          value: pedidoSearch,
          onChange: setPedidoSearch,
          placeholder: 'Buscar pedido por mesa, código o cliente...',
        }}
      />

      {/* Pedidos por Cobrar */}
      <SectionCard
        title="Pedidos por cobrar"
        description="Cobra pedidos listos o servidos. La venta y boleta/factura se genera al confirmar el pago."
        icon={ReceiptText}
        iconColor="blue"
      >
        {pedidosPendientesQuery.isLoading ? (
          <div className="h-28 flex items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Cargando pendientes...</span>
          </div>
        ) : pedidosPendientes.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Sin pedidos pendientes"
            description="Todos los pedidos de las mesas activas han sido cobrados o no se encuentran en estado de cuenta."
          />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosPendientes.map((pedido) => (
                  <TableRow key={pedido.idPedido}>
                    <TableCell className="font-bold text-foreground">#{pedido.idPedido}</TableCell>
                    <TableCell className="font-medium">{pedido.numeroMesa || (pedido.idMesa ? `Mesa ${pedido.idMesa}` : 'Sin mesa')}</TableCell>
                    <TableCell className="text-sm">{pedido.clienteNombre || 'Cliente general'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-xs shadow-2xs">
                        {pedido.estado.replaceAll('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground ui-tabular">
                      S/ {(pedido.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openCobro(pedido)} className="h-9 rounded-xl gap-1.5 font-semibold text-xs">
                        <CreditCard className="w-3.5 h-3.5" />
                        Cobrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Movimientos del Día */}
      <SectionCard
        title="Movimientos del Día"
        description="Historial completo de arqueo e ingresos/egresos registrados en esta caja."
        icon={Wallet}
        iconColor="slate"
      >
        {cashRegister.movements.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sin movimientos registrados"
            description="Aún no se registran movimientos de caja manuales o ventas en este turno."
          />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...cashRegister.movements].reverse().map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {format(movement.createdAt, 'HH:mm', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'ingreso' ? 'success' : 'danger'} className="shadow-2xs font-medium text-[10px] gap-1 px-2 py-0.5">
                        {movement.type === 'ingreso' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{movement.description}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-semibold text-foreground">{movement.referenceType || 'MOVIMIENTO_MANUAL'}</div>
                        <div className="text-muted-foreground font-medium mt-0.5">#{movement.referenceId || cashRegister.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{movement.comprobante || 'Sin comprobante'}</TableCell>
                    <TableCell>
                      <Badge variant="type" className="text-[10px] font-semibold">{movement.method}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold ui-tabular">
                      <span className={movement.type === 'ingreso' ? 'ui-status-success' : 'ui-status-danger'}>
                        {movement.type === 'ingreso' ? '+' : '-'} S/ {movement.amount.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Modal de Cobro */}
      <Dialog open={showCobroDialog} onOpenChange={setShowCobroDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cobrar pedido #{selectedPedido?.idPedido}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Selecciona el medio de pago y emite el comprobante de venta.
            </DialogDescription>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mesa</div>
                  <div className="text-base font-bold text-foreground mt-1">
                    {selectedPedido.numeroMesa || (selectedPedido.idMesa ? `Mesa ${selectedPedido.idMesa}` : 'Sin mesa')}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pedido</div>
                  <div className="text-base font-bold text-foreground mt-1 ui-tabular">S/ {(selectedPedido.total || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Tipo de comprobante</Label>
                <Tabs value={cobroComprobante} onValueChange={(value) => setCobroComprobante(value as 'BOLETA' | 'FACTURA' | 'TICKET')}>
                  <TabsList className="grid w-full grid-cols-3 rounded-xl h-11 p-1 bg-muted/30">
                    <TabsTrigger value="BOLETA" className="rounded-lg h-9">Boleta</TabsTrigger>
                    <TabsTrigger value="FACTURA" className="rounded-lg h-9">Factura</TabsTrigger>
                    <TabsTrigger value="TICKET" className="rounded-lg h-9">Ticket</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Historial de Precuentas */}
              <div className="rounded-xl border border-border bg-muted/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Precuentas emitidas</span>
                  {precuentasPedidoQuery.isFetching && <span className="text-[10px] text-muted-foreground">Actualizando...</span>}
                </div>
                {(precuentasPedidoQuery.data || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground font-medium">No se han emitido precuentas.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(precuentasPedidoQuery.data || []).map((precuenta) => (
                      <div key={precuenta.idPrecuenta} className="flex items-center justify-between rounded-lg border border-border bg-card p-2 text-xs shadow-2xs">
                        <div>
                          <div className="font-bold text-foreground">{precuenta.numero}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(precuenta.fechaEmision), 'dd MMM HH:mm', { locale: es })}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-semibold text-[10px]">{precuenta.estado}</Badge>
                          <div className="text-xs font-bold text-foreground mt-1 ui-tabular">S/ {(precuenta.total || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-method" className="text-sm font-semibold text-foreground">Método de pago *</Label>
                <select
                  id="payment-method"
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={cobroMetodoId}
                  onChange={(event) => {
                    setCobroMetodoId(event.target.value);
                    setCobroOperacion('');
                  }}
                >
                  <option value="">Selecciona un método de pago</option>
                  {(metodosPagoQuery.data || []).map((metodo) => (
                    <option key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                      {metodo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-amount" className="text-sm font-semibold text-foreground">{isCobroEfectivo ? 'Monto recibido *' : 'Monto pagado'}</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">S/</span>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    className="pl-10 h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring"
                    value={cobroMonto}
                    onChange={(event) => setCobroMonto(event.target.value)}
                  />
                </div>
                {isCobroEfectivo && (
                  <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-xs font-semibold text-muted-foreground">Vuelto</div>
                      <div className="text-lg font-bold ui-status-success mt-0.5 ui-tabular">S/ {cobroVuelto.toFixed(2)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-xs font-semibold text-muted-foreground">Faltante</div>
                      <div className={cn('text-lg font-bold mt-0.5 ui-tabular', cobroFaltante > 0 ? 'ui-status-danger' : 'text-foreground')}>
                        S/ {cobroFaltante.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
                {!isCobroEfectivo && (
                  <p className="text-xs text-muted-foreground font-medium pl-1">
                    Los pagos no efectivos deben ser exactos al monto del pedido.
                  </p>
                )}
              </div>

              {selectedMetodoPago?.requiereReferencia && (
                <div className="space-y-1.5">
                  <Label htmlFor="payment-operation" className="text-sm font-semibold text-foreground">Referencia de pago *</Label>
                  <Input
                    id="payment-operation"
                    value={cobroOperacion}
                    onChange={(event) => setCobroOperacion(event.target.value)}
                    placeholder="Código de voucher o referencia digital"
                    className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setShowCobroDialog(false)} className="h-10 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCobrarPedido} disabled={cobrarPedidoMutation.isPending} className="h-10 rounded-xl gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {cobrarPedidoMutation.isPending ? 'Cobrando...' : 'Confirmar cobro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cierre de Caja */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cierre de Caja y Arqueo</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Verifica el balance del turno y registra el saldo físico real en caja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo Inicial</div>
                <div className="text-xl font-bold text-foreground mt-1 ui-tabular">
                  S/ {cashRegister.openingBalance.toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo Esperado</div>
                <div className="text-xl font-bold text-foreground mt-1 ui-tabular">
                  S/ {expectedBalance.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Arqueo */}
            <div className="space-y-1.5">
              <Label htmlFor="actual" className="text-sm font-semibold text-foreground">Saldo Real Contado (Efectivo físico) *</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                  S/
                </span>
                <Input
                  id="actual"
                  type="number"
                  step="0.01"
                  className="pl-10 h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring"
                  value={actualBalance}
                  onChange={(e) => setActualBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {actualBalance && (
                <div className={cn('p-3.5 rounded-xl border mt-2', difference === 0 ? 'ui-status-success-soft' : 'ui-status-danger-soft')}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Diferencia de arqueo:</span>
                    <span className={cn('text-lg font-bold ui-tabular', difference >= 0 ? 'ui-status-success' : 'ui-status-danger')}>
                      {difference > 0 ? '+' : ''} S/ {difference.toFixed(2)}
                    </span>
                  </div>
                  {difference !== 0 && (
                    <p className="text-xs text-muted-foreground mt-1 leading-normal font-medium">
                      {difference > 0 ? 'Sobrante detectado en caja física.' : 'Faltante detectado. Por favor justifique la diferencia.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resumen de Movimientos */}
            <div className="bg-muted/30 border border-border/60 p-4 rounded-xl space-y-2.5 text-xs leading-normal">
              <h4 className="font-bold text-foreground">Estadísticas de Turno</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos del día:</span>
                  <span className="font-semibold ui-status-success">+S/ {totalIngresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Egresos del día:</span>
                  <span className="font-semibold ui-status-danger">-S/ {totalEgresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total movimientos:</span>
                  <span className="font-semibold text-foreground">{cashRegister.movements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración del turno:</span>
                  <span className="font-semibold text-foreground">{shiftDurationHours} horas</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)} className="h-10 rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleCloseCash}
              disabled={!actualBalance}
              className="h-10 rounded-xl gap-2 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar Turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Nuevo Movimiento */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Registrar Movimiento de Caja</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Ingresa un egreso o ingreso de dinero manual en efectivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Tabs value={movementType} onValueChange={(v) => setMovementType(v as 'ingreso' | 'egreso')}>
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 p-1 bg-muted/30">
                <TabsTrigger value="ingreso" className="rounded-lg h-9">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ingreso
                </TabsTrigger>
                <TabsTrigger value="egreso" className="rounded-lg h-9">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Egreso
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-semibold text-foreground">Monto *</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                  S/
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-10 h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method" className="text-sm font-semibold text-foreground">Medio de pago</Label>
              <select
                id="method"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={movementMethod}
                onChange={(e) => setMovementMethod(e.target.value as 'efectivo' | 'tarjeta' | 'yape' | 'plin')}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="reference-type" className="text-xs font-semibold text-foreground">Tipo referencia *</Label>
                <Input
                  id="reference-type"
                  value={movementReferenceType}
                  onChange={(e) => setMovementReferenceType(e.target.value)}
                  placeholder="MOVIMIENTO_MANUAL"
                  className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reference-id" className="text-xs font-semibold text-foreground">ID referencia *</Label>
                <Input
                  id="reference-id"
                  type="number"
                  min="1"
                  step="1"
                  value={movementReferenceId}
                  onChange={(e) => setMovementReferenceId(e.target.value)}
                  placeholder={cashRegister.id}
                  className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="movement-comprobante" className="text-sm font-semibold text-foreground">Documento o Comprobante *</Label>
              <Input
                id="movement-comprobante"
                value={movementComprobante}
                onChange={(e) => setMovementComprobante(e.target.value)}
                placeholder={`MOV-CAJA-${cashRegister.id}`}
                className="h-11 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">Concepto / Motivo *</Label>
              <Textarea
                id="description"
                placeholder="Describe el por qué del movimiento de efectivo..."
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
                rows={3}
                className="rounded-xl resize-none border-border bg-background focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setShowMovementDialog(false)} className="h-10 rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMovement}
              disabled={!movementAmount || !movementDescription || !movementReferenceType || !movementReferenceId || !movementComprobante}
              className="h-10 rounded-xl font-semibold"
            >
              Registrar movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
