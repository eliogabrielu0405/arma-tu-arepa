# Arma tu Arepa: cómo subirla a Vercel

La app para clientes queda en la raíz del dominio (`/`). El panel para marcar lo agotado queda en `/admin`.

## Qué hay en la carpeta

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La app donde el cliente arma la arepa y envía el pedido por WhatsApp |
| `admin.html` | El panel con contraseña (se abre en `/admin`) |
| `menu.js` | Menú, precios y número de WhatsApp. **Todo se cambia aquí** |
| `api/stock.js` | Guarda y entrega lo agotado; revisa la contraseña en el servidor |
| `img/` | Fotos de ingredientes y bebidas |
| `vercel.json` | Direcciones limpias (`/admin`) y caché de imágenes |

## Pasos (una sola vez)

1. **Sube el proyecto a Vercel.** Puedes arrastrar esta carpeta a un repositorio de GitHub e importarlo en vercel.com. También puedes ejecutar `npx vercel` dentro de la carpeta. No hace falta elegir framework: es un sitio estático con una función en `api/`.
2. **Conecta la base de datos.** En el proyecto, entra en **Storage** (o en el **Marketplace**), elige **Upstash for Redis** con el plan gratis y conéctalo a este proyecto. Eso crea solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. **Pon la contraseña del panel.** En **Settings → Environment Variables**, crea `ADMIN_PASSWORD` con la contraseña que quieras.
4. **Vuelve a desplegar.** En **Deployments**, elige el último y dale a **Redeploy**. Las variables nuevas solo se aplican en un despliegue nuevo.

## Uso diario

- Los clientes entran a tu dominio, arman la arepa y tocan **Enviar pedido por WhatsApp**. El pedido llega organizado al 0414-474-1237.
- La arepera entra a `tudominio.com/admin`, pone la contraseña, marca lo agotado y toca **Guardar cambios**. Los clientes lo ven al momento. Si alguien tenía algo agotado en su pedido, la app se lo quita y le avisa.
- Para cambiar la contraseña, edita `ADMIN_PASSWORD` en Vercel y vuelve a desplegar.

## Cambiar precios, productos o el número

Edita `menu.js`:

- `BASE`: precio de la arepa ($3.50).
- `ADD`: precio de cada adicional ($0.50).
- `FREE`: qué trae incluido (2 carnes y 1 extra).
- `WHATSAPP`: el número en formato internacional, sin `+` (`584144741237`).
- `CATS` y `DRINK_GROUPS`: productos y precios de bebidas.

Un ingrediente nuevo necesita dos fotos en `img/` con su código: `codigo.webp`, recortada y con fondo transparente, y `codigo-mini.webp`, la miniatura. Una bebida nueva necesita una foto, la que diga su campo `img`.
