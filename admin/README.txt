PASOS RÁPIDOS PARA LEVANTAR EL FRONTEND (Angular 20):

1) Genera un proyecto vacío con el CLI (esto crea package.json y config actuales):
   ng new Optica --routing --style=css --standalone --ssr=false
   cd Optica

2) Instala Tailwind:
   npm i -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p

3) Instala Angular Material:
   ng add @angular/material

4) COPIA los siguientes archivos desde esta carpeta a tu proyecto:
   - Reemplaza `src/` completo con el `src/` de este paquete.
   - Copia `tailwind.config.js`, `postcss.config.js` a la raíz del proyecto.
   - *No* borres tu package.json ni angular.json.

5) Ejecuta:
   npm start
   (o) ng serve -o

Notas:
- El layout usa Angular Material + Tailwind.
- Las rutas ya están listas: /dashboard, /inventario, /clientes, /historias, /ordenes.
- Ajusta el `environment.development.ts` con tu URL de API.
