# Hardening Phase 1 Backlog

## 1. Propósito del backlog

- Traducir `docs/roadmap/hardening-phase-1.md` y `docs/security/tenant-auth-audit.md` a trabajo técnico ejecutable, atómico y trazable para la fase 1.
- Usar como fuente canónica únicamente `STATE.md`, `docs/security/tenant-auth-audit.md` y `docs/roadmap/hardening-phase-1.md`.
- Asumir como hecho confirmado que el backend del repo ya quedó alineado a .NET 10 en código y base de build, sin convertir ese upgrade backend-only en cambio de prioridad del proyecto.
- Ordenar la ejecución para contener exposición primero y endurecer después, sin mezclar features nuevas ni refactor masivo.
- Dejar una base utilizable para abrir tickets, planificar olas, retomar el contexto en nuevos chats y decidir secuencia con bajo ruido.
- No pretende rediseñar la arquitectura objetivo, cerrar la fase 2, consolidar por completo `web` y `admin`, ni ampliar el diagnóstico base.

## 2. Principios de ejecución

- Cambios mínimos sobre superficies ya observadas; no abrir frentes fuera de tenancy, auth/authz, secretos/configuración, branch context, contratos críticos y quality gates mínimos.
- Trazabilidad estricta contra los documentos canónicos; cada ticket debe cerrar un riesgo ya confirmado y no un deseo futuro.
- No breaking cuando sea posible; primero cerrar exposición y fallbacks inseguros, luego endurecer reglas de contexto y contratos.
- Contención antes de expansión; no mover clientes ni ampliar cobertura funcional mientras el servidor siga aceptando contexto ambiguo.
- Validación mínima obligatoria; ningún ticket de la fase se considera cerrado sin checks observables del flujo afectado.
- El backlog sigue orientado a hardening funcional y de gobernanza; la validación de runtime `Microsoft.AspNetCore.App 10.x` y el smoke real post-upgrade del backend siguen siendo un pendiente operativo separado si aún no están confirmados.
- Evidencia prudente sobre CI/workflows del monorepo; no asumir automatización raíz donde la evidencia sigue parcial o pendiente por validar.

## 3. Secuencia recomendada de ejecución

- Ola 0 - Contención inmediata: `H1-001`, `H1-002`, `H1-003`. Rationale: bajar exposición directa de secretos, credenciales por defecto y endpoints sensibles antes de tocar invariantes más profundas.
- Ola 1 - Tenancy base verificable: `H1-004`, `H1-005`, `H1-006`, `H1-007`, `H1-008`. Rationale: el tenant por request y por persistencia es el bloqueador técnico principal y define el resto del hardening.
- Ola 2 - Contexto operativo y fronteras: `H1-009`, `H1-010`, `H1-011`, `H1-012`. Rationale: una vez estable el tenant, se puede endurecer sucursal, `switch-branch` y separación platform vs tenant sin perseguir síntomas.
- Ola 3 - Contratos críticos y configuración mínima: `H1-013`, `H1-014`. Rationale: alinear clientes antes de que el backend estabilice reglas genera retrabajo y oculta fallos reales.
- Ola 4 - Validación repetible: `H1-015`. Rationale: el quality gate mínimo debe montarse sobre flujos ya endurecidos y no sobre comportamientos todavía ambiguos.

## 4. Mapa de dependencias

| Ticket | Depende de | Desbloquea | Paralelizable |
|---|---|---|---|
| `H1-001` | Ninguna | `H1-014`, `H1-015` | Sí, con `H1-002`, `H1-003`, `H1-004` |
| `H1-002` | Ninguna | `H1-012`, `H1-015` | Sí, con `H1-001`, `H1-003`, `H1-004` |
| `H1-003` | Ninguna | `H1-015` | Sí, con `H1-001`, `H1-002`, `H1-004` |
| `H1-004` | Ninguna | `H1-005`, `H1-006`, `H1-007`, `H1-008`, `H1-009`, `H1-011`, `H1-012`, `H1-013`, `H1-015` | Parcial; puede convivir con la ola de contención, pero es parte de la ruta crítica |
| `H1-005` | `H1-004` | `H1-011`, `H1-013`, `H1-015` | Sí, con `H1-006`, `H1-007`, `H1-008` |
| `H1-006` | `H1-004` | `H1-013`, `H1-015` | Sí, con `H1-005`, `H1-007`, `H1-008` |
| `H1-007` | `H1-004` | `H1-010`, `H1-013`, `H1-015` | Sí, con `H1-005`, `H1-006`, `H1-008` |
| `H1-008` | `H1-004` | `H1-010`, `H1-015` | Sí, con `H1-005`, `H1-006`, `H1-007` |
| `H1-009` | `H1-004` | `H1-010`, `H1-011`, `H1-013`, `H1-014`, `H1-015` | Parcial; puede avanzar en paralelo con tickets de asignación de `TenantId`, pero no cerrar antes de `H1-004` |
| `H1-010` | `H1-007`, `H1-008`, `H1-009` | `H1-015` | No; requiere reglas de sucursal ya estabilizadas |
| `H1-011` | `H1-005`, `H1-009` | `H1-012`, `H1-013`, `H1-015` | No; depende de tenant y branch ya coherentes |
| `H1-012` | `H1-002`, `H1-004`, `H1-011` | `H1-014`, `H1-015` | Limitado; afecta frontera de consumo y authz |
| `H1-013` | `H1-005`, `H1-006`, `H1-007`, `H1-009`, `H1-011` | `H1-015` | No; debe alinearse al comportamiento endurecido final del backend |
| `H1-014` | `H1-001`, `H1-009`, `H1-012` | `H1-015` | Limitado; depende de frontera admin y configuración mínima ya definida |
| `H1-015` | `H1-001` a `H1-014` para cierre completo | Cierre de fase 1 | No; se usa como gate de salida |

