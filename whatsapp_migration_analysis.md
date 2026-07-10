# Análisis de Migración: De Baileys a WhatsApp API Oficial

Este documento detalla el estado actual de la integración de WhatsApp en tu plataforma, las alternativas oficiales y legales disponibles (para evitar baneos), y un mapa de ruta paso a paso para realizar la migración de forma segura. Además, se listan malas prácticas detectadas en el código actual que deben corregirse.

---

## 1. Análisis de la Arquitectura Actual (Baileys)

Actualmente, el backend (Node.js) actúa como un "cliente no oficial" de WhatsApp Web usando la librería `Baileys`:
- **Multi-Tenant (Múltiples Negocios):** Cada `Negocio` genera un código QR que el dueño escanea. El backend abre un socket (`makeWASocket`) que se mantiene vivo en memoria por cada negocio.
- **Estado:** Las credenciales de autenticación y llaves criptográficas se guardan en la tabla `BaileysSession` de PostgreSQL.
- **Riesgo Principal (Baneos):** WhatsApp/Meta penaliza y banea agresivamente cuentas que usan bots no oficiales (scraping/emulación de WhatsApp Web) para enviar mensajes masivos o automatizados.
- **Riesgo de Escalabilidad:** Mantener cientos de conexiones WebSocket (una por cada negocio) en un solo servidor de Node.js saturará rápidamente la memoria (RAM) y el procesador, impidiendo que escales tu SaaS horizontalmente.

---

## 2. Opciones "Legales" (WhatsApp Oficial API)

Para evitar baneos, debes usar la **WhatsApp Business Platform**. Tienes dos caminos principales:

### Opción A: Meta WhatsApp Cloud API (Recomendada)
Es la API directa de Meta (Facebook).
- **Ventajas:** Es la opción más barata. Meta te ofrece **1,000 conversaciones de servicio gratis al mes** por cada cuenta (WABA). No hay intermediarios que te cobren sobrecargos.
- **Desventajas:** La integración inicial es un poco más compleja, ya que requiere implementar "Embedded Signup" (Facebook Login para que cada negocio conecte su número a tu aplicación).
- **Cómo funciona para un SaaS:** Te registras como "Tech Provider" en Meta. Tus clientes inician sesión con Facebook en tu frontend, vinculan su número y Meta te da un `phone_number_id` y un token para enviar/recibir mensajes de ese cliente.

### Opción B: Proveedores BSP (Twilio, MessageBird, Gupshup)
Empresas intermediarias autorizadas por Meta.
- **Ventajas:** Tienen SDKs más amigables y abstraen gran parte de la burocracia de Meta.
- **Desventajas:** **Cobran un fee adicional** por cada mensaje enviado/recibido (markup), lo cual reduce tu margen de ganancia si eres un SaaS. Los tiers gratuitos son para pruebas, pero en producción el costo sube rápido.

**Veredicto:** Siendo una plataforma SaaS para citas, **Meta WhatsApp Cloud API (Opción A)** es, por mucho, la que más te conviene, ya que maximiza los márgenes y te permite aprovechar los mensajes gratuitos por negocio.

---

## 3. Mapa de Ruta para la Migración (Roadmap)

### Fase 1: Registro y Configuración en Meta
1. Crear una **Meta Developer App** de tipo "Business".
2. Configurar el producto **WhatsApp** y registrarte como **Tech Provider / Solution Partner**.
3. Configurar un único **Webhook** en tu backend (ej. `POST /api/webhooks/whatsapp`) para recibir todos los mensajes entrantes de todos tus negocios.

### Fase 2: Cambios en el Backend (Desacoplar Baileys)
1. **Eliminar estado en memoria:** Destruir todo el sistema de sockets de Baileys (`whatsappClient.ts`) y la tabla `BaileysSession`.
2. **Refactorizar el Webhook Entrante:** En lugar de escuchar eventos `messages.upsert` de Baileys, recibirás peticiones HTTP POST de Meta. Deberás parsear el JSON de Meta, identificar qué cliente está escribiendo (basado en el `phone_number_id` receptor) y procesar el flujo del bot (`!cita`, etc.).
3. **Refactorizar Envío de Mensajes:** Cambiar la función `enviarMensaje()` para que haga una simple petición HTTP POST a `https://graph.facebook.com/v19.0/{phone_number_id}/messages` enviando el texto o la plantilla deseada usando el token de acceso del negocio.

### Fase 3: Cambios en el Frontend y Base de Datos
1. **Base de datos:** Agregar en el modelo `Negocio` campos como `waPhoneNumberId`, `waWabaId` y `waAccessToken`.
2. **Frontend:** Reemplazar la vista de "Escanear QR" por un botón de **"Conectar con WhatsApp"** que abra la ventana de "Embedded Signup" de Facebook (Meta SDK).

---

## 4. Malas Prácticas Encontradas (Technical Debt)

Mientras revisaba el código actual, detecté varios problemas que debes solucionar, sobre todo si planeas crecer tu plataforma:

1. **Almacenamiento inseguro de llaves (Baileys):** La tabla `BaileysSession` guarda credenciales y llaves en texto plano (`Text`). Esto es un riesgo masivo de seguridad. Si migras a la API de Meta, el problema desaparece, pero los tokens de Meta (access tokens) también deberán ir encriptados.
2. **Operaciones pesadas en Base de Datos:** `baileysAuth.ts` utiliza `upsert` y `deleteMany` de manera constante por cada llave criptográfica recibida (que son muchísimas por cada mensaje en Baileys). Esto causa cuellos de botella severos en PostgreSQL a medida que más clientes usan el bot.
3. **Escalabilidad bloqueada (Stateful app):** Mantener un array o mapas de sockets activos en memoria (`whatsappClient.ts`) hace que no puedas tener más de un servidor (no puedes usar un balanceador de carga con 2 o más instancias de NodeJS porque el estado de los bots no está compartido). La API oficial HTTP soluciona esto porque es **Stateless** (sin estado).
4. **Enums faltantes:** En el modelo `MensajeChat`, el campo `direccion` es un `String` genérico. Debería ser un `Enum` (ej. `ENTRANTE` | `SALIENTE`) para garantizar la integridad de los datos en la base de datos.
5. **JSON en PostgreSQL sin Tipado:** En la tabla `Configuracion` y `SesionChat`, se están guardando datos en formato JSON de forma indiscriminada, a veces como strings `"{\"lunes\":...}"`. Esto es difícil de migrar o consultar. Se deben usar tablas relacionales (ej. `HorarioServicio`) o al menos tipos JSONB estructurados.
