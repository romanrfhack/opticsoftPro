# Auditoría cerrada de seguridad y tenancy

## Resumen ejecutivo

- El problema principal actual no es falta de funcionalidades. Es falta de enforcement y gobernanza en tenant, auth/authz, branch context y separación entre administración global y operación por tenant.
- La seguridad observable no es suficiente para un SaaS B2B multi-cliente.
- El aislamiento multi-tenant no está razonablemente enforced de punta a punta.
- La frontera entre `web` y `admin` es débil tanto en rutas como en superficie API.
- El sistema hoy se parece más a un piloto controlado que a un SaaS repetible.

## Hechos confirmados

- El backend observado en repo corre sobre .NET 10 y los frontends sobre Angular 20.
- El backend fue alineado a .NET 10 en un mini sprint backend-only; ese cambio no altera el diagnóstico base de tenancy, auth/authz, branch context ni separación `web` vs `admin`.
- El pipeline observable del API es `UseCors -> Swagger -> TenantMiddleware -> UseAuthentication -> UseAuthorization -> MapControllers` en `api/src/Opticsoft.Api/Program.cs`.
- El JWT emite `sub`, `email`, `name`, `sucursalId`, `tenantId` y roles en `api/src/Opticsoft.Api/Auth/JwtTokenService.cs`.
- `TenantMiddleware` sólo intenta resolver tenant si el usuario ya está autenticado, pero corre antes de `UseAuthentication`.
- `TenantProvider` obtiene `tenantId` desde `HttpContext.User`.
- `AppDbContext` construye query filters de tenant sólo si `CurrentTenantId` existe al construir el modelo.
- No se confirmó un mecanismo central de `SaveChanges` que autoasigne `TenantId`.
- Existen endpoints sensibles sin auth efectiva visible o con auth inconsistente en:
  - `api/src/Opticsoft.Api/Controllers/UsersController.cs`
  - `api/src/Opticsoft.Api/Controllers/ProductsController.cs`
  - `api/src/Opticsoft.Api/Controllers/InventoryMovementsController.cs`
  - `api/src/Opticsoft.Api/Controllers/SoporteController.cs`
- Existe fallback hardcodeado de sucursal en `api/src/Opticsoft.Api/Extensions/HttpContextExtensions.cs`.
- Hay secretos y defaults de riesgo en repo:
  - connection string con credenciales en `api/src/Opticsoft.Api/appsettings.json`
  - JWT key en `api/src/Opticsoft.Api/appsettings.json`
  - seed de admin en `api/src/Opticsoft.Api/Program.cs`
  - password default en `api/src/Opticsoft.Domain/Dtos/CreateTenantRequest.cs`
  - prefill de password en `admin/src/app/admin/tenants/tenants.page.ts`
- `web` consume superficies administrativas y `admin` consume endpoints genéricos operativos.
- Hay evidencia parcial de workflows fuera de la raíz del monorepo, pero el estado CI/CD del monorepo sigue pendiente por validar y no está confirmado desde raíz del monorepo.

## Inferencias razonables

- La tenancy existe hoy más como intención de arquitectura y modelado que como enforcement confiable por request.
- El sistema parece diseñado para operar bajo confianza implícita de contexto correcto de usuario y sucursal.
- La separación `web` vs `admin` fue resuelta primero a nivel de UI y navegación, no a nivel de permisos y API boundary.
- Si se desplegara a múltiples ópticas sin hardening previo, el riesgo dominante sería mezcla o fuga de datos entre tenants, no ausencia de features.

## Pendientes por validar

- Si existe infraestructura externa que haga consistente `UsePathBase("/api")` con las rutas efectivas consumidas por `web` y `admin`.
- Si existen secretos externos o configuración productiva que mitiguen los defaults visibles en repo.
- Si el VPS de despliegue ya dispone de `Microsoft.AspNetCore.App 10.x` para el backend actualizado.
- Si ya se ejecutó un smoke real de arranque post-upgrade del backend sobre .NET 10 en entorno de despliegue.
- Si hay observabilidad, alertado o auditoría operativa fuera del repositorio.
- Si existe un catálogo de permisos/capacidades más preciso que el uso observable de roles por string.
- Si existe un workflow activo del monorepo en `.github/workflows` de raíz.

## Flujo real de request y resolución de contexto

### Orden observable del pipeline

1. `UseCors`
2. Swagger
3. `TenantMiddleware`
4. `UseAuthentication`
5. `UseAuthorization`
6. `MapControllers`

### Resolución observable

- Auth:
  - El token incluye `tenantId`, `sucursalId` y roles.
  - El inbound claim mapping está desactivado.
- Tenant:
  - `TenantMiddleware` intenta resolver tenant sólo si el usuario ya está autenticado.
  - `TenantProvider` depende de claims del usuario.
  - Esto deja una inconsistencia estructural: el middleware de tenant corre antes de que el usuario quede autenticado en el pipeline.