## 5. Backlog detallado

### [H1-001] Retirar secretos y credenciales por defecto del flujo operativo

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** devops/config
- **Etiquetas de riesgo relacionadas:** `SECRET_IN_REPO`, `DEFAULT_CREDENTIAL`, `CONFIG_ENV_GAP`
- **Problema que resuelve:** el repo contiene secretos visibles, credenciales por defecto y prefilled passwords dentro del flujo normal de arranque y alta, lo que deja una exposición inmediata sin depender de otros hallazgos.
- **Objetivo:** sacar del camino operativo del repo los secretos reales y las credenciales por defecto utilizables, de modo que el arranque y el alta de tenant ya no dependan de valores sensibles versionados ni prellenados.
- **Scope:** `appsettings.json`, seed de admin en `Program.cs`, password default en `CreateTenantRequest.cs`, prefill de password en `admin` para alta de tenant, y la forma mínima en que esos valores se exigen desde configuración.
- **No scope:** rotación completa de secretos en infraestructura externa, rediseño del onboarding de tenant o automatización de despliegue.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos, In-scope de la fase actual; `docs/security/tenant-auth-audit.md` -> Hechos confirmados, Hallazgos por severidad / Crítico; `docs/roadmap/hardening-phase-1.md` -> Workstream 3, Backlog priorizado / P0.
- **Dependencias:** Previas: ninguna. Bloquea: `H1-014`, `H1-015`. Paralelizable: sí, con la ola de contención y con `H1-004`.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** el repo deja de exponer secretos operativos utilizables en configuración versionada; el alta de tenant deja de sugerir o imponer passwords por defecto; el arranque exige configuración sensible explícita fuera del camino normal del repo o falla de forma clara.
- **Validación mínima:** revisión de diff sobre archivos de configuración y alta; arranque controlado con configuración no sensible; verificación manual de que el flujo de tenants en `admin` ya no precarga credenciales utilizables.
- **Notas de ejecución segura:** preservar una experiencia local mínima solo con placeholders no operativos y claramente separados; si hay dependencia de secretos externos o variables del entorno productivo, dejarla explícita como validación externa pendiente y no asumirla cerrada.

### [H1-002] Cerrar auth/authz explícita en usuarios y soporte administrativo

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `MISSING_AUTH`, `WEAK_AUTHZ`, `ADMIN_TENANT_BOUNDARY_WEAK`
- **Problema que resuelve:** `UsersController` y el listado administrativo de soporte muestran auth comentada o ambigua, dejando expuesta una superficie sensible que hoy no está cerrada por defecto.
- **Objetivo:** hacer explícita y verificable la protección de usuarios y soporte administrativo para que un request sin auth o sin permisos mínimos observables falle con `401/403`.
- **Scope:** `UsersController` y el listado administrativo de `SoporteController`, incluyendo atributos de auth y checks mínimos de autorización sobre la superficie ya observada.
- **No scope:** diseñar un RBAC completo, introducir nuevos roles no observados o reorganizar todo el módulo de usuarios.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos; `docs/security/tenant-auth-audit.md` -> Matriz resumida de endpoints críticos, Hallazgos por severidad / Crítico y Alto; `docs/roadmap/hardening-phase-1.md` -> Workstream 2, Backlog priorizado / P0.
- **Dependencias:** Previas: ninguna. Bloquea: `H1-012`, `H1-015`. Paralelizable: sí, con `H1-001`, `H1-003`, `H1-004`.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** los endpoints de usuarios y soporte administrativo dejan de aceptar requests anónimos; el acceso queda alineado con el consumidor observable y el contexto autenticado esperado; el comportamiento de denegación es consistente y verificable.
- **Validación mínima:** smoke manual con request anónimo y autenticado; verificación de `401/403` en acceso no autorizado; prueba positiva del flujo esperado desde el cliente correspondiente.
- **Notas de ejecución segura:** aplicar cierre por defecto sobre rutas sensibles antes de intentar granularidad fina; si el catálogo exacto de permisos no está confirmado, reutilizar solo la separación mínima ya observable y dejar cualquier ambigüedad residual para `H1-012`.

