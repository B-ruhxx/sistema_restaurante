import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useERP, Customer } from '../contexts/ERPContext';
import { toast } from '../../lib/notifications';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt, 
  FileText, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

export function Checkout() {
  const navigate = useNavigate();
  const { cart, createOrder, clearCart, customers, cashRegister } = useERP();
  const isCajaAbierta = cashRegister && cashRegister.status === 'abierta';
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [documentType, setDocumentType] = useState<'boleta' | 'factura'>('boleta');
  const [customerData, setCustomerData] = useState({
    name: '',
    documentNumber: '',
    email: '',
    phone: ''
  });
  const [cashAmount, setCashAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const change = cashAmount ? parseFloat(cashAmount) - total : 0;

  const handlePayment = () => {
    const customer: Customer | undefined = customerData.name ? {
      id: String(Date.now()),
      name: customerData.name,
      documentType: documentType === 'factura' ? 'RUC' : 'DNI',
      documentNumber: customerData.documentNumber,
      email: customerData.email,
      phone: customerData.phone
    } : undefined;

    createOrder(customer, paymentMethod);
    setShowSuccess(true);
  };

  const handlePrintTicket = () => {
    import('jspdf').then(({ jsPDF }) => {
      // Create a 80mm wide document (standard thermal receipt) with dynamic height based on item count
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 100 + cart.length * 8]
      });

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      
      let y = 10;

      // Header
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.text('ERP RESTAURANTE', 40, y, { align: 'center' });
      y += 5;
      
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text('Av. Principal 123 - Lima', 40, y, { align: 'center' });
      y += 4;
      doc.text('RUC: 20123456789', 40, y, { align: 'center' });
      y += 6;

      // Ticket Info
      doc.setFont('courier', 'bold');
      doc.text(documentType === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA', 40, y, { align: 'center' });
      y += 5;
      doc.setFont('courier', 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 5, y);
      y += 4;
      
      const serie = documentType === 'factura' ? 'F001' : 'B001';
      const correlativo = String(Math.floor(Math.random() * 90000) + 10000);
      doc.text(`Nro: ${serie}-${correlativo}`, 5, y);
      y += 4;

      if (customerData.name) {
        doc.text(`Cliente: ${customerData.name}`, 5, y);
        y += 4;
        doc.text(`${documentType === 'factura' ? 'RUC' : 'Doc'}: ${customerData.documentNumber}`, 5, y);
        y += 4;
      }
      
      doc.text('----------------------------------', 5, y);
      y += 4;

      // Items header
      doc.setFont('courier', 'bold');
      doc.text('Cant  Descripción         Total', 5, y);
      y += 4;
      doc.setFont('courier', 'normal');
      doc.text('----------------------------------', 5, y);
      y += 4;

      // Items list
      cart.forEach(item => {
        const qtyStr = String(item.quantity).padEnd(4, ' ');
        let nameStr = item.name;
        if (nameStr.length > 18) {
          nameStr = nameStr.substring(0, 15) + '...';
        }
        nameStr = nameStr.padEnd(18, ' ');
        const itemPrice = (item.price * item.quantity).toFixed(2);
        const priceStr = `S/ ${itemPrice}`.padStart(9, ' ');
        
        doc.text(`${qtyStr}${nameStr}${priceStr}`, 5, y);
        y += 4;

        if (item.variant) {
          doc.text(`  (${item.variant})`, 5, y);
          y += 4;
        }
        if (item.extras && item.extras.length > 0) {
          doc.text(`  + ${item.extras.join(', ')}`, 5, y);
          y += 4;
        }
      });

      doc.text('----------------------------------', 5, y);
      y += 4;

      // Totals
      const subtotalStr = `S/ ${subtotal.toFixed(2)}`.padStart(9, ' ');
      doc.text(`SUBTOTAL: ${subtotalStr}`, 35, y);
      y += 4;
      const taxStr = `S/ ${tax.toFixed(2)}`.padStart(9, ' ');
      doc.text(`IGV (18%): ${taxStr}`, 35, y);
      y += 4;
      
      doc.setFont('courier', 'bold');
      const totalStr = `S/ ${total.toFixed(2)}`.padStart(9, ' ');
      doc.text(`TOTAL: ${totalStr}`, 35, y);
      y += 5;
      
      doc.setFont('courier', 'normal');
      doc.text(`Método: ${paymentMethod.toUpperCase()}`, 5, y);
      y += 4;
      if (paymentMethod === 'efectivo' && cashAmount) {
        doc.text(`Recibido: S/ ${parseFloat(cashAmount).toFixed(2)}`, 5, y);
        y += 4;
        doc.text(`Vuelto: S/ ${change.toFixed(2)}`, 5, y);
        y += 4;
      }

      doc.text('----------------------------------', 5, y);
      y += 4;
      doc.setFont('courier', 'bold');
      doc.text('¡GRACIAS POR SU COMPRA!', 40, y, { align: 'center' });
      y += 4;
      doc.setFont('courier', 'normal');
      doc.text('Vuelva pronto', 40, y, { align: 'center' });

      doc.save(`Ticket_${serie}_${correlativo}.pdf`);
      toast.success('Ticket PDF generado y descargado correctamente');
    }).catch(err => {
      console.error(err);
      toast.error('Error al generar el ticket PDF');
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearCart();
    navigate('/pos');
  };

  if (cart.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No hay productos en el carrito</h2>
          <p className="text-muted-foreground mb-4">
            Agrega productos desde el punto de venta
          </p>
          <Button onClick={() => navigate('/pos')}>
            Ir al POS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate('/pos')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al POS
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen de Compra */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo de Comprobante */}
          <Card>
            <CardHeader>
              <CardTitle>Comprobante de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="boleta">
                    <Receipt className="w-4 h-4 mr-2" />
                    Boleta
                  </TabsTrigger>
                  <TabsTrigger value="factura">
                    <FileText className="w-4 h-4 mr-2" />
                    Factura
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="boleta" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI (Opcional)</Label>
                    <Input
                      id="dni"
                      placeholder="Ej: 12345678"
                      maxLength={8}
                      value={customerData.documentNumber}
                      onChange={(e) => setCustomerData({ 
                        ...customerData, 
                        documentNumber: e.target.value 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre (Opcional)</Label>
                    <Input
                      id="name"
                      placeholder="Nombre del cliente"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({ 
                        ...customerData, 
                        name: e.target.value 
                      })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="factura" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruc">RUC *</Label>
                    <Input
                      id="ruc"
                      placeholder="Ej: 20123456789"
                      maxLength={11}
                      required
                      value={customerData.documentNumber}
                      onChange={(e) => setCustomerData({ 
                        ...customerData, 
                        documentNumber: e.target.value 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razon-social">Razón Social *</Label>
                    <Input
                      id="razon-social"
                      placeholder="Nombre de la empresa"
                      required
                      value={customerData.name}
                      onChange={(e) => setCustomerData({ 
                        ...customerData, 
                        name: e.target.value 
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@empresa.com"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ 
                          ...customerData, 
                          email: e.target.value 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        placeholder="999999999"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ 
                          ...customerData, 
                          phone: e.target.value 
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Método de Pago */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="grid grid-cols-2 gap-4">
                  <label 
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors
                      ${paymentMethod === 'efectivo' ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <RadioGroupItem value="efectivo" id="efectivo" className="sr-only" />
                    <Banknote className="w-8 h-8" />
                    <span className="font-medium">Efectivo</span>
                  </label>

                  <label 
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors
                      ${paymentMethod === 'tarjeta' ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <RadioGroupItem value="tarjeta" id="tarjeta" className="sr-only" />
                    <CreditCard className="w-8 h-8" />
                    <span className="font-medium">Tarjeta</span>
                  </label>

                  <label 
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors
                      ${paymentMethod === 'yape' ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <RadioGroupItem value="yape" id="yape" className="sr-only" />
                    <Smartphone className="w-8 h-8" />
                    <span className="font-medium">Yape</span>
                  </label>

                  <label 
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors
                      ${paymentMethod === 'plin' ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <RadioGroupItem value="plin" id="plin" className="sr-only" />
                    <Smartphone className="w-8 h-8" />
                    <span className="font-medium">Plin</span>
                  </label>
                </div>
              </RadioGroup>

              {paymentMethod === 'efectivo' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="cash">Monto Recibido</Label>
                  <Input
                    id="cash"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                  {change > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Vuelto: S/ {change.toFixed(2)}
                    </p>
                  )}
                  {change < 0 && cashAmount && (
                    <p className="text-sm text-red-600 font-medium">
                      Falta: S/ {Math.abs(change).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen del Pedido */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} x S/ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IGV (18%)</span>
                  <span>S/ {tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>

              {!isCajaAbierta && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2 text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <div className="text-xs">
                    <p className="font-semibold">Caja Cerrada</p>
                    <p>Debes realizar la apertura de caja antes de registrar un pago.</p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={
                  !isCajaAbierta ||
                  (documentType === 'factura' && (!customerData.name || !customerData.documentNumber)) ||
                  (paymentMethod === 'efectivo' && change < 0)
                }
              >
                Confirmar Pago
              </Button>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Comprobante: <Badge variant="outline">{documentType}</Badge></p>
                <p>• Método de pago: <Badge variant="outline">{paymentMethod}</Badge></p>
                <p>• Items: {cart.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Éxito */}
      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-2xl">¡Pago Exitoso!</DialogTitle>
              <DialogDescription>
                El pedido ha sido registrado correctamente
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total pagado:</span>
                <span className="font-bold">S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vuelto:</span>
                  <span className="font-medium text-green-600">S/ {change.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handlePrintTicket} className="w-full flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              Imprimir Ticket
            </Button>
            <Button onClick={handleSuccessClose} className="w-full">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