- Branch:
  - El contexto de sucursal se toma desde claim `sucursalId`, o desde header `X-Sucursal-Id`, o desde un GUID hardcodeado si no existe ninguno.
  - No se confirmó que `web` o `admin` envíen `X-Sucursal-Id`.

### Dónde se rompe o se vuelve ambiguo

- `TENANT_NOT_ENFORCED`: el tenant context no queda resuelto de forma consistente por request antes del acceso a datos.
- `TENANT_NOT_ENFORCED`: el query filter observable depende de estado disponible al construir el modelo, no de una resolución claramente per-request.
- `BRANCH_CONTEXT_WEAK`: el contexto de sucursal tiene fallback hardcodeado.
- `BRANCH_CONTEXT_WEAK`: algunos dashboards aceptan `branchId=all`.
- `FRONT_BACK_CONTRACT_GAP`: el flujo `switch-branch` es inconsistente entre claims, token emitido y respuesta.

## Matriz resumida de enforcement por entidad

| Entidad | Usa TenantId | Usa BranchId/equivalente | Query filter observable | Asignación en altas observable | Riesgo principal | Evidencia base |
|---|---|---|---|---|---|---|
| `AppUser` | Sí | `SucursalId` | Sí, vía filtro genérico | Parcial. `TenantsController` sí; `UsersController` no | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `ADMIN_TENANT_BOUNDARY_WEAK` | `AppUser.cs`, `UsersController.cs`, `Admin/TenantsController.cs` |
| `RefreshToken` | Sí | No | Sí, vía filtro genérico | No visible en login/refresh | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED` | `RefreshToken.cs`, `AuthController.cs` |
| `Sucursal` | Sí | Es la entidad branch | Sí, vía filtro genérico | Sí en alta inicial desde admin | `TENANT_NOT_ENFORCED` | `Sucursal.cs`, `Admin/TenantsController.cs` |
| `Paciente` | Sí | `SucursalIdAlta` | Sí, vía filtro genérico | `SucursalIdAlta` sí; `TenantId` no | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED` | `Paciente.cs`, `PacientesController.cs` |
| `HistoriaClinicaVisita` y entidades clínicas hijas | Sí | `SucursalId` en visita | Sí, vía filtro genérico | No se observó asignación consistente de `TenantId` | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED` | `HistoriaClinicaVisita.cs`, `AgudezaVisual.cs`, `HistoriasController.cs` |
| `HistoriaPago`, `VisitaStatusHistory`, `VisitaConcepto` | Sí | Parcial | Sí, vía filtro genérico | No se observó asignación consistente de `TenantId` | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `BRANCH_CONTEXT_WEAK` | `HistoriaPago.cs`, `VisitaStatusHistory.cs`, `VisitaConcepto.cs`, `HistoriasController.cs` |
| `Producto` | Sí | No | Sí, vía filtro genérico | No visible en altas | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `MISSING_AUTH` | `Producto.cs`, `ProductsController.cs` |
| `Inventario`, `InventarioMovimiento` | Sí | Sí | Sí, vía filtro genérico | No visible en altas | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `BRANCH_CONTEXT_WEAK`, `MISSING_AUTH` | `Inventario.cs`, `InventarioMovimiento.cs`, `InventoryMovementsController.cs` |
| `Material` | Sí | No | Sí, vía filtro genérico | No claramente observable | `TENANT_NOT_ENFORCED` | `Material.cs`, `MaterialesController.cs` |
| `SupportTicket` | Sí | No | Sí, vía filtro genérico | No visible en altas | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED` | `SupportTicket.cs`, `SoporteController.cs` |
| `Tenant` | No | No | No aplica | Alta explícita desde admin | `ADMIN_TENANT_BOUNDARY_WEAK` | `Tenant.cs`, `Admin/TenantsController.cs` |

## Matriz resumida de endpoints críticos