### [H1-003] Cerrar auth/authz explícita en productos e inventario de escritura

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `MISSING_AUTH`, `WEAK_AUTHZ`, `TENANT_NOT_ENFORCED`
- **Problema que resuelve:** `ProductsController` y `InventoryMovementsController.Create` exponen catálogo y escrituras operativas sin auth efectiva visible, lo que amplifica cualquier debilidad de tenancy.
- **Objetivo:** cerrar las rutas sensibles de productos e inventario para que escritura y administración no queden accesibles sin auth y authz explícita.
- **Scope:** `GET/POST/PUT/DELETE /api/products*` y `POST /api/inventory/movements`, con la protección mínima observable necesaria para operación autenticada.
- **No scope:** rediseñar permisos finos de inventario o recalcular reglas de negocio del módulo.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos; `docs/security/tenant-auth-audit.md` -> Matriz resumida de endpoints críticos, Hallazgos por severidad / Crítico; `docs/roadmap/hardening-phase-1.md` -> Workstream 2, Backlog priorizado / P0.
- **Dependencias:** Previas: ninguna. Bloquea: `H1-015`. Paralelizable: sí, con `H1-001`, `H1-002`, `H1-004`.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** las rutas de productos y movimientos de inventario dejan de aceptar tráfico anónimo; la escritura solo opera con contexto autenticado válido; los rechazos por auth/authz son observables y consistentes.
- **Validación mínima:** requests manuales sin token y con token inválido; smoke de alta o movimiento desde el cliente esperado; verificación de `401/403` en el resto de escenarios.
- **Notas de ejecución segura:** endurecer primero las rutas de mayor exposición antes de tocar cobertura amplia de lectura; no introducir permisos nuevos no observados, solo cierre explícito de superficie sensible.

### [H1-004] Resolver tenant context por request en pipeline y proveedor

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `TENANT_NOT_ENFORCED`
- **Problema que resuelve:** el orden observable del pipeline deja a `TenantMiddleware` corriendo antes de `UseAuthentication`, mientras `TenantProvider` depende de `HttpContext.User`; eso vuelve inconsistente la resolución del tenant por request.
- **Objetivo:** asegurar que un request autenticado resuelva el tenant de forma consistente antes de consultar o persistir datos sensibles, con fallo explícito cuando no exista contexto válido.
- **Scope:** orden del pipeline, resolución de tenant por request, contrato mínimo del provider y cableado necesario para que la capa de datos use contexto per-request en los flujos de fase 1.
- **No scope:** reescribir toda la arquitectura de multi-tenancy, rediseñar por completo el `DbContext` o abarcar entidades fuera del alcance de fase 1.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos, Siguiente acción recomendada; `docs/security/tenant-auth-audit.md` -> Hechos confirmados, Flujo real de request y resolución de contexto, Hallazgos por severidad / Crítico; `docs/roadmap/hardening-phase-1.md` -> Workstream 1, Backlog priorizado / P0, Dependencias entre tareas.
- **Dependencias:** Previas: ninguna. Bloquea: `H1-005`, `H1-006`, `H1-007`, `H1-008`, `H1-009`, `H1-011`, `H1-012`, `H1-013`, `H1-015`. Paralelizable: parcial; puede convivir con la ola de contención, pero es ruta crítica.
- **Riesgo de cambio:** alto
- **Impacto esperado:** alto
- **Criterios de aceptación:** el tenant se resuelve de forma consistente antes del acceso sensible en flujos autenticados; el sistema deja de depender de resolución tardía o implícita; un request con tenant ausente o inválido falla antes de producir lectura o escritura sensible.
- **Validación mínima:** smoke manual de lectura y escritura autenticada con tenant válido; prueba negativa con claim ausente o inválido; comprobación de consistencia entre contexto autenticado, provider y operación resultante.
- **Notas de ejecución segura:** introducir fail-fast y trazabilidad mínima antes de abrir cambios en más controladores; asumir que pueden aparecer registros históricos inconsistentes y tratarlos como error explícito, no como razón para mantener fallback implícito.

### [H1-005] Garantizar `TenantId` en usuarios y refresh tokens

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `TENANT_ID_NOT_ASSIGNED`, `TENANT_NOT_ENFORCED`
- **Problema que resuelve:** `AppUser` y `RefreshToken` usan `TenantId`, pero la auditoría muestra asignación parcial o no visible en altas críticas y en el flujo de login/refresh.
- **Objetivo:** asegurar que la creación y renovación de usuarios y refresh tokens persista siempre un `TenantId` válido o falle sin dejar registros huérfanos.
- **Scope:** altas y cambios relevantes de `AppUser`, emisión/rotación de `RefreshToken` en login, refresh y logout, y los guards mínimos necesarios para exigir contexto válido.
- **No scope:** backfill masivo de registros históricos ni rediseño del modelo de sesión completo.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Matriz resumida de enforcement por entidad, Matriz resumida de endpoints críticos, Hallazgos por severidad / Crítico; `docs/roadmap/hardening-phase-1.md` -> Workstream 1, Backlog priorizado / P0.
- **Dependencias:** Previas: `H1-004`. Bloquea: `H1-011`, `H1-013`, `H1-015`. Paralelizable: sí, con `H1-006`, `H1-007`, `H1-008`.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** no se generan `AppUser` ni `RefreshToken` sin `TenantId`; login, refresh y logout fallan cuando el tenant no es válido; la persistencia refleja el mismo tenant que el contexto autenticado.
- **Validación mínima:** alta de usuario en contexto válido; login y refresh exitosos con verificación de `TenantId`; prueba negativa con tenant inválido o ausente; revisión puntual de los registros resultantes.
- **Notas de ejecución segura:** preferir una asignación central o un guard único antes que replicar lógica por controlador; no aceptar `TenantId` confiado desde el cliente cuando ya existe contexto autenticado.

