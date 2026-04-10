# STATE

## Hecho confirmado

- Sistema: Opticsoft.
- Propósito actual: sistema para operación de ópticas con módulos de autenticación, usuarios, sucursales, pacientes, historias clínicas, órdenes/pagos, inventario, dashboard, soporte y administración global básica.
- Stack observado en repo:
  - Backend: .NET 10 en `api/src/Opticsoft.Api/Opticsoft.Api.csproj`.
  - Frontends: Angular 20 en `web/package.json` y `admin/package.json`.
  - Base de datos: SQL Server.
- El backend fue alineado a .NET 10 en un mini sprint backend-only a nivel de código y base de build.
- `web` y `admin` no formaron parte de ese mini sprint y no se asume Angular 21.
- Clasificación actual: producto en formación con operación tipo piloto controlado.
- Veredicto técnico actual: no está listo como SaaS B2B serio ni como plataforma multi-tenant endurecida.
- Bloqueadores activos:
  - enforcement de tenant inconsistente por request y por persistencia
  - endpoints sensibles con auth/authz insuficiente o ambigua
  - secretos, credenciales por defecto y fallbacks inseguros en repo
  - contexto de sucursal débil
  - frontera débil entre `web` y `admin`
  - contratos críticos rotos entre frontend y backend
  - ausencia observable de pruebas backend y quality gates mínimos del monorepo
- Fase actual del proyecto: hardening fase 1.
- In-scope de la fase actual:
  - tenancy enforcement
  - auth/authz
  - secretos y configuración
  - branch context
  - contratos críticos frontend-backend
  - quality gates mínimos
- Out-of-scope de la fase actual:
  - nuevas funcionalidades de negocio
  - refactor masivo de arquitectura
  - rediseño de UI
  - benchmark de mercado
  - documentación amplia fuera de los documentos canónicos mínimos
- Fuentes primarias:
  - auditoría inicial del proyecto
  - auditoría cerrada de seguridad y tenancy
- Documentos canónicos relacionados:
  - `docs/security/tenant-auth-audit.md`
  - `docs/roadmap/hardening-phase-1.md`
  - `docs/roadmap/hardening-phase-1-backlog.md`

## Inferencia razonable

- El monorepo ya existe como estructura física, pero todavía no opera como plataforma gobernada de forma consistente.
- La intención SaaS y multi-tenant es clara en el modelado y en `admin`, pero el enforcement observable no la respalda todavía.
- El sistema parece más cercano a un despliegue controlado para una óptica o cadena piloto que a una operación repetible para múltiples clientes.

## Pendiente por validar

- Si existe gobernanza CI/CD real del monorepo desde `.github/workflows` en raíz. Hay evidencia parcial y sigue pendiente por validar; no está confirmado desde raíz del monorepo.
- Si el despliegue productivo usa secretos externos que mitiguen los defaults visibles en repo.
- Si existe infraestructura externa que resuelva de forma consistente `PathBase`, proxy y contexto de tenant/sucursal.
- Si el VPS de despliegue ya dispone de `Microsoft.AspNetCore.App 10.x` para el backend actualizado.
- Si ya se ejecutó un smoke real de arranque post-upgrade del backend sobre .NET 10 en entorno de despliegue.
- Si existe observabilidad operativa fuera del repositorio.

## Siguiente acción recomendada

- Ejecutar la fase 1 de hardening con foco cerrado en enforcement y gobernanza: tenant, auth/authz, secretos/configuración, branch context, contratos críticos y quality gates mínimos.