| Método / ruta | Controlador | Auth observable | Tenant / branch requerido | Consumidor observable | Riesgo principal | Etiquetas |
|---|---|---|---|---|---|---|
| `POST /api/auth/login` | `AuthController.Login` | `AllowAnonymous` | emite contexto | `web`, `admin` | refresh token sin `TenantId` | `TENANT_ID_NOT_ASSIGNED` |
| `POST /api/auth/refresh`, `logout` | `AuthController` | sin protección fuerte visible | tenant implícito | `web`, `admin` | refresh flow sin enforcement visible de tenant | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED` |
| `POST /api/auth/switch-branch` | `AuthController.SwitchBranch` | `Authorize`, `Roles="Admin"` | tenant y branch | `web` | flujo inconsistente de claims y respuesta | `BRANCH_CONTEXT_WEAK`, `TENANT_NOT_ENFORCED`, `FRONT_BACK_CONTRACT_GAP` |
| `GET/POST/PUT /api/users*` | `UsersController` | auth comentada | tenant y branch parciales | `web`, `admin` | administración de usuarios expuesta | `MISSING_AUTH`, `WEAK_AUTHZ`, `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `ADMIN_TENANT_BOUNDARY_WEAK` |
| `GET /api/branches` | `BranchesController` | `Authorize` | tenant | `web`, `admin` | scope implícito, sin frontera clara platform/tenant | `TENANT_NOT_ENFORCED`, `ADMIN_TENANT_BOUNDARY_WEAK` |
| `GET/POST/PUT/DELETE /api/products*` | `ProductsController` | sin auth visible | tenant | `web` | catálogo y altas expuestos | `MISSING_AUTH`, `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED` |
| `POST /api/inventory/movements` | `InventoryMovementsController.Create` | sin auth visible | tenant y branch | `web` | escritura de inventario expuesta | `MISSING_AUTH`, `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `BRANCH_CONTEXT_WEAK`, `HARDCODED_FALLBACK` |
| `GET /api/inventory/search` | `InventoryController.Search` | `Authorize` | tenant y branch | `web` | depende de contexto de sucursal débil | `TENANT_NOT_ENFORCED`, `BRANCH_CONTEXT_WEAK`, `HARDCODED_FALLBACK` |
| `GET/POST /api/pacientes*` | `PacientesController` | `Authorize` | tenant y branch parcial | `web` | altas sin `TenantId`, lecturas dependen de filtro frágil | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `FRONT_BACK_CONTRACT_GAP` |
| `POST /api/historias` y escrituras relacionadas | `HistoriasController` | `Authorize` | tenant y branch | `web` | visita, pagos, status y conceptos sin `TenantId` consistente | `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `BRANCH_CONTEXT_WEAK`, `WEAK_AUTHZ`, `FRONT_BACK_CONTRACT_GAP` |
| `GET /api/dashboard/*` | `DashboardController` | `Authorize` | tenant y branch opcional | `web` | agregados con branch amplio y authz débil | `TENANT_NOT_ENFORCED`, `BRANCH_CONTEXT_WEAK`, `WEAK_AUTHZ` |
| `GET/POST /api/soporte*` | `SoporteController` | mixto; listado con auth comentada | tenant | `web` | tickets sin `TenantId` y listado administrativo expuesto | `MISSING_AUTH`, `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`, `ADMIN_TENANT_BOUNDARY_WEAK` |
| `GET /api/admin/dashboard/*` | `Admin/DashboardController` | `Authorize`, `Roles="Admin"` | plataforma | `admin` | mismo rol `Admin` para platform y tenant admin | `ADMIN_TENANT_BOUNDARY_WEAK`, `WEAK_AUTHZ` |
| `GET/POST /api/admin/tenants*` | `Admin/TenantsController` | `Authorize`, `Roles="Admin"` | plataforma | `admin` | frontera débil entre admin global y admin de tenant | `ADMIN_TENANT_BOUNDARY_WEAK`, `FRONT_BACK_CONTRACT_GAP` |

## Hallazgos por severidad

### Crítico

- `TENANT_NOT_ENFORCED`, `TENANT_ID_NOT_ASSIGNED`
  - Problema: el tenant context no se resuelve ni se aplica de forma consistente por request, y muchas altas críticas no asignan `TenantId`.
  - Impacto: riesgo real de fuga cross-tenant y registros huérfanos.
  - Evidencia: `Program.cs`, `TenantMiddleware.cs`, `TenantProvider.cs`, `AppDbContext.cs`, `UsersController.cs`, `PacientesController.cs`, `HistoriasController.cs`, `ProductsController.cs`, `InventoryMovementsController.cs`, `SoporteController.cs`.
  - Dirección técnica: tratar tenancy como bloqueador de release y cerrarlo antes de ampliar funcionalidad.

- `MISSING_AUTH`, `WEAK_AUTHZ`
  - Problema: existen superficies sensibles expuestas o protegidas de forma ambigua.
  - Impacto: administración de usuarios, productos, inventario y soporte quedan sobreexpuestos.
  - Evidencia: `UsersController.cs`, `ProductsController.cs`, `InventoryMovementsController.cs`, `SoporteController.cs`.
  - Dirección técnica: cerrar la superficie API por defecto y reabrirla con authz explícita.

- `SECRET_IN_REPO`, `DEFAULT_CREDENTIAL`, `HARDCODED_FALLBACK`
  - Problema: el repo contiene secretos, passwords por defecto y un fallback duro de sucursal.
  - Impacto: riesgo inmediato de seguridad y de pérdida de confianza comercial.
  - Evidencia: `appsettings.json`, `Program.cs`, `CreateTenantRequest.cs`, `tenants.page.ts`, `HttpContextExtensions.cs`.
  - Dirección técnica: separar secretos y defaults del flujo normal de ejecución y eliminar fallbacks inseguros.