### [H1-006] Garantizar `TenantId` en pacientes, productos y soporte

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `TENANT_ID_NOT_ASSIGNED`, `TENANT_NOT_ENFORCED`, `FRONT_BACK_CONTRACT_GAP`
- **Problema que resuelve:** pacientes, productos y tickets de soporte muestran persistencia sin asignación consistente de `TenantId`, lo que deja registros huérfanos o dependientes de filtros frágiles.
- **Objetivo:** hacer que las escrituras críticas de pacientes, productos y soporte persistan un `TenantId` válido por defecto o fallen sin crear datos inconsistentes.
- **Scope:** altas y escrituras críticas en `PacientesController`, `ProductsController` y `SoporteController` que generan entidades tenant-scoped.
- **No scope:** reparación de datos históricos, limpieza amplia de DTOs no críticos o rediseño de UX en `web`.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos; `docs/security/tenant-auth-audit.md` -> Matriz resumida de enforcement por entidad, Matriz resumida de endpoints críticos, Hallazgos por severidad / Crítico y Alto; `docs/roadmap/hardening-phase-1.md` -> Workstream 1, Backlog priorizado / P0.
- **Dependencias:** Previas: `H1-004`. Bloquea: `H1-013`, `H1-015`. Paralelizable: sí, con `H1-005`, `H1-007`, `H1-008`.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** pacientes, productos y soporte ya no generan registros sin `TenantId`; la escritura falla de forma explícita cuando falta contexto válido; el tenant persistido coincide con el contexto autenticado.
- **Validación mínima:** smoke manual de alta en pacientes, productos y soporte; verificación de persistencia con `TenantId`; prueba negativa sin tenant válido.
- **Notas de ejecución segura:** mantener estables los contratos de request cuando sea posible; derivar el tenant del contexto autenticado y no de campos opcionales del cliente; cualquier ajuste de contrato visible se resuelve en `H1-013`.

### [H1-007] Garantizar `TenantId` en historias, pagos, status y conceptos

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `TENANT_ID_NOT_ASSIGNED`, `TENANT_NOT_ENFORCED`, `BRANCH_CONTEXT_WEAK`, `FRONT_BACK_CONTRACT_GAP`
- **Problema que resuelve:** `HistoriaClinicaVisita`, sus entidades clínicas hijas, pagos, status y conceptos no muestran asignación consistente de `TenantId`, lo que pone en riesgo el aislamiento clínico de punta a punta.
- **Objetivo:** garantizar que las escrituras clínicas y sus entidades relacionadas persistan `TenantId` consistente dentro de una misma operación o fallen antes de dejar estado parcial.
- **Scope:** `POST /api/historias` y escrituras relacionadas para visita, entidades hijas, pagos, status y conceptos.
- **No scope:** refactor del dominio clínico, rediseño transaccional amplio o backfill de registros históricos.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Matriz resumida de enforcement por entidad, Matriz resumida de endpoints críticos, Hallazgos por severidad / Crítico y Alto; `docs/roadmap/hardening-phase-1.md` -> Workstreams 1 y 5, Backlog priorizado / P0 y P1.
- **Dependencias:** Previas: `H1-004`. Bloquea: `H1-010`, `H1-013`, `H1-015`. Paralelizable: sí, con `H1-005`, `H1-006`, `H1-008`.
- **Riesgo de cambio:** alto
- **Impacto esperado:** alto
- **Criterios de aceptación:** ninguna escritura clínica in-scope deja registros nuevos sin `TenantId`; todas las entidades hijas relevantes heredan o validan el mismo tenant; los fallos por contexto inválido evitan escrituras parciales.
- **Validación mínima:** alta manual de historia con sus derivados; validación de persistencia coherente de `TenantId` en registros afectados; prueba negativa con tenant o branch inválido.
- **Notas de ejecución segura:** priorizar coherencia transaccional y rechazo temprano sobre intentos de inferencia tardía; no ampliar el flujo clínico más allá de lo necesario para cerrar el hallazgo confirmado.

