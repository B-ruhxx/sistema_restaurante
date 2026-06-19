import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Building2,
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfiguracion } from '../../hooks/useConfiguracion';

export function CompanySettings() {
  const { configuracion, isLoading, updateConfiguracion, isUpdating } = useConfiguracion();

  const [generalData, setGeneralData] = useState({
    nombreEmpresa: '',
    razonSocial: '',
    ruc: '',
    logoUrl: '',
  });

  const [contactData, setContactData] = useState({
    direccion: '',
    telefono: '',
    email: '',
  });

  const [billingData, setBillingData] = useState({
    serieBoleta: '',
    serieFactura: '',
    igv: '18',
    moneda: 'PEN',
  });

  // Populate form when data loads from backend
  useEffect(() => {
    if (configuracion) {
      setGeneralData({
        nombreEmpresa: configuracion.nombreEmpresa || '',
        razonSocial: configuracion.razonSocial || '',
        ruc: configuracion.ruc || '',
        logoUrl: configuracion.logoUrl || '',
      });
      setContactData({
        direccion: configuracion.direccion || '',
        telefono: configuracion.telefono || '',
        email: configuracion.email || '',
      });
      setBillingData({
        serieBoleta: configuracion.serieBoleta || 'B001',
        serieFactura: configuracion.serieFactura || 'F001',
        igv: configuracion.igv !== undefined ? String(configuracion.igv) : '18',
        moneda: configuracion.moneda || 'PEN',
      });
    }
  }, [configuracion]);

  const buildPayload = () => ({
    ...generalData,
    ...contactData,
    serieBoleta: billingData.serieBoleta,
    serieFactura: billingData.serieFactura,
    igv: parseFloat(billingData.igv) || 18,
    moneda: billingData.moneda,
  });

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfiguracion(buildPayload());
      toast.success('Datos generales guardados correctamente');
    } catch (err) {
      toast.error('Error al guardar los datos generales');
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfiguracion(buildPayload());
      toast.success('Datos de contacto guardados correctamente');
    } catch (err) {
      toast.error('Error al guardar los datos de contacto');
    }
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfiguracion(buildPayload());
      toast.success('Configuración de facturación guardada correctamente');
    } catch (err) {
      toast.error('Error al guardar la configuración de facturación');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Configuración de Empresa</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Administra la información de tu empresa y configuración de facturación
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Datos Generales</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        {/* General Data Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de tu empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                      {generalData.logoUrl ? (
                        <img
                          src={generalData.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">Logo de Empresa</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <Input
                        placeholder="URL del logo"
                        value={generalData.logoUrl}
                        onChange={(e) =>
                          setGeneralData({ ...generalData, logoUrl: e.target.value })
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombreEmpresa">Nombre Comercial *</Label>
                        <Input
                          id="nombreEmpresa"
                          value={generalData.nombreEmpresa}
                          onChange={(e) =>
                            setGeneralData({ ...generalData, nombreEmpresa: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ruc">RUC *</Label>
                        <Input
                          id="ruc"
                          value={generalData.ruc}
                          onChange={(e) => setGeneralData({ ...generalData, ruc: e.target.value })}
                          maxLength={11}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="razonSocial">Razón Social *</Label>
                      <Input
                        id="razonSocial"
                        value={generalData.razonSocial}
                        onChange={(e) =>
                          setGeneralData({ ...generalData, razonSocial: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>Datos de ubicación y contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direccion">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Dirección
                  </Label>
                  <Textarea
                    id="direccion"
                    value={contactData.direccion}
                    onChange={(e) => setContactData({ ...contactData, direccion: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      value={contactData.telefono}
                      onChange={(e) =>
                        setContactData({ ...contactData, telefono: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <FileText className="w-5 h-5 inline mr-2" />
                  Series de Comprobantes
                </CardTitle>
                <CardDescription>Configuración de series para boletas y facturas</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBilling} className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-semibold">Boletas de Venta</h3>
                      <div className="space-y-2">
                        <Label htmlFor="serieBoleta">Serie *</Label>
                        <Input
                          id="serieBoleta"
                          value={billingData.serieBoleta}
                          onChange={(e) =>
                            setBillingData({ ...billingData, serieBoleta: e.target.value })
                          }
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-semibold">Facturas</h3>
                      <div className="space-y-2">
                        <Label htmlFor="serieFactura">Serie *</Label>
                        <Input
                          id="serieFactura"
                          value={billingData.serieFactura}
                          onChange={(e) =>
                            setBillingData({ ...billingData, serieFactura: e.target.value })
                          }
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Card className="p-4 border">
                    <CardTitle className="text-sm mb-4">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Configuración Tributaria
                    </CardTitle>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="igv">IGV (%)</Label>
                        <Input
                          id="igv"
                          type="number"
                          value={billingData.igv}
                          onChange={(e) =>
                            setBillingData({ ...billingData, igv: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">Impuesto General a las Ventas</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="moneda">Moneda Base</Label>
                        <select
                          id="moneda"
                          value={billingData.moneda}
                          onChange={(e) =>
                            setBillingData({ ...billingData, moneda: e.target.value })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="PEN">Soles (S/)</option>
                          <option value="USD">Dólares ($)</option>
                        </select>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