### Alto

- `ADMIN_TENANT_BOUNDARY_WEAK`
  - Problema: no existe una frontera sólida entre platform admin y tenant admin.
  - Impacto: permisos ambiguos y gobierno débil al operar múltiples clientes.
  - Evidencia: `Program.cs`, `Admin/TenantsController.cs`, `Admin/DashboardController.cs`, consumo de `admin` sobre endpoints genéricos.
  - Dirección técnica: separar explícitamente capacidades de plataforma y de tenant.

- `BRANCH_CONTEXT_WEAK`
  - Problema: la sucursal se gobierna por claim, header o fallback y algunos endpoints permiten amplitud excesiva.
  - Impacto: controles operativos por sucursal son frágiles.
  - Evidencia: `HttpContextExtensions.cs`, `DashboardController.cs`, `HistoriasController.cs`, `AuthController.cs`.
  - Dirección técnica: volver el branch context una regla consistente de servidor.

- `FRONT_BACK_CONTRACT_GAP`, `CONFIG_ENV_GAP`
  - Problema: hay contratos rotos y configuración de entornos incoherente entre `web`, `admin` y `api`.
  - Impacto: dificulta validar seguridad real de punta a punta y degrada operabilidad.
  - Evidencia: `HistoriasService.ts`, `PacientesService.ts`, `VisitasCostosService.ts`, `admin/tenants.service.ts`, `web/src/environments/environment.ts`, `admin/src/environments/environment.ts`, `angular.json`.
  - Dirección técnica: estabilizar primero contratos críticos y configuración mínima.

### Medio

- `WEAK_AUTHZ`
  - Problema: roles y policies están desalineados entre backend y frontend.
  - Impacto: el comportamiento real de permisos es ambiguo y difícil de gobernar.
  - Evidencia: `Policies.cs`, `Program.cs`, checks manuales por string en `HistoriasController.cs`, guards y navegación en `web` y `admin`.
  - Dirección técnica: definir y usar una matriz de capacidades observables antes de seguir ampliando módulos.

- Evidencia parcial de CI/workflows del monorepo
  - Problema: la gobernanza CI/CD del monorepo sigue pendiente por validar y no está confirmada desde raíz del monorepo.
  - Impacto: la confiabilidad operativa del hardening es menor.
  - Evidencia: workflows dentro de `api/.github/workflows`, archivos `.old` y `.disabled` en `web` y `admin`.
  - Dirección técnica: validar primero el estado real de workflows antes de depender de ellos como control.

### Bajo

- Módulos parciales o placeholders
  - Problema: algunas áreas del frontend siguen parciales o inconsistentes.
  - Impacto: baja la claridad de qué superficies están maduras.
  - Evidencia: `web/src/app/features/historias/historias.page.ts`, `admin/src/app/admin/tenants/tenants.page.ts`.
  - Dirección técnica: aclarar madurez funcional después del hardening base.

## Quick wins

- Cerrar de inmediato endpoints sensibles hoy expuestos sin auth suficiente.
- Retirar secretos, passwords por defecto y prefilled credentials del flujo normal de operación.
- Eliminar el fallback hardcodeado de sucursal como comportamiento aceptado.
- Alinear primero los contratos HTTP rotos más visibles entre frontends y API.
- Corregir el flujo `switch-branch` para que claims, token y respuesta representen el mismo contexto.
- Validar si existe o no un workflow raíz del monorepo antes de asumir quality gates automáticos.

## Bloqueadores reales para vender como SaaS

- No hay evidencia suficiente de aislamiento multi-tenant confiable por request, datos y endpoints.
- La superficie sensible del API no está cerrada con authz explícita y consistente.
- La frontera entre administración global y operación por tenant no está endurecida.
- El branch context es débil y acepta un fallback inseguro.
- Existen secretos y credenciales por defecto en repo y en flujos de alta.
- La operabilidad observable del monorepo no tiene calidad de release claramente demostrada.

## Criterio de salida de la fase 1

- El tenant context queda resuelto y aplicado de forma consistente por request.
- Las altas críticas asignan `TenantId` de forma verificable o fallan si no existe contexto válido.
- Los endpoints sensibles quedan cerrados con auth/authz explícita y verificable.
- El branch context deja de depender de fallback hardcodeado.
- Los secretos y defaults inseguros salen del flujo normal de ejecución.
- Los contratos críticos `web`/`admin`/`api` dejan de tener desalineaciones bloqueantes.
- Existe validación mínima repetible para evitar regresiones en los flujos endurecidos.