### [H1-008] Garantizar `TenantId` en inventario y movimientos

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `TENANT_ID_NOT_ASSIGNED`, `TENANT_NOT_ENFORCED`, `BRANCH_CONTEXT_WEAK`
- **Problema que resuelve:** `Inventario` e `InventarioMovimiento` aparecen tenant-scoped, pero la asignación en altas y movimientos no es visible ni consistente en la auditoría.
- **Objetivo:** asegurar que inventario base y movimientos persistan `TenantId` válido y rechacen escrituras sin contexto correcto.
- **Scope:** entidades `Inventario` e `InventarioMovimiento`, creación de movimientos y las partes mínimas del flujo de inventario afectadas por persistencia tenant-scoped.
- **No scope:** rediseño de cálculo de stock, nuevos reportes o cambios amplios de inventario fuera del hardening.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Matriz resumida de enforcement por entidad, Matriz resumida de endpoints críticos, Hallazgos por severidad / Crítico y Alto; `docs/roadmap/hardening-phase-1.md` -> Workstream 1, Backlog priorizado / P0.
- **Dependencias:** Previas: `H1-004`. Bloquea: `H1-010`, `H1-015`. Paralelizable: sí, con `H1-005`, `H1-006`, `H1-007`.
- **Riesgo de cambio:** alto
- **Impacto esperado:** alto
- **Criterios de aceptación:** los movimientos y registros de inventario no se crean sin `TenantId`; el tenant persistido coincide con el request autenticado; los fallos por contexto inválido no dejan efectos parciales.
- **Validación mínima:** alta o movimiento de inventario con contexto válido; revisión de registros persistidos; prueba negativa sin tenant o con contexto manipulado.
- **Notas de ejecución segura:** coordinar con el endurecimiento de auth y branch sin mezclar alcance; mantener el foco en persistencia consistente, no en refactor del módulo.

### [H1-009] Eliminar fallback hardcodeado y fijar la resolución mínima de sucursal

- **Prioridad:** P0
- **Urgencia:** ahora
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `HARDCODED_FALLBACK`, `BRANCH_CONTEXT_WEAK`
- **Problema que resuelve:** el contexto de sucursal puede venir por claim, header o un GUID hardcodeado, lo que deja una ruta insegura de ejecución y vuelve ambiguo el origen real del branch context.
- **Objetivo:** sacar el fallback hardcodeado del camino normal de ejecución y dejar una regla mínima, explícita y verificable para resolver sucursal en los flujos de fase 1.
- **Scope:** `HttpContextExtensions` y la resolución server-side del branch context necesaria para auth, historias, inventario y dashboard.
- **No scope:** rediseño completo de UX multi-sucursal, nuevas capacidades de switching o soporte amplio de fuentes de contexto no confirmadas.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Hechos confirmados, Flujo real de request y resolución de contexto, Hallazgos por severidad / Crítico y Alto; `docs/roadmap/hardening-phase-1.md` -> Workstream 4, Backlog priorizado / P0 y P1.
- **Dependencias:** Previas: `H1-004`. Bloquea: `H1-010`, `H1-011`, `H1-013`, `H1-014`, `H1-015`. Paralelizable: parcial; puede avanzar en paralelo con tickets de persistencia después de `H1-004`.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** ningún flujo de fase 1 depende de un GUID hardcodeado de sucursal; el origen aceptado del branch context queda explícito; cuando la sucursal es obligatoria y falta contexto válido, el request falla de forma clara.
- **Validación mínima:** smoke de auth, dashboard, historias e inventario con branch válido; prueba negativa sin branch; verificación manual de que ya no existe fallback silencioso aceptado.
- **Notas de ejecución segura:** mantener una sola vía canónica por flujo cuando sea posible; evitar compatibilidad silenciosa con comportamientos inseguros; coordinar cualquier ajuste visible con `H1-011`, `H1-013` y `H1-014`.

### [H1-010] Endurecer el scope de sucursal en dashboard, historias e inventario

- **Prioridad:** P1
- **Urgencia:** pronto
- **Perfil dominante:** backend
- **Etiquetas de riesgo relacionadas:** `BRANCH_CONTEXT_WEAK`, `WEAK_AUTHZ`, `TENANT_NOT_ENFORCED`
- **Problema que resuelve:** dashboards aceptan `branchId=all` y varios flujos operativos dependen de alcance de sucursal ambiguo o excesivamente amplio.
- **Objetivo:** unificar la regla mínima de alcance por sucursal en dashboard, historias e inventario para que solo opere el scope permitido por el contexto autenticado endurecido.
- **Scope:** `DashboardController`, `HistoriasController`, `InventoryController.Search` y los checks mínimos de scope por sucursal asociados a esos endpoints.
- **No scope:** rediseño de reportes, nuevas vistas agregadas o una política fina de permisos por branch no observada.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Flujo real de request y resolución de contexto, Matriz resumida de endpoints críticos, Hallazgos por severidad / Alto y Medio; `docs/roadmap/hardening-phase-1.md` -> Workstreams 2 y 4, Backlog priorizado / P1.
- **Dependencias:** Previas: `H1-007`, `H1-008`, `H1-009`. Bloquea: `H1-015`. Paralelizable: no; requiere branch context ya estabilizado.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** los endpoints in-scope dejan de aceptar scope amplio inseguro como ruta normal; las consultas por sucursal usan la misma regla mínima observable; un branch fuera de alcance devuelve denegación o error explícito.
- **Validación mínima:** smoke por sucursal válida en dashboard, historias e inventario; prueba negativa con `branchId=all` o branch fuera de alcance; verificación de consistencia de respuesta entre módulos.
- **Notas de ejecución segura:** cerrar primero los alcances más amplios y ambiguos; si algún acceso amplio sigue siendo necesario para plataforma, dejarlo explícitamente ligado a `H1-012` y no a parámetros implícitos.

