/* Las reglas del tiempo (reglas-tiempo.js, la copia única) cargadas en el
   servidor. Es un script clásico para el navegador que al final se exporta
   con `module.exports` si existe; aquí se lee con require, que Vercel sí
   rastrea al empaquetar la función (04-10-2026). */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const ReglasTiempo = require('../reglas-tiempo.js');
export default ReglasTiempo;
