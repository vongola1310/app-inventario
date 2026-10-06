# Control de herramientas

Aplicación Next.js con PostgreSQL, Prisma y acceso administrativo mediante NextAuth.

## Preparación

Configura `.env` con `DATABASE_URL` y `AUTH_SECRET`. No publiques este archivo.

```sh
npm install
npm run prisma:generate
npm run dev
```

En Windows, detén el servidor de desarrollo antes de regenerar Prisma si aparece un error de DLL bloqueada. `npm install` regenera automáticamente el cliente.

## Comprobaciones

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run check:db
```

Las pruebas usan dobles de la base de datos y no modifican datos reales. No sustituyen una prueba concurrente contra PostgreSQL.

## Administración

Las API de usuarios, herramientas, dashboard, historial, agenda y reportes requieren una sesión de administrador y verifican el rol vigente en la base.

El flujo de préstamo por QR mantiene la identificación por ID de trabajador. Los movimientos de calibración se realizan desde Inventario y se atribuyen al administrador autenticado.

El seed requiere `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` y `SEED_ADMIN_WORKER_ID`. Ejecútalo solo si quieres crear o actualizar ese administrador; actualiza su contraseña. No crea usuarios de prueba.

## Fechas

La fecha de devolución se envía como `YYYY-MM-DD`, con un mínimo de un día hábil. Se usa el calendario de Ciudad de México; los festivos configurados están en `app/lib/holidays-mx.ts`. Las fechas de calendario se guardan a medianoche UTC y se muestran sin desplazamiento de zona horaria. Un préstamo se considera atrasado al día siguiente de la fecha de devolución.

## Base de datos

El esquema incluye `Log.expectedReturnDate`. Generar el cliente no aplica migraciones a PostgreSQL. Revisa las migraciones de tu entorno antes de desplegar cambios de esquema; las correcciones de código no ejecutan migraciones ni seed automáticamente.

## Alertas de dependencias pendientes

Tras las actualizaciones compatibles, `npm audit` reporta 12 alertas (10 altas y 2 moderadas): `braces` y sus consumidores, `postcss-selector-parser` y `deepmerge-ts` mediante la CLI de Prisma. No quedan alertas críticas. El análisis con `--omit=dev` también incluye 3 de ellas por el árbol de dependencias de la CLI de Prisma.

La solución automática propuesta incluye migrar Tailwind a la versión 4 y cambiar la versión de Prisma. No se aplicó `npm audit fix --force`: esas migraciones requieren revisar compatibilidad y diseño. Las alertas pendientes no se han ocultado mediante excepciones.