### [H1-011] Corregir `switch-branch` y alinear claims, token y respuesta

- **Prioridad:** P1
- **Urgencia:** pronto
- **Perfil dominante:** fullstack
- **Etiquetas de riesgo relacionadas:** `FRONT_BACK_CONTRACT_GAP`, `BRANCH_CONTEXT_WEAK`, `TENANT_NOT_ENFORCED`
- **Problema que resuelve:** el flujo `switch-branch` hoy es inconsistente entre claims, token emitido y respuesta consumida, lo que deja contexto mezclado y hace poco confiable la validación posterior.
- **Objetivo:** lograr que `switch-branch` produzca un único contrato consistente de tenant y sucursal, equivalente entre backend y `web`.
- **Scope:** `POST /api/auth/switch-branch`, emisión de claims/token para este flujo y el payload mínimo que `web` necesita para consumirlo sin ambigüedad.
- **No scope:** rediseño del modelo completo de sesión, cambio de estrategia de autenticación o nuevas capacidades multi-sucursal.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Flujo real de request y resolución de contexto, Matriz resumida de endpoints críticos, Quick wins; `docs/roadmap/hardening-phase-1.md` -> Workstreams 4 y 5, Backlog priorizado / P1.
- **Dependencias:** Previas: `H1-005`, `H1-009`. Bloquea: `H1-012`, `H1-013`, `H1-015`. Paralelizable: no; depende de tenant y branch ya coherentes.
- **Riesgo de cambio:** medio
- **Impacto esperado:** medio
- **Criterios de aceptación:** después de `switch-branch`, claims, token vigente y respuesta representan el mismo tenant y la misma sucursal; el cliente no necesita inferir contexto contradictorio; un branch inválido falla sin dejar sesión mezclada.
- **Validación mínima:** prueba end-to-end desde `web` cambiando de sucursal y consumiendo luego dashboard o historias; prueba negativa con branch no permitido; verificación de claims o respuesta resultante.
- **Notas de ejecución segura:** conservar la forma actual de la ruta cuando sea posible; si hay cambio de payload, hacerlo coordinado con `H1-013` en la misma ola para evitar una ventana de contrato roto.

### [H1-012] Delimitar la frontera mínima entre platform admin y tenant admin

- **Prioridad:** P1
- **Urgencia:** pronto
- **Perfil dominante:** arquitectura/gobernanza
- **Etiquetas de riesgo relacionadas:** `ADMIN_TENANT_BOUNDARY_WEAK`, `WEAK_AUTHZ`, `FRONT_BACK_CONTRACT_GAP`
- **Problema que resuelve:** la auditoría muestra una frontera débil entre administración global y operación por tenant, con uso del mismo rol `Admin` y consumo cruzado de superficies API.
- **Objetivo:** separar de forma observable las superficies platform-only y tenant-scoped sin inventar un modelo nuevo completo de permisos.
- **Scope:** `Admin/TenantsController`, `Admin/DashboardController`, consumos de `admin` sobre endpoints genéricos operativos y la mínima separación de capacidades ya implícita en las superficies actuales.
- **No scope:** definición exhaustiva de permisos finos, consolidación total de `web` y `admin`, o creación de un catálogo completo de capacidades.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos; `docs/security/tenant-auth-audit.md` -> Matriz resumida de endpoints críticos, Hallazgos por severidad / Alto y Medio; `docs/roadmap/hardening-phase-1.md` -> Workstream 2, Backlog priorizado / P1.
- **Dependencias:** Previas: `H1-002`, `H1-004`, `H1-011`. Bloquea: `H1-014`, `H1-015`. Paralelizable: limitado; afecta authz y consumo de `admin`.
- **Riesgo de cambio:** alto
- **Impacto esperado:** alto
- **Criterios de aceptación:** las rutas platform-only dejan de quedar alcanzables con contexto de tenant admin; `admin` deja de depender de endpoints genéricos ambiguos para flujos platform-only o esa dependencia queda explícitamente acotada; cualquier hueco restante se deja identificado como pendiente fuera de fase 1.
- **Validación mínima:** prueba negativa con contexto tenant admin sobre `/api/admin/tenants*` y `/api/admin/dashboard/*`; prueba positiva con el contexto platform mínimo existente; smoke de los flujos admin que sí deben seguir operando.
- **Notas de ejecución segura:** usar solo distinciones ya observables entre plataforma y tenant; no introducir una taxonomía nueva de roles si no existe evidencia en los documentos; favorecer separación de superficie antes que complejidad de permisos.

### [H1-013] Corregir contratos críticos `web` <-> `api` para auth y flujos clínicos

