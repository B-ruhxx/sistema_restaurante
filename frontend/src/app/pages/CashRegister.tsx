import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2, Search, ReceiptText, CreditCard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useERP } from '../contexts/ERPContext';
import { cajasApi } from '../../api/cajas';
import { Pedido } from '../../api/pedidos';
import { metodoPagosApi } from '../../api/metodoPagos';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function CashRegister() {
  const queryClient = useQueryClient();
  const { cashRegister, openCashRegister, closeCashRegister, addCashMovement } = useERP();
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showCobroDialog, setShowCobroDialog] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [pedidoSearch, setPedidoSearch] = useState('');
  const [cobroMetodoId, setCobroMetodoId] = useState('');
  const [cobroMonto, setCobroMonto] = useState('');
  const [cobroComprobante, setCobroComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA');
  const [openingBalance, setOpeningBalance] = useState('500');
  const [actualBalance, setActualBalance] = useState('');
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [movementMethod, setMovementMethod] = useState<'efectivo' | 'tarjeta' | 'yape' | 'plin'>('efectivo');

  const totalIngresos = cashRegister?.movements
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const totalEgresos = cashRegister?.movements
    .filter(m => m.type === 'egreso')
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const expectedBalance = (cashRegister?.openingBalance || 0) + totalIngresos - totalEgresos;
  const difference = actualBalance ? parseFloat(actualBalance) - expectedBalance : 0;

  const cajaAbierta = !!cashRegister && cashRegister.status === 'abierta';

  const pedidosPendientesQuery = useQuery({
    queryKey: ['caja', 'pedidos-pendientes'],
    queryFn: cajasApi.getPedidosPendientes,
    enabled: cajaAbierta,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  });

  const metodosPagoQuery = useQuery({
    queryKey: ['metodo-pagos', 'activos'],
    queryFn: metodoPagosApi.getActivos,
    enabled: cajaAbierta,
    staleTime: 60000,
  });

  const cobrarPedidoMutation = useMutation({
    mutationFn: (pedido: Pedido) => cajasApi.cobrarPedido(pedido.idPedido, {
      tipoComprobante: cobroComprobante,
      pagos: [{
        idMetodoPago: Number(cobroMetodoId),
        monto: Number(cobroMonto),
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
      toast.success(`Venta ${venta.codigoVenta || `#${venta.idVenta}`} pagada correctamente`);
    },
  });

  const handleOpenCash = () => {
    openCashRegister(parseFloat(openingBalance), 'Apertura de turno.');
    setShowOpenDialog(false);
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
    addCashMovement({
      type: movementType,
      amount: parseFloat(movementAmount),
      description: movementDescription,
      method: movementMethod
    });
    setShowMovementDialog(false);
    setMovementAmount('');
    setMovementDescription('');
  };

  const openCobro = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setCobroMonto((pedido.total || 0).toFixed(2));
    const firstMetodo = metodosPagoQuery.data?.[0];
    setCobroMetodoId(firstMetodo ? String(firstMetodo.idMetodoPago) : '');
    setCobroComprobante('BOLETA');
    setShowCobroDialog(true);
  };

  const handleCobrarPedido = () => {
    if (!selectedPedido) return;
    if (!cobroMetodoId) {
      toast.error('Selecciona un método de pago');
      return;
    }
    if (!cobroMonto || Number(cobroMonto) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    cobrarPedidoMutation.mutate(selectedPedido);
  };

  const pedidosPendientes = (pedidosPendientesQuery.data || []).filter((pedido) => {
    const query = pedidoSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      pedido.idPedido,
      pedido.numeroMesa,
      pedido.clienteNombre,
      pedido.estado,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });

  if (!cashRegister || cashRegister.status === 'cerrada') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Apertura de Caja</CardTitle>
              <CardDescription>
                Inicia el turno registrando el saldo inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opening">Saldo de Apertura</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    S/
                  </span>
                  <Input
                    id="opening"
                    type="number"
                    step="0.01"
                    className="pl-10"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Instrucciones:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Cuenta el dinero físico en caja</li>
                  <li>Registra el monto exacto</li>
                  <li>Verifica billetes falsos</li>
                </ul>
              </div>

              <Button onClick={handleOpenCash} className="w-full" size="lg">
                Abrir Caja
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con Estado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Gestión de Caja
          </h1>
          <p className="text-muted-foreground">
            Abierta desde {format(cashRegister.openedAt, "HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowMovementDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Movimiento
          </Button>
          <Button variant="destructive" onClick={() => setShowCloseDialog(true)}>
            Cerrar Caja
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {cashRegister.openingBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              S/ {totalIngresos.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cashRegister.movements.filter(m => m.type === 'ingreso').length} movimientos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              S/ {totalEgresos.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cashRegister.movements.filter(m => m.type === 'egreso').length} movimientos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
            <Wallet className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {cashRegister.currentBalance.toFixed(2)}
            </div>
            <p className="text-xs opacity-80 mt-1">
              Saldo esperado
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5" />
                Pedidos por cobrar
              </CardTitle>
              <CardDescription>
                Cobra pedidos entregados o con precuenta emitida. La venta se genera solo al confirmar el pago.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={pedidoSearch}
                onChange={(event) => setPedidoSearch(event.target.value)}
                placeholder="Buscar mesa, pedido o cliente"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {pedidosPendientesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Cargando pedidos pendientes...
                  </TableCell>
                </TableRow>
              )}

              {!pedidosPendientesQuery.isLoading && pedidosPendientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay pedidos listos para cobrar.
                  </TableCell>
                </TableRow>
              )}

              {pedidosPendientes.map((pedido) => (
                <TableRow key={pedido.idPedido}>
                  <TableCell className="font-medium">#{pedido.idPedido}</TableCell>
                  <TableCell>{pedido.numeroMesa || (pedido.idMesa ? `Mesa ${pedido.idMesa}` : 'Sin mesa')}</TableCell>
                  <TableCell>{pedido.clienteNombre || 'Cliente general'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{pedido.estado.replaceAll('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    S/ {(pedido.total || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => openCobro(pedido)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Cobrar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabla de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos del Día</CardTitle>
          <CardDescription>
            Historial de transacciones de la caja actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...cashRegister.movements].reverse().map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {format(movement.createdAt, 'HH:mm', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.type === 'ingreso' ? 'default' : 'destructive'}>
                      {movement.type === 'ingreso' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {movement.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{movement.method}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={movement.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                      {movement.type === 'ingreso' ? '+' : '-'} S/ {movement.amount.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCobroDialog} onOpenChange={setShowCobroDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar pedido #{selectedPedido?.idPedido}</DialogTitle>
            <DialogDescription>
              Confirma el pago para convertir el pedido en venta pagada y liberar la mesa.
            </DialogDescription>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Mesa</div>
                    <div className="text-lg font-semibold">
                      {selectedPedido.numeroMesa || (selectedPedido.idMesa ? `Mesa ${selectedPedido.idMesa}` : 'Sin mesa')}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-lg font-semibold">S/ {(selectedPedido.total || 0).toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Tipo de comprobante</Label>
                <Tabs value={cobroComprobante} onValueChange={(value) => setCobroComprobante(value as 'BOLETA' | 'FACTURA')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="BOLETA">Boleta</TabsTrigger>
                    <TabsTrigger value="FACTURA">Factura</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de pago</Label>
                <select
                  id="payment-method"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={cobroMetodoId}
                  onChange={(event) => setCobroMetodoId(event.target.value)}
                >
                  <option value="">Selecciona un método</option>
                  {(metodosPagoQuery.data || []).map((metodo) => (
                    <option key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                      {metodo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">Monto pagado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    className="pl-10"
                    value={cobroMonto}
                    onChange={(event) => setCobroMonto(event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCobroDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCobrarPedido} disabled={cobrarPedidoMutation.isPending}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {cobrarPedidoMutation.isPending ? 'Cobrando...' : 'Confirmar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cierre de Caja */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cierre de Caja</DialogTitle>
            <DialogDescription>
              Realiza el arqueo y cierra el turno
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Saldo Inicial</div>
                  <div className="text-2xl font-bold">
                    S/ {cashRegister.openingBalance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Saldo Esperado</div>
                  <div className="text-2xl font-bold">
                    S/ {expectedBalance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Arqueo */}
            <div className="space-y-2">
              <Label htmlFor="actual">Saldo Real (Contado)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  S/
                </span>
                <Input
                  id="actual"
                  type="number"
                  step="0.01"
                  className="pl-10"
                  value={actualBalance}
                  onChange={(e) => setActualBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {actualBalance && (
                <div className={`p-3 rounded-lg ${difference === 0 ? 'bg-green-100 dark:bg-green-950/20' : 'bg-red-100 dark:bg-red-950/20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Diferencia:</span>
                    <span className={`text-xl font-bold ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {difference > 0 ? '+' : ''} S/ {difference.toFixed(2)}
                    </span>
                  </div>
                  {difference !== 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {difference > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resumen de Movimientos */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Resumen del Turno</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos:</span>
                  <span className="font-medium text-green-600">+S/ {totalIngresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Egresos:</span>
                  <span className="font-medium text-red-600">-S/ {totalEgresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Movimientos:</span>
                  <span className="font-medium">{cashRegister.movements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración:</span>
                  <span className="font-medium">
                    {Math.round((Date.now() - cashRegister.openedAt.getTime()) / 3600000)}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCloseCash}
              disabled={!actualBalance}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Nuevo Movimiento */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>
              Agrega un ingreso o egreso manual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs value={movementType} onValueChange={(v) => setMovementType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ingreso">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ingreso
                </TabsTrigger>
                <TabsTrigger value="egreso">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Egreso
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  S/
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-10"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método de Pago</Label>
              <select
                id="method"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={movementMethod}
                onChange={(e) => setMovementMethod(e.target.value as any)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Ej: Compra de insumos, Propina, etc."
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMovement}
              disabled={!movementAmount || !movementDescription}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
