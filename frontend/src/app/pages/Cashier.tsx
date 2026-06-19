import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Minus,
  Lock,
  LockOpen,
  Printer,
  Download,
} from "lucide-react";

export function Cashier() {
  const [cashRegisterOpen, setCashRegisterOpen] = useState(true);
  const [openingAmount, setOpeningAmount] = useState("500.00");

  const cashierData = {
    opening: 500.0,
    sales: 2845.0,
    expenses: 150.0,
    expected: 3195.0,
    actual: 3195.0,
    difference: 0.0,
  };

  const movements = [
    {
      id: "1",
      type: "sale",
      description: "Venta - ORD-001",
      amount: 86.0,
      time: "10:30 AM",
      method: "Efectivo",
    },
    {
      id: "2",
      type: "sale",
      description: "Venta - ORD-002",
      amount: 92.0,
      time: "11:15 AM",
      method: "Tarjeta",
    },
    {
      id: "3",
      type: "expense",
      description: "Compra de ingredientes",
      amount: -150.0,
      time: "12:00 PM",
      method: "Efectivo",
    },
    {
      id: "4",
      type: "sale",
      description: "Venta - ORD-003",
      amount: 85.0,
      time: "01:45 PM",
      method: "Yape",
    },
  ];

  const salesByMethod = [
    { method: "Efectivo", count: 25, amount: 1250.0 },
    { method: "Tarjeta", count: 18, amount: 892.0 },
    { method: "Yape", count: 12, amount: 485.0 },
    { method: "Plin", count: 8, amount: 218.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Caja</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Turno: Mañana • 8 de Junio 2026
          </p>
        </div>
        <div className="flex gap-2">
          {!cashRegisterOpen ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <LockOpen className="h-5 w-5" />
                  Abrir Caja
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apertura de Caja</DialogTitle>
                  <DialogDescription>
                    Registra el monto inicial con el que abres la caja
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="opening">Monto de Apertura</Label>
                    <Input
                      id="opening"
                      type="number"
                      placeholder="500.00"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setCashRegisterOpen(true)}
                  >
                    Abrir Caja
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="destructive" size="lg" className="gap-2">
              <Lock className="h-5 w-5" />
              Cerrar Caja
            </Button>
          )}
        </div>
      </div>

      {!cashRegisterOpen ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto">
              <Lock className="h-10 w-10 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold">Caja Cerrada</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Abre la caja para comenzar a operar
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Apertura
                </p>
                <p className="text-2xl font-bold">
                  S/ {cashierData.opening.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 dark:bg-green-950/30 text-green-600 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Ingresos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  S/ {cashierData.sales.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-50 dark:bg-red-950/30 text-red-600 p-2 rounded-lg">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Egresos
                </p>
                <p className="text-2xl font-bold text-red-600">
                  S/ {cashierData.expenses.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-50 dark:bg-purple-950/30 text-purple-600 p-2 rounded-lg">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Total Esperado
                </p>
                <p className="text-2xl font-bold">
                  S/ {cashierData.expected.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Movements */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Movimientos de Caja</CardTitle>
                    <CardDescription>Transacciones del turno actual</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Ingreso
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Ingreso</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Concepto</Label>
                            <Input placeholder="Descripción del ingreso" />
                          </div>
                          <div className="space-y-2">
                            <Label>Monto</Label>
                            <Input type="number" placeholder="0.00" />
                          </div>
                          <Button className="w-full">Registrar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Minus className="h-4 w-4 mr-2" />
                          Egreso
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Egreso</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Concepto</Label>
                            <Input placeholder="Descripción del egreso" />
                          </div>
                          <div className="space-y-2">
                            <Label>Monto</Label>
                            <Input type="number" placeholder="0.00" />
                          </div>
                          <Button className="w-full">Registrar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {movement.type === "sale" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            {movement.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{movement.method}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                          {movement.time}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            movement.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {movement.amount > 0 ? "+" : ""}S/{" "}
                          {Math.abs(movement.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Right Panel */}
            <div className="space-y-6">
              {/* Sales by Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Método</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {salesByMethod.map((method) => (
                    <div
                      key={method.method}
                      className="flex items-center justify-between p-3 rounded-lg border dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium">{method.method}</p>
                        <p className="text-xs text-zinc-500">{method.count} ventas</p>
                      </div>
                      <p className="font-semibold">S/ {method.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Cash Count */}
              <Card>
                <CardHeader>
                  <CardTitle>Arqueo de Caja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monto Real en Caja</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      defaultValue={cashierData.actual.toFixed(2)}
                      className="text-lg"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Esperado
                      </span>
                      <span className="font-semibold">
                        S/ {cashierData.expected.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Real
                      </span>
                      <span className="font-semibold">
                        S/ {cashierData.actual.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Diferencia</span>
                      <span
                        className={
                          cashierData.difference === 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        S/ {cashierData.difference.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Arqueo
                  </Button>
                </CardContent>
              </Card>

              {/* Close Register */}
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-red-900 dark:text-red-400">
                    Cierre de Caja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Finaliza el turno y genera el reporte de cierre
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setCashRegisterOpen(false)}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Cerrar Caja
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
