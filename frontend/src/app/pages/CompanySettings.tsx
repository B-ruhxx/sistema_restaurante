import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Building2,
  Save,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Loader2,
  X,
  BadgePercent,
  Coins,
  ImageIcon,
} from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { ImageUploadZone } from '../components/ui/image-upload-zone';
import { cn } from '../components/ui/utils';
import { PageWrapper, ModuleHeader, SectionCard } from '../components/ui/erp-layout';

const createDraftSetter = <T extends Record<string, string>>(
  defaults: T,
  setDraft: Dispatch<SetStateAction<Partial<T>>>
) => (value: SetStateAction<T>) => {
  setDraft((prev) => {
    const current = { ...defaults, ...prev };
    return typeof value === 'function' ? value(current) : value;
  });
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

interface FormFooterProps {
  onCancel: () => void;
  isUpdating: boolean;
}
function FormFooter({ onCancel, isUpdating }: FormFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button type="button" variant="outline" onClick={onCancel} className="gap-2 h-11 rounded-xl">
        <X className="w-4 h-4" />
        Cancelar
      </Button>
      <Button type="submit" disabled={isUpdating} className="gap-2 min-w-[140px] h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Guardar cambios
      </Button>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}
function Field({ id, label, required, hint, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function CompanySettings() {
  const { configuracion, isLoading, updateConfiguracion, isUpdating } = useConfiguracion();
  const [formError, setFormError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const defaultGeneralData = useMemo(() => ({
    nombreEmpresa: configuracion?.nombreEmpresa || '',
    razonSocial: configuracion?.razonSocial || '',
    ruc: configuracion?.ruc || '',
    logoUrl: configuracion?.logoUrl || '',
  }), [configuracion]);

  const defaultContactData = useMemo(() => ({
    direccion: configuracion?.direccion || '',
    telefono: configuracion?.telefono || '',
    email: configuracion?.email || '',
  }), [configuracion]);

  const defaultBillingData = useMemo(() => ({
    serieBoleta: configuracion?.serieBoleta || 'B001',
    serieFactura: configuracion?.serieFactura || 'F001',
    igv: configuracion?.igv !== undefined ? String(configuracion.igv) : '18',
    moneda: configuracion?.moneda || 'PEN',
  }), [configuracion]);

  const [generalDraft, setGeneralDraft] = useState<Partial<typeof defaultGeneralData>>({});
  const [contactDraft, setContactDraft] = useState<Partial<typeof defaultContactData>>({});
  const [billingDraft, setBillingDraft] = useState<Partial<typeof defaultBillingData>>({});

  const generalData = { ...defaultGeneralData, ...generalDraft };
  const contactData = { ...defaultContactData, ...contactDraft };
  const billingData = { ...defaultBillingData, ...billingDraft };
  const setGeneralData = createDraftSetter(defaultGeneralData, setGeneralDraft);
  const setContactData = createDraftSetter(defaultContactData, setContactDraft);
  const setBillingData = createDraftSetter(defaultBillingData, setBillingDraft);

  const buildPayload = () => ({
    ...generalData,
    ...contactData,
    ruc: generalData.ruc.trim(),
    serieBoleta: billingData.serieBoleta.trim().toUpperCase(),
    serieFactura: billingData.serieFactura.trim().toUpperCase(),
    igv: parseFloat(billingData.igv) || 18,
    moneda: billingData.moneda,
  });

  const validatePayload = () => {
    const normalizedRuc = generalData.ruc.trim();
    const normalizedEmail = contactData.email.trim();
    const normalizedSerieBoleta = billingData.serieBoleta.trim().toUpperCase();
    const normalizedSerieFactura = billingData.serieFactura.trim().toUpperCase();
    const parsedIgv = parseFloat(billingData.igv);

    if (!generalData.nombreEmpresa.trim()) return 'El nombre comercial es obligatorio.';
    if (!normalizedRuc) return 'El RUC es obligatorio.';
    if (!/^\d{11}$/.test(normalizedRuc)) return 'El RUC debe tener 11 dígitos numéricos.';
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return 'El correo electrónico no tiene un formato válido.';
    }
    if (!normalizedSerieBoleta || normalizedSerieBoleta.length > 10) {
      return 'La serie de boleta es obligatoria y no puede exceder 10 caracteres.';
    }
    if (!normalizedSerieFactura || normalizedSerieFactura.length > 10) {
      return 'La serie de factura es obligatoria y no puede exceder 10 caracteres.';
    }
    if (!Number.isFinite(parsedIgv) || parsedIgv < 0 || parsedIgv > 100) {
      return 'El IGV debe ser un número entre 0 y 100.';
    }
    return '';
  };

  const handleSave = async (e: React.FormEvent, successMsg: string) => {
    e.preventDefault();
    const validationError = validatePayload();
    if (validationError) {
      setFormError(validationError);
      toast.error(validationError);
      return;
    }
    try {
      await updateConfiguracion(buildPayload());
      setFormError('');
      toast.success(successMsg);
    } catch {
      toast.error('Error al guardar la configuración');
    }
  };

  const handleCancel = () => {
    setGeneralDraft({});
    setContactDraft({});
    setBillingDraft({});
    setFormError('');
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Configuración' },
          { label: 'Empresa' },
        ]}
        icon={Building2}
        iconColor="blue"
        title="Configuración de Empresa"
        subtitle="Administra la información comercial, datos de contacto y configuración de comprobantes de pago."
      />

      {formError && (
        <div className="flex items-start gap-2 rounded-xl border ui-status-warning-soft px-4 py-3 text-sm">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {formError}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* ── Tab bar premium ── */}
        <TabsList className="flex h-auto w-full rounded-none border-b border-border bg-transparent p-0 gap-0">
          {[
            { value: 'general', label: 'Datos generales', Icon: Building2 },
            { value: 'contact', label: 'Contacto', Icon: Phone },
            { value: 'billing', label: 'Facturación', Icon: FileText },
          ].map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                'relative flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground transition-all',
                'hover:text-foreground',
                'data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── General Data ── */}
        <TabsContent value="general">
          <SectionCard
            title="Información general"
            description="Datos básicos e identidad visual de tu empresa"
            icon={Building2}
            iconColor="blue"
            footer={<FormFooter onCancel={handleCancel} isUpdating={isUpdating} />}
          >
            <form
              onSubmit={(e) => handleSave(e, 'Datos generales guardados correctamente')}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Logo upload panel */}
                <div className="w-full lg:w-72 flex-shrink-0">
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Logo de la empresa</span>
                    </div>
                    <ImageUploadZone
                      value={generalData.logoUrl}
                      onChange={(url) => setGeneralData((g) => ({ ...g, logoUrl: url }))}
                      module="empresa"
                      label=""
                      ctaText="Subir logo"
                      description="Arrastra o haz clic · PNG, JPG, SVG · Máx. 2 MB"
                    />
                    <p className="text-xs text-muted-foreground text-center leading-snug">
                      Aparece en el sidebar y en los comprobantes impresos
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 content-start">
                  <Field id="nombreEmpresa" label="Nombre comercial" required>
                    <Input
                      id="nombreEmpresa"
                      value={generalData.nombreEmpresa}
                      onChange={(e) => setGeneralData({ ...generalData, nombreEmpresa: e.target.value })}
                      placeholder="Ej. RestaurantERP"
                      required
                      className="h-11 rounded-xl"
                    />
                  </Field>

                  <Field id="ruc" label="RUC" required hint="11 dígitos numéricos">
                    <Input
                      id="ruc"
                      value={generalData.ruc}
                      onChange={(e) => setGeneralData({ ...generalData, ruc: e.target.value })}
                      placeholder="20123456789"
                      maxLength={11}
                      required
                      className="h-11 rounded-xl"
                    />
                  </Field>

                  <Field id="razonSocial" label="Razón social" required className="sm:col-span-2">
                    <Input
                      id="razonSocial"
                      value={generalData.razonSocial}
                      onChange={(e) => setGeneralData({ ...generalData, razonSocial: e.target.value })}
                      placeholder="Ej. RestaurantERP SAC"
                      required
                      className="h-11 rounded-xl"
                    />
                  </Field>
                </div>
              </div>
            </form>
          </SectionCard>
        </TabsContent>

        {/* ── Contact ── */}
        <TabsContent value="contact">
          <SectionCard
            title="Información de contacto"
            description="Dirección, teléfono y correo de la empresa"
            icon={MapPin}
            iconColor="blue"
            footer={<FormFooter onCancel={handleCancel} isUpdating={isUpdating} />}
          >
            <form
              onSubmit={(e) => handleSave(e, 'Datos de contacto guardados correctamente')}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <Field id="direccion" label="Dirección" className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Textarea
                    id="direccion"
                    value={contactData.direccion}
                    onChange={(e) => setContactData({ ...contactData, direccion: e.target.value })}
                    placeholder="Av. Ejemplo 123, Lima"
                    rows={2}
                    className="pl-10 resize-none rounded-xl"
                  />
                </div>
              </Field>

              <Field id="telefono" label="Teléfono">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="telefono"
                    value={contactData.telefono}
                    onChange={(e) => setContactData({ ...contactData, telefono: e.target.value })}
                    placeholder="000-000-000"
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </Field>

              <Field id="email" label="Correo electrónico">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    placeholder="empresa@ejemplo.com"
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </Field>
            </form>
          </SectionCard>
        </TabsContent>

        {/* ── Billing ── */}
        <TabsContent value="billing">
          <SectionCard
            title="Configuración de facturación"
            description="Series de comprobantes, IGV y tipo de moneda base"
            icon={FileText}
            iconColor="blue"
            footer={<FormFooter onCancel={handleCancel} isUpdating={isUpdating} />}
          >
            <form
              onSubmit={(e) => handleSave(e, 'Configuración de facturación guardada correctamente')}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Boleta */}
                <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl ui-status-info-soft flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Boletas de Venta</span>
                  </div>
                  <Field id="serieBoleta" label="Serie" required hint="Máximo 4 caracteres · Ej. B001">
                    <Input
                      id="serieBoleta"
                      value={billingData.serieBoleta}
                      onChange={(e) => setBillingData({ ...billingData, serieBoleta: e.target.value })}
                      maxLength={4}
                      required
                      className="uppercase font-mono h-11 rounded-xl"
                    />
                  </Field>
                </div>

                {/* Factura */}
                <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Facturas</span>
                  </div>
                  <Field id="serieFactura" label="Serie" required hint="Máximo 4 caracteres · Ej. F001">
                    <Input
                      id="serieFactura"
                      value={billingData.serieFactura}
                      onChange={(e) => setBillingData({ ...billingData, serieFactura: e.target.value })}
                      maxLength={4}
                      required
                      className="uppercase font-mono h-11 rounded-xl"
                    />
                  </Field>
                </div>
              </div>

              {/* Tributary config */}
              <div className="rounded-2xl border border-border bg-muted/20 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BadgePercent className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Configuración tributaria</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field id="igv" label="IGV (%)" hint="Impuesto General a las Ventas · Normalmente 18%">
                    <div className="relative">
                      <BadgePercent className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="igv"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={billingData.igv}
                        onChange={(e) => setBillingData({ ...billingData, igv: e.target.value })}
                        className="pl-10 h-11 rounded-xl"
                      />
                    </div>
                  </Field>

                  <Field id="moneda" label="Moneda base">
                    <div className="relative">
                      <Coins className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Select
                        value={billingData.moneda}
                        onValueChange={(value) => setBillingData({ ...billingData, moneda: value })}
                      >
                        <SelectTrigger id="moneda" className="pl-10 h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">Soles (S/)</SelectItem>
                          <SelectItem value="USD">Dólares ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Field>
                </div>
              </div>
            </form>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
