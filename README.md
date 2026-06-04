<p align="center"> Sistema de Gestión para Restaurantes </p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Java%20Spring%20Boot-brightgreen?style=for-the-badge&logo=springboot" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Frontend-Node.js%20%7C%20NPM-blue?style=for-the-badge&logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/Version%20Control-Git-orange?style=for-the-badge&logo=git" alt="Git">
</p>

---

## 📝 Descripción del Proyecto

Este **Sistema de Restaurante** es una solución Full-Stack diseñada para automatizar y optimizar las operaciones diarias de un negocio gastronómico. Permite la toma de pedidos, administración de la carta/menú en tiempo real y un control de las comandas de forma eficiente mediante una arquitectura desacoplada y escalable.

---

## ✨ Características Principales

* 📋 **Gestión de Pedidos:** Flujo completo desde la creación de la comanda hasta la facturación.
* 🍔 **Administración del Menú:** Panel interactivo para actualizar platos, categorías, precios y disponibilidad al instante.
* 🔒 **Reglas de Negocio Seguras:** Backend robusto encargado de validar el stock, precios y roles de usuario.
* 💻 **Diseño Responsivo:** Interfaz moderna y adaptable para pantallas de cocina, caja o las tablets de los mozos.

---

## 🛠️ Stack Tecnológico

### ☕ Backend
* **Lenguaje:** Java 17+
* **Framework:** Spring Boot (Spring Web, Spring Data JPA)
* **Gestor de Dependencias:** Maven / Gradle

### ⚛️ Frontend
* **Entorno de ejecución:** Node.js
* **Empaquetador/Herramientas:** Scripts NPM (`npm run dev`) con soporte moderno (Vite / React / Vue / Angular).

---

## 📂 Estructura del Repositorio

El proyecto se encuentra dividido limpiamente en dos componentes principales:

```text
## sistema_restaurante/
├── backend/          # Código fuente del servidor (Spring Boot)
├── frontend/         # Interfaz de usuario (Node.js / SPA)
└── .gitignore        # Archivos excluidos del control de versiones
## 🚀 Guía de Instalación y Ejecución
Sigue estos pasos detallados para configurar el entorno de desarrollo de forma local:

## 1️⃣ Clonar el repositorio
Abre tu terminal y ejecuta:
git clone [https://github.com/B-ruhxx/sistema_restaurante.git](https://github.com/B-ruhxx/sistema_restaurante.git)
cd sistema_restaurante
## 2️⃣ Levantar el Servidor (Backend)
Navega a la carpeta del servidor y arranca la aplicación Spring Boot. Puedes abrirlo directamente desde tu IDE favorito (IntelliJ, Eclipse, VS Code) o usar la terminal:

Bash
cd backend
Si usas Maven:

Bash
  ./mvnw spring-boot:run
Si usas Gradle:

## Bash
  ./gradlew bootRun
🌐 El backend estará disponible de manera predeterminada en: http://localhost:8080

## 3️⃣ Levantar la Interfaz (Frontend)
Abre una nueva terminal, posiciónate en la raíz del proyecto y dirígete a la carpeta encargada de la vista para instalar sus dependencias:

Bash
cd frontend

# Instalar paquetes requeridos
npm install

# Iniciar el servidor de desarrollo local
npm run dev
💻 La terminal te arrojará la URL local activa (comúnmente http://localhost:5173 o http://localhost:3000) para interactuar con el sistema desde tu navegador.
