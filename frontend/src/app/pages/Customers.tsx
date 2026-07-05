import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  TrendingUp,
  Filter,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { toast } from '../../lib/notifications';
import { useClientes } from '../../hooks/useClientes';
import { CLIENTE_TIPO_DOCUMENTO_VALUES, type Cliente, type ClienteRequest, type ClienteTipoDocumento } from '../../api/clientes';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const DOCUMENT_LABELS: Record<ClienteTipoDocumento, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'CE (Carné Extranjería)',
  PASAPORTE: 'Pasaporte',
  SIN_DOCUMENTO: 'Sin documento',
};

const DOCUMENT_INPUT_MAX_LENGTH: Record<ClienteTipoDocumento, number> = {
  DNI: 20,
  RUC: 11,
  CE: 20,
  PASAPORTE: 20,
  SIN_DOCUMENTO: 20,
};

const isTipoDocumento = (value: string): value is ClienteTipoDocumento =>
  CLIENTE_TIPO_DOCUMENTO_VALUES.some((tipoDocumento) => tipoDocumento === value);

const getClienteDocumentLabel = (tipoDocumento?: ClienteTipoDocumento) =>
  tipoDocumento ? DOCUMENT_LABELS[tipoDocumento] : 'Sin documento';

const getClienteDocumentValue = (documentoIdentidad?: string) => documentoIdentidad || 'Sin identificador';

const toClienteDocumentoPayload = (tipoDocumento: ClienteTipoDocumento, documentoIdentidad: string) => {
  if (tipoDocumento === 'SIN_DOCUMENTO') {
    return null;
  }

  return documentoIdentidad.trim();
};

type CustomerFormState = Omit<ClienteRequest, 'documentoIdentidad'> & {
  documentoIdentidad: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: 'ACTIVO' | 'INACTIVO';
};

const getSegmentColor = (estado: string) => {
  if (estado === 'INACTIVO') return 'ui-status-danger-soft';
  return 'ui-status-info-soft';
};

