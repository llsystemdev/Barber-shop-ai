# Documentación Técnica y Funcional: Barber Shop AI

**Nombre del Proyecto:** Barber Shop AI  
**Versión:** 1.0.0  
**Tipo de Software:** Aplicación Web SaaS (Software as a Service) con Inteligencia Artificial Generativa.

---

## 1. Resumen Ejecutivo

**Barber Shop AI** es una plataforma integral diseñada para modernizar la industria de las barberías mediante el uso de Inteligencia Artificial Generativa. La aplicación cumple una doble función:
1.  **Para el Cliente Final:** Funciona como un asistente de estilo personal y un "Espejo Virtual", permitiendo a los usuarios visualizar cortes de cabello, tintes y estilos en su propia foto antes de realizarse el corte.
2.  **Para el Dueño de Barbería:** Actúa como un sistema de gestión (SaaS) que incluye reservas, gestión de perfiles, facturación y análisis de datos de negocio.

El núcleo innovador del proyecto reside en la integración de la **API de Google Gemini**, que se utiliza para el análisis biométrico facial, la recomendación de estilos y la generación de imágenes fotorrealistas modificadas.

---

## 2. Arquitectura Técnica

La aplicación está construida bajo una arquitectura de **Single Page Application (SPA)**, priorizando la velocidad, la interactividad y una experiencia de usuario fluida.

### Stack Tecnológico
*   **Frontend Framework:** React 19 (Component-based architecture).
*   **Lenguaje:** TypeScript (Tipado estático para robustez y mantenibilidad).
*   **Estilos:** Tailwind CSS (Diseño responsivo y moderno).
*   **Inteligencia Artificial:** Google GenAI SDK (`@google/genai`).
    *   Modelo de Lógica y Texto: `gemini-2.5-flash`.
    *   Modelo de Visión y Generación: `gemini-2.5-flash-image`.
*   **Gestión de Estado:** React Hooks (`useState`, `useContext`, `useReducer`).

### Flujo de Datos de IA
1.  **Entrada:** El usuario sube dos imágenes (Frente y Perfil) en formato Base64.
2.  **Procesamiento (Prompt Engineering):** Se construye un prompt complejo que incluye la personalidad del barbero (System Instruction) y las imágenes codificadas.
3.  **Inferencia:**
    *   *Análisis:* Gemini analiza la forma del rostro y sugiere estilos compatibles en formato JSON.
    *   *Generación:* Gemini recibe la imagen original y una máscara semántica (vía prompt textual) para regenerar el cabello con el nuevo estilo, manteniendo los rasgos faciales intactos.
4.  **Salida:** Imágenes fotorrealistas y recomendaciones textuales personalizadas.

---

## 3. Módulos y Funcionalidades

### A. Espejo Virtual (Módulo Core)
Es la funcionalidad distintiva de la aplicación.
*   **Carga de Imágenes:** Soporte para captura de cámara y subida de archivos.
*   **Análisis Biométrico:** La IA evalúa la estructura facial para recomendar cortes (ej. Low Fade, Crop Top, Pompadour).
*   **Visualización Generativa:** Genera 6 variaciones de imágenes (Frente, Perfil, 3/4) aplicando los estilos sugeridos sobre la cara real del usuario.
*   **Personalización:** Controles para modificar iluminación (Natural, Estudio, Neón) y color de cabello/mechas en tiempo real.

### B. Asistente de Estilismo (Chatbot)
Un chat interactivo con persistencia de contexto.
*   **Personalidad Dinámica:** El chatbot adopta la personalidad configurada por la barbería (ej. "Don José" clásico vs. "Alex" urbano).
*   **Capacidades:** Responde dudas sobre cuidado capilar, tendencias y productos, pero no inventa información administrativa de la barbería.

### C. Sistema de Reservas Inteligente
*   **Gestión de Citas:** Flujo completo de selección de servicio, fecha y hora.
*   **Simulación de Disponibilidad:** Utiliza IA para generar slots de horarios dinámicos basados en reglas de negocio simuladas, evitando la rigidez de bases de datos estáticas en la demo.

### D. Gestión de Barbería (CMS)
Panel para que el dueño de la barbería administre su presencia digital:
*   **Perfil:** Edición de nombre, descripción, dirección y horarios.
*   **Servicios y Precios:** CRUD (Crear, Leer, Actualizar, Borrar) de servicios.
*   **Equipo:** Gestión de perfiles de barberos con especialidades.
*   **Galería:** Gestión de imágenes promocionales.

### E. Dashboards Administrativos
*   **Dashboard de Barbería:** Métricas de rendimiento específicas (Ingresos mensuales, servicios más populares, actividad diaria).
*   **Dashboard de Plataforma (Super Admin):** Vista global para el administrador del SaaS (MRR - Monthly Recurring Revenue, total de barberías registradas, distribución de planes).

### F. Facturación y Suscripciones
Sistema simulado de gestión de planes SaaS:
*   **Planes:** Freemium, Básico y Profesional con diferentes niveles de acceso a la API de IA.
*   **Pasarela de Pago:** Interfaz de usuario para simular pagos con Tarjeta, PayPal, Zelle y Chase.

---

## 4. Roles de Usuario

1.  **Usuario Visitante / Cliente:** Puede usar el Espejo Virtual, chatear con la IA y reservar citas.
2.  **Dueño de Barbería (Shop Owner):** Tiene acceso al panel de administración, configuración del perfil y facturación.
3.  **Administrador de Plataforma (Platform Admin):** Tiene visión global de todas las barberías y métricas financieras del software.

---

## 5. Modelo de Negocio (SaaS)

La aplicación está diseñada para monetizarse mediante suscripciones recurrentes para las barberías:

*   **Freemium ($0):** Acceso limitado al espejo virtual, 1 barbero.
*   **Básico ($1/mes):** Más análisis de IA, personalización de colores.
*   **Profesional ($10/mes):** Análisis ilimitados, soporte prioritario, múltiples barberos.

---

## 6. Seguridad y Privacidad

*   **Manejo de Datos:** Las imágenes se procesan en memoria y se envían a la API de Google de forma efímera para el análisis. No se almacenan permanentemente en servidores intermedios en esta versión.
*   **Variables de Entorno:** Las credenciales críticas (API KEY) se gestionan mediante variables de entorno (`process.env.API_KEY`) para evitar su exposición en el código fuente.

---

## 7. Instrucciones de Despliegue (Local)

1.  **Requisitos:** Node.js v18+ instalado.
2.  **Instalación:** Ejecutar `npm install`.
3.  **Configuración:** Crear un archivo `.env` en la raíz y añadir `API_KEY=tu_clave_de_google_gemini`.
4.  **Ejecución:** Ejecutar `npm start` o `npm run dev`.

---

**Copyright © 2024 Barber Shop AI.**  
*Desarrollado por L&L Dev System.*