- **Prioridad:** P1
- **Urgencia:** pronto
- **Perfil dominante:** fullstack
- **Etiquetas de riesgo relacionadas:** `FRONT_BACK_CONTRACT_GAP`, `TENANT_NOT_ENFORCED`, `BRANCH_CONTEXT_WEAK`
- **Problema que resuelve:** `web` tiene contratos críticos rotos o divergentes en refresh con PIN, historias, pacientes y conceptos/costos, lo que oculta fallos reales de seguridad o contexto.
- **Objetivo:** alinear `web` y `api` en los flujos críticos de fase 1 para que las pruebas manuales reflejen problemas reales de tenant, auth y branch, no drift de contrato.
- **Scope:** refresh con PIN, pacientes, historias y conceptos/costos en servicios de `web` y contratos API estrictamente necesarios para esos flujos.
- **No scope:** rediseño de UI, limpieza general de servicios no críticos o alineación completa de todos los contratos del frontend.
- **Evidencia / documento fuente:** `docs/security/tenant-auth-audit.md` -> Hallazgos por severidad / Alto, Matriz resumida de endpoints críticos; `docs/roadmap/hardening-phase-1.md` -> Workstream 5, Backlog priorizado / P1, Dependencias entre tareas.
- **Dependencias:** Previas: `H1-005`, `H1-006`, `H1-007`, `H1-009`, `H1-011`. Bloquea: `H1-015`. Paralelizable: no; debe alinearse al backend ya endurecido.
- **Riesgo de cambio:** medio
- **Impacto esperado:** alto
- **Criterios de aceptación:** `web` consume los flujos críticos endurecidos sin rutas, payloads o respuestas divergentes; un fallo observado corresponde a reglas reales de seguridad o contexto; no quedan contratos rotos bloqueantes en los flujos nombrados por la hoja de ruta.
- **Validación mínima:** smoke manual desde `web` para refresh con PIN, pacientes, historias y conceptos/costos; verificación de status codes y payloads esperados; prueba negativa que confirme fallos reales por auth/tenant/branch.
- **Notas de ejecución segura:** limitar los cambios a los contratos explícitamente nombrados; evitar limpiezas laterales de servicios; si hay cambios de payload inevitables, hacerlos coordinados con el backend y sin expandir alcance funcional.

### [H1-014] Corregir contratos críticos `admin` <-> `api` y `CONFIG_ENV_GAP` mínimo

- **Prioridad:** P1
- **Urgencia:** pronto
- **Perfil dominante:** fullstack
- **Etiquetas de riesgo relacionadas:** `FRONT_BACK_CONTRACT_GAP`, `CONFIG_ENV_GAP`, `ADMIN_TENANT_BOUNDARY_WEAK`
- **Problema que resuelve:** los flujos críticos de `admin` y la configuración de entornos siguen siendo suficientemente incoherentes como para ocultar problemas reales de rutas, boundary o despliegue.
- **Objetivo:** alinear `admin` con la frontera endurecida del backend y dejar una configuración mínima de entorno que no disimule errores de seguridad o routing.
- **Scope:** flujo de tenants en `admin`, archivos de environment de `web` y `admin`, base paths y flags mínimos necesarios para validar la fase 1.
- **No scope:** rediseño completo de la matriz de entornos, cambios de infraestructura externa, automatización total de despliegue o consolidación de frontends.
- **Evidencia / documento fuente:** `STATE.md` -> Pendiente por validar; `docs/security/tenant-auth-audit.md` -> Pendientes por validar, Hallazgos por severidad / Alto y Medio; `docs/roadmap/hardening-phase-1.md` -> Workstreams 3, 5 y 6, Backlog priorizado / P1.
- **Dependencias:** Previas: `H1-001`, `H1-009`, `H1-012`. Bloquea: `H1-015`. Paralelizable: limitado; depende de la frontera admin y de configuración mínima ya endurecida.
- **Riesgo de cambio:** medio
- **Impacto esperado:** medio
- **Criterios de aceptación:** `admin` consume sus flujos críticos con contratos compatibles con la frontera endurecida; la configuración mínima de entorno deja explícito el base path y no esconde defectos de routing o seguridad; cualquier dependencia de proxy, `PathBase` o secretos externos queda marcada como validación externa pendiente.
- **Validación mínima:** smoke manual de alta o gestión crítica de tenants desde `admin`; revisión de environments de `web` y `admin`; verificación de que la ruta base y la configuración no dependen de defaults engañosos.
- **Notas de ejecución segura:** no asumir que infraestructura externa corregirá inconsistencias del repo; si se necesita confirmar proxy, `PathBase` o secretos externos, marcar el cierre como condicionado a validación de infraestructura externa.

### [H1-015] Establecer el quality gate mínimo y la validación repetible de fase 1

