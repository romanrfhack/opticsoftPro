# Hardening Phase 1

## Objetivo de la fase 1

Estabilizar la base técnica mínima para que Opticsoft deje de operar como piloto controlado con enforcement débil y pueda avanzar hacia una base SaaS más segura, gobernable y repetible, sin refactor masivo ni expansión funcional.

## Alcance exacto

- Endurecer enforcement de tenant por request y por persistencia en flujos críticos.
- Cerrar auth/authz de endpoints sensibles y eliminar ambigüedades de permisos.
- Sacar secretos, defaults inseguros y fallbacks peligrosos del flujo normal de operación.
- Normalizar el contexto de sucursal para que no dependa de mecanismos ambiguos.
- Corregir contratos críticos frontend-backend que hoy impiden validar comportamiento real.
- Establecer quality gates mínimos para los flujos endurecidos.

## No alcance

- Nuevas funcionalidades de negocio.
- Reescritura de arquitectura.
- Refactor completo de capas o de monorepo.
- Consolidación total de `web` y `admin`.
- Benchmark de mercado.
- Mejoras cosméticas de UI.
- Documentación amplia fuera del conjunto canónico mínimo.

## Workstreams

### 1. Tenancy enforcement

- Revisar resolución efectiva de tenant por request.
- Asegurar asignación verificable de `TenantId` en altas críticas.
- Revisar query filtering observable en entidades sensibles.
- Cerrar rutas donde hoy el tenant queda sólo implícito.

### 2. Auth/Authz

- Cerrar endpoints hoy expuestos sin auth efectiva.
- Hacer explícita la protección de endpoints críticos.
- Reducir ambigüedad entre roles de tenant y roles de plataforma.
- Identificar y cerrar checks manuales frágiles por string.

### 3. Secretos y configuración

- Eliminar secretos y defaults inseguros del flujo normal de repo y despliegue.
- Revisar configuración mínima por entorno.
- Limpiar seeds y credenciales de arranque con riesgo directo.

### 4. Branch context

- Eliminar la dependencia de fallback hardcodeado.
- Alinear branch context entre token, request y ejecución backend.
- Revisar endpoints que hoy aceptan scope de sucursal excesivamente amplio.

### 5. Contratos críticos frontend-backend

- Corregir rutas mal formadas o divergentes en `web` y `admin`.
- Cerrar brechas que hoy ocultan o simulan problemas de seguridad.
- Alinear únicamente los contratos críticos necesarios para validar fase 1.

### 6. Quality gates mínimos

- Definir validación mínima repetible para los flujos endurecidos.
- Priorizar builds y checks básicos antes de despliegues.
- No asumir workflows activos del monorepo sin evidencia firme desde raíz.

## Backlog priorizado

### P0

- Resolver `TENANT_NOT_ENFORCED` en pipeline y contexto por request.
- Resolver `TENANT_ID_NOT_ASSIGNED` en altas críticas:
  - usuarios
  - refresh tokens
  - pacientes
  - historias y entidades hijas
  - pagos, status y conceptos
  - productos
  - inventario y movimientos
  - soporte
- Cerrar `MISSING_AUTH` y `WEAK_AUTHZ` en:
  - `UsersController`
  - `ProductsController`
  - `InventoryMovementsController`
  - listado administrativo de `SoporteController`
- Remover `SECRET_IN_REPO` y `DEFAULT_CREDENTIAL` del flujo operativo.
- Eliminar `HARDCODED_FALLBACK` de sucursal.

### P1

- Endurecer `BRANCH_CONTEXT_WEAK` en endpoints de dashboard, historias e inventario.
- Corregir inconsistencias del flujo `switch-branch`.
- Delimitar `ADMIN_TENANT_BOUNDARY_WEAK` entre platform admin y tenant admin.
- Corregir `FRONT_BACK_CONTRACT_GAP` crítico en:
  - auth refresh con PIN
  - historias
  - pacientes
  - conceptos/costos
  - tenants en `admin`
- Corregir `CONFIG_ENV_GAP` mínimo para que el entorno no oculte problemas reales.
- Establecer un quality gate mínimo para fase 1 que cubra:
  - build de `api`
  - build de `web`
  - build de `admin`
  - validación repetible mínima de los flujos críticos endurecidos

### P2

- Ampliar quality gates más allá del mínimo inicial de fase 1.
- Confirmar el estado real de workflows del monorepo y dejar explícito qué evidencia existe y cuál no.
- Dejar trazabilidad mínima de criterios de validación y salida de fase.

## Dependencias entre tareas

- Tenancy enforcement depende de entender el orden real del pipeline y el origen del contexto autenticado.
- Auth/Authz depende parcialmente de la separación mínima entre administración global y operación por tenant.
- Branch context depende de cómo se emite y consume el token después de auth.
- Contratos frontend-backend deben corregirse antes de confiar en las pruebas manuales de seguridad.
- Quality gates mínimos deben montarse sobre los flujos ya endurecidos, no antes.

## Riesgos de cambio

- Cambios en tenant enforcement pueden exponer registros históricos huérfanos o inconsistentes.
- Cerrar auth/authz puede bloquear flujos hoy usados informalmente.
- Corregir branch context puede alterar reportes o dashboards que hoy dependen de alcance amplio.
- Limpiar contratos frontend-backend puede revelar deuda funcional ya existente.
- Cualquier cambio sin quality gates mínimos aumenta riesgo de regresión en operación diaria.

## Criterios de validación

- Un request autenticado resuelve tenant de forma consistente antes de consultar o persistir datos sensibles.
- Las altas críticas no dejan registros sin `TenantId` cuando la entidad lo requiere.
- Los endpoints sensibles fallan correctamente cuando falta auth o permisos válidos.
- El contexto de sucursal no depende de un fallback hardcodeado.
- `web` y `admin` pueden consumir sus rutas críticas sin contratos rotos bloqueantes.
- La configuración mínima de entornos deja de depender de defaults inseguros visibles en repo.
- Existe al menos una validación repetible para los flujos críticos endurecidos.

## Criterio de salida de fase 1

- Los bloqueadores críticos de seguridad y tenancy quedan cerrados o reducidos a pendientes explícitos no bloqueantes.
- El sistema deja de depender de enforcement implícito para tenant y sucursal en sus flujos críticos.
- La superficie API sensible queda protegida de forma explícita.
- Los defaults inseguros dejan de ser parte del camino normal de ejecución.
- Los contratos críticos entre frontends y API quedan lo suficientemente alineados para validar comportamiento real.
- Hay una base mínima de validación que soporte seguir endureciendo sin operar a ciegas.

## Qué habilita la fase 2

- Hardening adicional sobre permisos finos y separación más clara entre plataforma y tenant.
- Estabilización de operabilidad y documentación ampliada.
- Decisiones de productización con menor riesgo sobre onboarding multi-cliente.
- Priorización funcional posterior sin seguir acumulando deuda de seguridad básica.
