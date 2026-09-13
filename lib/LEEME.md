# `lib/` — trozos que NO son funciones

Vercel convierte en función **cada fichero de `api/`**, y el plan de Aitor
(Hobby) admite **12 funciones de servidor como mucho**.

El 28-08-2026 se pasó de doce y el despliegue falló con:

> *No more than 12 Serverless Functions can be added to a Deployment on the
> Hobby plan.*

Y no era por haber añadido dos endpoints, sino por dos ficheros de **datos**
—la lista de estaciones de Euskalmet y el certificado de IZENPE— que se
habían dejado dentro de `api/`. Vercel los contaba como funciones aunque no
atiendan a ninguna dirección.

**Regla: en `api/` solo lo que atiende una dirección. Todo lo demás, aquí.**
Los `import` desde `api/` siguen funcionando igual; Vercel los empaqueta.
