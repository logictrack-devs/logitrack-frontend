# LogiTrack - Frontend Client 🚚

Este repositorio contiene la aplicación **SPA (Single Page Application)** para el cliente frontend del ecosistema **LogiTrack**, desarrollada utilizando la tecnología web **Vite** para optimizar el entorno de desarrollo y compilación.

---

## 📋 Funcionalidades Mínimas Implementadas

### 1. Módulo de Autenticación y Control de Acceso
* **Formulario de Inicio de Sesión:** Pantalla de login interactiva que consume el endpoint de autenticación provisto por el `security-service` a través del **API Gateway**.
* **Almacenamiento Seguro de Tokens:** Gestión e integración del **JSON Web Token (JWT)** recibido tras un inicio de sesión exitoso mediante mecanismos de almacenamiento seguro en el navegador.
* **Guardias de Navegación (Route Guards):** Protección estricta de rutas privadas en la interfaz para evitar accesos de usuarios no autenticados de manera directa por URL.
* **Renderizado Condicional de UI:** Ocultamiento o muestra dinámica de elementos de la interfaz (botones de acción, módulos, secciones del menú lateral) basados en los **roles/claims** recuperados del payload del token JWT.

### 2. Intercepción y Propagación del Contexto de Seguridad
* **Interceptores HTTP:** Configuración de un cliente HTTP centralizado que adjunta de forma automática el encabezado `Authorization: Bearer <TOKEN>` en cada petición saliente hacia el ecosistema de microservicios.
* **Manejo Centralizado de Errores (401 / 403):** Captura global de códigos de estado HTTP de error:
    * **401 Unauthorized:** Fuerza la expiración/limpieza de la sesión y redirige automáticamente al usuario a la pantalla de Login.
    * **403 Forbidden:** Notifica la falta de permisos y restringe la navegación a recursos bloqueados.

### 3. Consumo de Servicios de Dominio
Módulos e interfaces interactivas para operar las reglas de negocio principales mediante formularios robustos y tablas dinámicas conectados a:
* **Shipment Service (Gestión de Envíos):** Listados generales, buscador por filtros, formulario para creación de nuevos envíos y actualización de estados en tiempo real.
* **Courier Service (Gestión de Repartidores):** Panel de control para el alta de repartidores, consulta de detalles individuales de perfiles y asignación operativa.

---

## 📁 Estructura del Proyecto (`src`)

La arquitectura del código fuente está organizada de manera modular para separar las responsabilidades del negocio, la autenticación y los componentes visuales:

*   **`api/`**: Contiene la configuración centralizada de los clientes HTTP junto con los interceptores encargados de adjuntar el token de autorización y capturar errores globales de sesión expirada.
*   **`assets/`**: Almacena los recursos estáticos globales del proyecto, tales como imágenes, logotipos y estilos compartidos.
*   **`auth/`**: Módulo dedicado exclusivamente al flujo de seguridad. Gestiona el guardado seguro del JWT, el parseo de claims/roles y las validaciones de acceso.
*   **`pages/`**: Vistas principales de la SPA accesibles según el rol del usuario (Pantalla de Login, Gestión de Envíos/Shipments, Panel de Repartidores/Couriers).
*   **`ui/`**: Componentes visuales reutilizables de la interfaz de usuario (botones, selectores, formularios y componentes de diseño base).
*   **`router.js`**: Enrutador central de la aplicación donde se definen las rutas privadas, públicas y sus respectivas restricciones de acceso mediante guards.
*   **`main.js`**: Punto de entrada de la aplicación encargado de inicializar el entorno y renderizar la SPA.

---

## 🐳 Dockerización y Despliegue Local

El proyecto cuenta con soporte nativo para contenedores utilizando un servidor **Nginx** optimizado para aplicaciones SPA que realiza un proxy inverso hacia el API Gateway.

### Construir la imagen de Docker
```bash
docker build -t logitrack-frontend:latest .
```

### Ejecutar el contenedor localmente
```bash
docker run -d -p 80:80 --name logitrack-frontend-container logitrack-frontend:latest
```
*La aplicación pasará a estar disponible en `http://localhost`.*

---

## 🛠️ Comandos de Desarrollo

### Instalar dependencias
```bash
npm install
```

### Correr en entorno de desarrollo local
```bash
npm run dev
```

### Compilar para producción
```bash
npm run build
```

---

