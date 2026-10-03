# Para la sesión del MacBook — 03-10-2026, por la tarde (desde el iMac)

Lo que Claude recuerda entre conversaciones se queda en el iMac; esto es lo que no está en los ficheros.

1. **Antes de nada** lee TRASPASO.md §67 (y sus dos «avance») y el principio de CLAUDE.md (regla de gasto del 03-10: solo lo que Aitor pida y los fallos; sin agentes por iniciativa propia; mirar el consumo antes de trabajo largo).

2. **Decisiones suyas de hoy:**
   - **Sirimiri en el norte:** la llovizna del código prestado de ECMWF con poca agua (≤ 1 mm/h) ES sirimiri, diciendo «la llovizna la ve ECMWF». En invierno se queda días.
   - **La lluvia es de su dueño** (AROME HD; ECMWF donde no llega): «Llueve bien» solo si otro modelo da > 1 mm/h a la misma hora; lo de los demás, con su nombre y sus horas. Función única: `lluviaDeUnSitio()`.
   - **Rayo:** fuera el «Automático» (best_match, una mezcla) y dentro ECMWF 9 km (`ecmwf_ifs`), en la app y en el vigilante. Medido contra AEMET: 82 % frente a 73 %.
   - **El tiempo del Centro Operativo** (`../centro-operativo/js/weather.js`) lo lleva la sesión de Aitor Meteo, con las mismas reglas. Se publica en **Cloudflare** (`./publicar-cloudflare.sh`), no en Netlify (suspendido hasta el 23-10). La llave de Cloudflare está en el iMac (`~/.centro-operativo-cloudflare`): desde el MacBook seguramente no se puede publicar el Centro Operativo.

3. **Cómo se trabaja:** toda prueba se ve ROJA rompiendo el arreglo a propósito (con un script que restaure siempre el fichero) antes de publicar; `./deploy.sh` y, si sale bien, commit + `./subir-a-github.sh`, encadenado con `&&`. Nunca `git push` directo. Nunca escribir el código del candado. Ahora `revisar.sh` también pasa `prueba-lluvia-en-vivo.mjs`.

4. **Lo primero:** comprobar que en el MacBook funcionan `vercel whoami` y `./subir-a-github.sh`. Si Vercel pide volver a entrar, que lo haga él.

5. **Luego:** mirar en `/api/vigilante?pulso=1` que la primera pasada con ECMWF 9 km (publicado hacia las 18:00) ha ido sin fallos.

6. **Pendiente por peligro** (detalle en §67): a) franja de Ahora y barra de 48 h (horas de tormenta sin marcar); b) vigilante (parte «sin nada» con sitios sin mirar; sin AROME no avisa de agua; lluvia normal como unión de modelos); c) lluvia restante (`lluviaQueNoVesTu` llama sirimiri a ECMWF 1,1 mm/h; textos sin firmar; «Próxima lluvia» sin nombrar al modelo); d) ventana de trabajo y Avisos; e) menores.