- **Prioridad:** P1
- **Urgencia:** pronto
- **Perfil dominante:** arquitectura/gobernanza
- **Etiquetas de riesgo relacionadas:** `CONFIG_ENV_GAP`, evidencia parcial de CI/workflows del monorepo
- **Problema que resuelve:** la fase 1 no tiene una validación repetible mínima y la evidencia de CI/workflows del monorepo sigue parcial, lo que deja el hardening sin un cierre verificable.
- **Objetivo:** definir y dejar operable un gate mínimo para fase 1 que cubra build de `api`, `web`, `admin` y checks básicos de los flujos endurecidos, sin asumir workflows raíz no confirmados.
- **Scope:** definición del gate, orden mínimo de ejecución, evidencia de build y smoke crítico, y la forma explícita de documentar si la evidencia del monorepo sigue parcial o pendiente por validar.
- **No scope:** rediseño completo de CI/CD, ampliación masiva de tests, ni automatización total del monorepo.
- **Evidencia / documento fuente:** `STATE.md` -> Bloqueadores activos, Pendiente por validar; `docs/security/tenant-auth-audit.md` -> Hechos confirmados, Hallazgos por severidad / Medio, Quick wins, Criterio de salida de la fase 1; `docs/roadmap/hardening-phase-1.md` -> Workstream 6, Backlog priorizado / P1 y P2, Criterios de validación.
- **Dependencias:** Previas: `H1-001` a `H1-014` para cierre completo. Bloquea: salida de fase 1. Paralelizable: no; funciona como gate final.
- **Riesgo de cambio:** bajo
- **Impacto esperado:** alto
- **Criterios de aceptación:** existe una validación repetible mínima para build de `api`, `web` y `admin`, más smoke de flujos endurecidos; el estado de CI/workflows se expresa con wording prudente si la raíz del monorepo sigue sin confirmarse; la salida de fase 1 deja evidencia verificable y no solo intención.
- **Validación mínima:** ejecución del set mínimo acordado; registro de resultados por flujo endurecido; comprobación de que cualquier mención a workflows del monorepo permanece como evidencia parcial o pendiente por validar cuando corresponda.
- **Notas de ejecución segura:** no bloquear el cierre esperando un pipeline ideal; empezar por la combinación más pequeña y fiable de builds y smoke checks; mantener explícito qué parte es automatizada, cuál es manual y qué sigue pendiente de validación externa.

## 6. Quick wins

- `H1-001`: alto impacto y esfuerzo acotado; reduce exposición inmediata de secretos y credenciales por defecto.
- `H1-002`: alto impacto y esfuerzo medio; cierra superficies sensibles hoy ambiguas sin depender todavía del resto del hardening.
- `H1-003`: alto impacto y esfuerzo medio; corta exposición directa en catálogo e inventario de escritura.
- `H1-009`: alto impacto y esfuerzo medio; elimina el fallback hardcodeado que hoy normaliza un contexto inseguro.
- `H1-011`: impacto alto con alcance controlado; estabiliza `switch-branch`, que hoy contamina la validación del resto.

## 7. Bloqueadores de fase

- `H1-001`, `H1-002`, `H1-003`, `H1-004`, `H1-005`, `H1-006`, `H1-007`, `H1-008`, `H1-009` bloquean la contención mínima y el cierre del riesgo crítico de tenancy, auth y secretos.
- `H1-010`, `H1-011`, `H1-012` bloquean el cierre real del contexto operativo y de la frontera platform vs tenant dentro del alcance comprometido de fase 1.
- `H1-013`, `H1-014` bloquean la validación confiable de punta a punta porque sin contratos críticos alineados no se puede distinguir un fallo real de un drift entre clientes y backend.
- `H1-015` bloquea la salida formal de fase 1 porque sin quality gate mínimo la fase queda sin evidencia repetible de cierre.

## 8. Checklist de salida de fase 1

- El tenant context se resuelve y aplica de forma consistente por request en los flujos críticos de fase 1.
- Las altas críticas in-scope no dejan registros nuevos sin `TenantId` cuando la entidad lo requiere.
- Los endpoints sensibles de usuarios, productos, inventario y soporte administrativo ya no quedan expuestos sin auth/authz explícita.
- El branch context deja de depender de fallback hardcodeado y los endpoints críticos ya no aceptan scope ambiguo como camino normal.
- La frontera mínima entre platform admin y tenant admin queda explícita en superficie y consumo crítico.
- `web` y `admin` consumen sus contratos críticos sin desalineaciones bloqueantes para auth, pacientes, historias, conceptos/costos y tenants.
- Los secretos y defaults inseguros dejan de formar parte del flujo operativo versionado.
- Existe un quality gate mínimo repetible para build de `api`, `web`, `admin` y smoke de flujos endurecidos.
- Si la evidencia de workflows raíz del monorepo sigue sin confirmarse, esa limitación queda expresada como evidencia parcial o pendiente por validar, no como supuesto cerrado.

## 9. Siguiente corte recomendado

- Expandir el quality gate más allá del mínimo inicial, una vez que `H1-015` ya no dependa de contratos inestables.
- Confirmar el estado real de workflows del monorepo desde la raíz y dejar evidencia explícita de lo que sí está automatizado y lo que no.
- Formalizar la trazabilidad mínima de validación y salida de fase como insumo persistente para la siguiente etapa de hardening.
- Atacar permisos más finos y separación adicional plataforma vs tenant solo después de que la superficie crítica ya quede estabilizada por esta fase.