## 👥 Contribuidores
* **AngelaMicaelaPuca-dot**
# LogiTrack - Frontend Client 🚚

Este repositorio contiene la aplicación **SPA (Single Page Application)** para el cliente frontend del ecosistema **LogiTrack**, desarrollada utilizando la tecnología web **Vite** para optimizar el entorno de desarrollo y compilación.

---

## 📋 Funcionalidades Mínimas Implementadas

### 1. Módulo de Autenticación y Control de Acceso
* **Formulario de Inicio de Sesión:** Pantalla de login interactiva que consume el endpoint de autenticación provisto por el `security-service` a través del **API Gateway**.
* **Almacenamiento Seguro de Tokens:** Gestión e integración del **JSON Web Token (JWT)** recibido tras un inicio de sesión exitoso mediante mecanismos de almacenamiento seguro en el navegador.
* **Guardias de Navegación (Route Guards):** Protección estricta de rutas privadas en la interfaz para evitar accesos de usuarios no autenticados de manera directa por URL.
* **Renderizado Condicional de UI:** Ocultamiento o muestra dinámica de elementos de la interfaz (botones de acción, módulos, secciones del menú lateral) basados en los **roles/claims** recuperados del payload del token JWT.

### 2. Intercepción y Propagación del Contexto de Seguridad
* **Interceptores HTTP:** Configuración de un cliente HTTP centralizado que adjunta de forma automática el encabezado `Authorization: Bearer <TOKEN>` en cada petición saliente hacia el ecosistema de microservicios.
* **Manejo Centralizado de Errores (401 / 403):** Captura global de códigos de estado HTTP de error:
    * **401 Unauthorized:** Fuerza la expiración/limpieza de la sesión y redirige automáticamente al usuario a la pantalla de Login.
    * **403 Forbidden:** Notifica la falta de permisos y restringe la navegación a recursos bloqueados.

### 3. Consumo de Servicios de Dominio
Módulos e interfaces interactivas para operar las reglas de negocio principales mediante formularios robustos y tablas dinámicas conectados a:
* **Shipment Service (Gestión de Envíos):** Listados generales, buscador por filtros, formulario para creación de nuevos envíos y actualización de estados en tiempo real.
* **Courier Service (Gestión de Repartidores):** Panel de control para el alta de repartidores, consulta de detalles individuales de perfiles y asignación operativa.

---

## 📁 Estructura del Proyecto (`src`)

La arquitectura del código fuente está organizada de manera modular para separar las responsabilidades del negocio, la autenticación y los componentes visuales:

*   **`api/`**: Contiene la configuración centralizada de los clientes HTTP junto con los interceptores encargados de adjuntar el token de autorización y capturar errores globales de sesión expirada.
*   **`assets/`**: Almacena los recursos estáticos globales del proyecto, tales como imágenes, logotipos y estilos compartidos.
*   **`auth/`**: Módulo dedicado exclusivamente al flujo de seguridad. Gestiona el guardado seguro del JWT, el parseo de claims/roles y las validaciones de acceso.
*   **`pages/`**: Vistas principales de la SPA accesibles según el rol del usuario (Pantalla de Login, Gestión de Envíos/Shipments, Panel de Repartidores/Couriers).
*   **`ui/`**: Componentes visuales reutilizables de la interfaz de usuario (botones, selectores, formularios y componentes de diseño base).
*   **`router.js`**: Enrutador central de la aplicación donde se definen las rutas privadas, públicas y sus respectivas restricciones de acceso mediante guards.
*   **`main.js`**: Punto de entrada de la aplicación encargado de inicializar el entorno y renderizar la SPA.

---

## 🐳 Dockerización y Despliegue Local

El proyecto cuenta con soporte nativo para contenedores utilizando un servidor **Nginx** optimizado para aplicaciones SPA que realiza un proxy inverso hacia el API Gateway.

### Construir la imagen de Docker
```bash
docker build -t logitrack-frontend:latest .
```

### Ejecutar el contenedor localmente
```bash
docker run -d -p 80:80 --name logitrack-frontend-container logitrack-frontend:latest
```
*La aplicación pasará a estar disponible en `http://localhost`.*

---

## 🛠️ Comandos de Desarrollo

### Instalar dependencias
```bash
npm install
```

### Correr en entorno de desarrollo local
```bash
npm run dev
```

### Compilar para producción
```bash
npm run build
```

---

## 👥 Contribuidores
* **AngelaMicaelaPuca-dot**