export function Customers() {
  const { clientes, isLoading, createCliente, updateCliente, deleteCliente } = useClientes();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('ACTIVO');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Cliente | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState<CustomerFormState>({
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    documentoIdentidad: '',
    telefono: '',
    email: '',
    direccion: '',
    estado: 'ACTIVO',
  });

  const handleTipoDocumentoChange = (value: string) => {
    if (!isTipoDocumento(value)) return;
    setFormData((current) => ({
      ...current,
      tipoDocumento: value,
      documentoIdentidad: value === 'SIN_DOCUMENTO' ? '' : current.documentoIdentidad,
    }));
  };

  const filteredClientes = clientes.filter((c: Cliente) => {
    const fullName = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (c.documentoIdentidad || '').includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.telefono && c.telefono.includes(searchTerm));

    const matchesTipo = tipoFilter === 'all' || c.tipoDocumento === tipoFilter;
    const estado = c.estado || 'ACTIVO';
    const matchesEstado = estadoFilter === 'TODOS' || estado === estadoFilter;

    return matchesSearch && matchesTipo && matchesEstado;
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      nombre: '',
      apellido: '',
      tipoDocumento: 'DNI',
      documentoIdentidad: '',
      telefono: '',
      email: '',
      direccion: '',
      estado: 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setEditingCustomer(cliente);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido || '',
      tipoDocumento: cliente.tipoDocumento || 'SIN_DOCUMENTO',
      documentoIdentidad: cliente.documentoIdentidad || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado || 'ACTIVO',
    });
    setDialogOpen(true);
  };

  const handleOpenProfile = (cliente: Cliente) => {
    setViewingCustomer(cliente);
    setProfileDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: ClienteRequest = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      tipoDocumento: formData.tipoDocumento,
      documentoIdentidad: toClienteDocumentoPayload(formData.tipoDocumento, formData.documentoIdentidad),
      telefono: formData.telefono.trim() || undefined,
      email: formData.email.trim() || undefined,
      direccion: formData.direccion.trim() || undefined,
      estado: formData.estado,
    };

    try {
      if (editingCustomer) {
        await updateCliente({ id: editingCustomer.idCliente, data: payload });
        toast.success('Cliente actualizado correctamente');
      } else {
        await createCliente(payload);
        toast.success('Cliente creado correctamente');
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!confirm(`¿Desea inactivar al cliente ${cliente.nombre} ${cliente.apellido || ''}?`)) return;
    try {
      await deleteCliente(cliente.idCliente);
      toast.success('Cliente inactivado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al inactivar cliente');
    }
  };

  const handleReactivate = async (cliente: Cliente) => {
    try {
      await updateCliente({
        id: cliente.idCliente,
        data: {
          nombre: cliente.nombre,
          apellido: cliente.apellido || '',
          tipoDocumento: cliente.tipoDocumento || 'SIN_DOCUMENTO',
          documentoIdentidad: toClienteDocumentoPayload(cliente.tipoDocumento || 'SIN_DOCUMENTO', cliente.documentoIdentidad || ''),
          telefono: cliente.telefono,
          email: cliente.email,
          direccion: cliente.direccion,
          estado: 'ACTIVO',
        },
      });
      toast.success('Cliente reactivado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al reactivar cliente');
    }
  };

  const totalClientes = clientes.length;
  const activos = clientes.filter((c: Cliente) => c.estado === 'ACTIVO').length;
  const dniCount = clientes.filter((c: Cliente) => c.tipoDocumento === 'DNI').length;
  const rucCount = clientes.filter((c: Cliente) => c.tipoDocumento === 'RUC').length;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Clientes' },
          { label: 'Directorio' },
        ]}
        icon={Users}
        iconColor="blue"
        title="Gestión de Clientes"
        subtitle="Administra la base de datos de clientes, historial de facturación y datos tributarios según el tipo de documento real."
        action={
          <Button onClick={handleOpenCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Clientes" value={totalClientes} color="slate" />
        <KpiCard icon={TrendingUp} label="Clientes Activos" value={activos} color="green" />
        <KpiCard icon={CreditCard} label="Personas (DNI)" value={dniCount} color="blue" />
        <KpiCard icon={CreditCard} label="Empresas (RUC)" value={rucCount} color="violet" />
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Buscar por nombre, documento, correo o celular...',
        }}
        filters={
          <>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-44 h-11 rounded-xl">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Tipo Documento" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todos los documentos</SelectItem>
                {CLIENTE_TIPO_DOCUMENTO_VALUES.map((tipoDocumento) => (
                  <SelectItem key={tipoDocumento} value={tipoDocumento} className="rounded-lg">
                    {DOCUMENT_LABELS[tipoDocumento]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as 'ACTIVO' | 'INACTIVO' | 'TODOS')}>
              <SelectTrigger className="w-44 h-11 rounded-xl">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ACTIVO" className="rounded-lg">Activos</SelectItem>
                <SelectItem value="INACTIVO" className="rounded-lg">Inactivos</SelectItem>
                <SelectItem value="TODOS" className="rounded-lg">Todos</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Table */}
      {filteredClientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes registrados"
          description="Crea perfiles de clientes para agilizar el cobro y personalizar comprobantes de pago."
          action={
            <Button onClick={handleOpenCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Directorio de Clientes"
          description={`Visualizando ${filteredClientes.length} registros filtrados.`}
          icon={Users}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente: Cliente) => (
                  <TableRow key={cliente.idCliente}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-border shadow-3xs">
                          <AvatarFallback className={cn('text-xs font-bold', getSegmentColor(cliente.estado || 'ACTIVO'))}>
                            {cliente.nombre[0]}{cliente.apellido?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground text-sm">{cliente.nombre} {cliente.apellido || ''}</div>
                          <div className="text-xs font-semibold text-muted-foreground">ID: {cliente.idCliente}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 font-semibold text-xs text-muted-foreground">
                        {cliente.email && (
                          <div className="flex items-center gap-1.5 text-foreground/80">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.telefono && (
                          <div className="flex items-center gap-1.5 text-foreground/80">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {cliente.telefono}
                          </div>
                        )}
                        {!cliente.email && !cliente.telefono && (
                          <span className="italic not-italic font-medium text-muted-foreground">Sin contacto</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[9px] font-bold px-2 py-0 h-4.5">{getClienteDocumentLabel(cliente.tipoDocumento)}</Badge>
                        <div className="text-xs font-bold text-foreground flex items-center gap-1 font-mono">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground font-sans" />
                          {getClienteDocumentValue(cliente.documentoIdentidad)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(cliente.estado || 'ACTIVO') === 'ACTIVO' ? (
                        <Badge variant="success" className="shadow-2xs font-bold">Activo</Badge>
                      ) : (
                        <Badge variant="danger" className="shadow-2xs font-bold">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {cliente.direccion ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground max-w-[200px] truncate" title={cliente.direccion}>
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {cliente.direccion}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic not-italic font-medium">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenProfile(cliente)}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenEdit(cliente)}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)]"
                          onClick={() => handleDelete(cliente)}
                          disabled={(cliente.estado || 'ACTIVO') === 'INACTIVO'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {(cliente.estado || 'ACTIVO') === 'INACTIVO' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                            onClick={() => handleReactivate(cliente)}
                            title="Reactivar cliente"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingCustomer
                ? 'Actualiza los datos demográficos y fiscales del cliente.'
                : 'Ingresa los datos para registrar un nuevo cliente en el directorio.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  maxLength={50}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido" className="text-sm font-semibold">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  maxLength={50}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipoDocumento" className="text-sm font-semibold">Tipo de Documento *</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={handleTipoDocumentoChange}
                >
                  <SelectTrigger id="tipoDocumento" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CLIENTE_TIPO_DOCUMENTO_VALUES.map((tipoDocumento) => (
                      <SelectItem key={tipoDocumento} value={tipoDocumento} className="rounded-lg">
                        {DOCUMENT_LABELS[tipoDocumento]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                {formData.tipoDocumento !== 'SIN_DOCUMENTO' && (
                  <>
                    <Label htmlFor="documento" className="text-sm font-semibold">Número de Documento *</Label>
                    <Input
                      id="documento"
                      value={formData.documentoIdentidad}
                      onChange={(e) => setFormData({ ...formData, documentoIdentidad: e.target.value })}
                      maxLength={DOCUMENT_INPUT_MAX_LENGTH[formData.tipoDocumento]}
                      required
                      className="h-11 rounded-xl font-mono font-bold"
                    />
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="text-sm font-semibold">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  maxLength={20}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  maxLength={100}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="direccion" className="text-sm font-semibold">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  maxLength={255}
                  placeholder="Av. Principal 123, Lima"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="h-10 rounded-xl font-semibold">
                {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalle de Cliente</DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-5 mt-2">
              <div className="flex items-start gap-4 p-4.5 border border-border/60 bg-muted/15 rounded-2xl">
                <Avatar className="w-16 h-16 border border-border/50 shadow-sm">
                  <AvatarFallback className={cn('text-sm font-bold', getSegmentColor(viewingCustomer.estado || 'ACTIVO'))}>
                    {viewingCustomer.nombre[0]}{viewingCustomer.apellido?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground">
                      {viewingCustomer.nombre} {viewingCustomer.apellido || ''}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 h-5">{getClienteDocumentLabel(viewingCustomer.tipoDocumento)}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground/90">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono font-bold">{getClienteDocumentValue(viewingCustomer.documentoIdentidad)}</span>
                    </div>
                    {viewingCustomer.telefono && (
                      <div className="flex items-center gap-2 text-foreground/95">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {viewingCustomer.telefono}
                      </div>
                    )}
                    {viewingCustomer.email && (
                      <div className="flex items-center gap-2 text-foreground/95">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {viewingCustomer.email}
                      </div>
                    )}
                    {viewingCustomer.direccion && (
                      <div className="flex items-center gap-2 text-foreground/90">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {viewingCustomer.direccion}
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    {(viewingCustomer.estado || 'ACTIVO') === 'ACTIVO' ? (
                      <Badge variant="success" className="text-[9px] font-bold px-2.5">Activo</Badge>
                    ) : (
                      <Badge variant="danger" className="text-[9px] font-bold px-2.5">Inactivo</Badge>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    handleOpenEdit(viewingCustomer);
                  }}
                  className="h-10 rounded-xl gap-1.5"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => setProfileDialogOpen(false)} className="h-10 rounded-xl">
                  Cerrar
                </Button>
                {(viewingCustomer.estado || 'ACTIVO') === 'INACTIVO' && (
                  <Button
                    onClick={() => {
                      setProfileDialogOpen(false);
                      handleReactivate(viewingCustomer);
                    }}
                    className="h-10 rounded-xl gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reactivar
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
