package com.restaurante.config;

import com.restaurante.entity.*;
import com.restaurante.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements ApplicationRunner {

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InventarioProductoRepository inventarioProductoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 1. Roles & Permisos
        if (rolRepository.count() == 0) {
            List<Permiso> permisos = new ArrayList<>();
            String[] nombresPermisos = {
                    "VER_PANEL", "GESTION_EMPLEADOS", "GESTION_POS",
                    "GESTION_COCINA", "GESTION_COMPRAS", "GESTION_REPORTES",
                    "GESTION_CONFIGURACION"
            };
            for (String pNom : nombresPermisos) {
                Permiso p = new Permiso();
                p.setNombre(pNom);
                p.setDescripcion("Permiso para " + pNom);
                permisos.add(permisoRepository.save(p));
            }

            Rol adminRol = new Rol();
            adminRol.setNombre("ADMINISTRADOR");
            adminRol.setDescripcion("Acceso total al sistema de la Pizzería");
            adminRol.setEstado(Rol.Estado.ACTIVO);
            adminRol.setPermisos(new java.util.HashSet<>(permisos));
            rolRepository.save(adminRol);

            Rol meseroRol = new Rol();
            meseroRol.setNombre("MESERO");
            meseroRol.setDescripcion("Toma de pedidos en salón");
            meseroRol.setEstado(Rol.Estado.ACTIVO);
            meseroRol.setPermisos(new java.util.HashSet<>(List.of(
                    getPermisoByName(permisos, "VER_PANEL"),
                    getPermisoByName(permisos, "GESTION_POS"))));
            rolRepository.save(meseroRol);

            Rol cajeroRol = new Rol();
            cajeroRol.setNombre("CAJERO");
            cajeroRol.setDescripcion("Cobros y control de caja");
            cajeroRol.setEstado(Rol.Estado.ACTIVO);
            cajeroRol.setPermisos(new java.util.HashSet<>(List.of(
                    getPermisoByName(permisos, "VER_PANEL"),
                    getPermisoByName(permisos, "GESTION_POS"))));
            rolRepository.save(cajeroRol);

            Rol cocineroRol = new Rol();
            cocineroRol.setNombre("PZZERO / COCINERO");
            cocineroRol.setDescripcion("Gestión de horno y comandas");
            cocineroRol.setEstado(Rol.Estado.ACTIVO);
            cocineroRol.setPermisos(new java.util.HashSet<>(List.of(
                    getPermisoByName(permisos, "VER_PANEL"),
                    getPermisoByName(permisos, "GESTION_COCINA"))));
            rolRepository.save(cocineroRol);
        }

        // 2. Initial Admin User
        if (empleadoRepository.count() == 0) {
            Rol adminRol = rolRepository.findAll().stream()
                    .filter(r -> "ADMINISTRADOR".equalsIgnoreCase(r.getNombre()))
                    .findFirst().orElse(null);

            if (adminRol != null) {
                Empleado admin = new Empleado();
                admin.setNombre("Admin");
                admin.setApellido("Pizzeria");
                admin.setUsername("admin");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setTelefono("987654321");
                admin.setEmail("admin@pizzeria.com");
                admin.setEstado(Empleado.Estado.ACTIVO);
                admin.setRol(adminRol);
                empleadoRepository.save(admin);
            }
        }

        // 3. Payment Methods
        if (metodoPagoRepository.count() == 0) {
            MetodoPago mpEfectivo = new MetodoPago();
            mpEfectivo.setNombre("EFECTIVO");
            mpEfectivo.setRequiereOperacion(false);
            mpEfectivo.setEstado(MetodoPago.Estado.ACTIVO);
            metodoPagoRepository.save(mpEfectivo);

            MetodoPago mpTarjeta = new MetodoPago();
            mpTarjeta.setNombre("TARJETA");
            mpTarjeta.setRequiereOperacion(true);
            mpTarjeta.setEstado(MetodoPago.Estado.ACTIVO);
            metodoPagoRepository.save(mpTarjeta);

            MetodoPago mpYape = new MetodoPago();
            mpYape.setNombre("YAPE/PLIN");
            mpYape.setRequiereOperacion(true);
            mpYape.setEstado(MetodoPago.Estado.ACTIVO);
            metodoPagoRepository.save(mpYape);
        }

        // 4. Default Categories (Pizzería)
        if (categoriaRepository.count() == 0) {
            Categoria catPizzas = new Categoria();
            catPizzas.setNombre("Pizzas Tradicionales");
            catPizzas.setDescripcion("Pizzas artesanales a la piedra");
            catPizzas.setEstado(Categoria.Estado.ACTIVO);
            categoriaRepository.save(catPizzas);

            Categoria catBebidas = new Categoria();
            catBebidas.setNombre("Bebidas");
            catBebidas.setDescripcion("Gaseosas y cervezas frías");
            catBebidas.setEstado(Categoria.Estado.ACTIVO);
            categoriaRepository.save(catBebidas);

            Categoria catCalzones = new Categoria();
            catCalzones.setNombre("Calzones");
            catCalzones.setDescripcion("Pizzas cerradas rellenas");
            catCalzones.setEstado(Categoria.Estado.ACTIVO);
            categoriaRepository.save(catCalzones);
        }

        // 5. Default Insumos (Materia prima para las Pizzas)
        if (insumoRepository.count() == 0) {
            Insumo insHarina = new Insumo();
            insHarina.setNombre("Harina de Trigo 0000");
            insHarina.setUnidad("KG");
            insHarina.setStock(new BigDecimal("50.00"));
            insHarina.setStockMinimo(new BigDecimal("10.00"));
            insHarina.setCostoPromedio(new BigDecimal("1.20"));
            insHarina.setEstado(Insumo.Estado.ACTIVO);
            insumoRepository.save(insHarina);

            Insumo insQueso = new Insumo();
            insQueso.setNombre("Queso Mozzarella");
            insQueso.setUnidad("KG");
            insQueso.setStock(new BigDecimal("20.00"));
            insQueso.setStockMinimo(new BigDecimal("5.00"));
            insQueso.setCostoPromedio(new BigDecimal("8.50"));
            insQueso.setEstado(Insumo.Estado.ACTIVO);
            insumoRepository.save(insQueso);

            Insumo insPepperoni = new Insumo();
            insPepperoni.setNombre("Pepperoni Americano");
            insPepperoni.setUnidad("KG");
            insPepperoni.setStock(new BigDecimal("8.00"));
            insPepperoni.setStockMinimo(new BigDecimal("1.50"));
            insPepperoni.setCostoPromedio(new BigDecimal("14.00"));
            insPepperoni.setEstado(Insumo.Estado.ACTIVO);
            insumoRepository.save(insPepperoni);
        }

        // 6. Default Products (Menú de Pizzería)
        if (productoRepository.count() == 0) {
            Categoria catPizzas = categoriaRepository.findAll().stream()
                    .filter(c -> "Pizzas Tradicionales".equals(c.getNombre())).findFirst().orElse(null);
            Categoria catBebidas = categoriaRepository.findAll().stream().filter(c -> "Bebidas".equals(c.getNombre()))
                    .findFirst().orElse(null);

            // ---- Producto 1: Bebida (Inventario Directo) ----
            Producto cocaCola = new Producto();
            cocaCola.setNombre("Coca Cola Familiar 1.5L");
            cocaCola.setDescripcion("Gaseosa helada de 1.5 Litros");
            cocaCola.setPrecio(new BigDecimal("8.50"));
            cocaCola.setTipoProducto(Producto.TipoProducto.INVENTARIO_DIRECTO);
            cocaCola.setEstado(Producto.Estado.ACTIVO);
            cocaCola.setCategoria(catBebidas);
            productoRepository.save(cocaCola);

            InventarioProducto invCoca = new InventarioProducto();
            invCoca.setProducto(cocaCola);
            invCoca.setStock(30);
            invCoca.setStockMinimo(10);
            inventarioProductoRepository.save(invCoca);

            // ---- Producto 2: Pizza Mozzarella (Preparado) ----
            Producto pizzaMargherita = new Producto();
            pizzaMargherita.setNombre("Pizza Margherita Familiar");
            pizzaMargherita.setDescripcion("Salsa de tomate artesanal, mozzarella y albahaca fresca");
            pizzaMargherita.setPrecio(new BigDecimal("35.00"));
            pizzaMargherita.setTipoProducto(Producto.TipoProducto.PREPARADO);
            pizzaMargherita.setEstado(Producto.Estado.ACTIVO);
            pizzaMargherita.setCategoria(catPizzas);
            productoRepository.save(pizzaMargherita);

            // ---- Producto 3: Pizza Pepperoni (Preparado) ----
            Producto pizzaPepperoni = new Producto();
            pizzaPepperoni.setNombre("Pizza Pepperoni Familiar");
            pizzaPepperoni.setDescripcion("Doble porción de pepperoni americano y queso mozzarella");
            pizzaPepperoni.setPrecio(new BigDecimal("42.00"));
            pizzaPepperoni.setTipoProducto(Producto.TipoProducto.PREPARADO);
            pizzaPepperoni.setEstado(Producto.Estado.ACTIVO);
            pizzaPepperoni.setCategoria(catPizzas);
            productoRepository.save(pizzaPepperoni);
        }
    }

    private Permiso getPermisoByName(List<Permiso> list, String name) {
        return list.stream().filter(p -> name.equals(p.getNombre())).findFirst().orElse(null);
    }
}