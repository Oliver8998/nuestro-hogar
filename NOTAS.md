# Nuestro Hogar — notas del proyecto

Documento vivo: aquí se apunta todo lo decidido y lo pendiente para no perder nada entre sesiones.

## Qué es
- Juego cooperativo de Oliver y su novia: un piso cutre en isométrico que se va arreglando y decorando. Sin personajes jugables: se arrastran las cosas.
- Web móvil (PWA): ella tiene iPhone y él Android.
- Online: https://oliver8998.github.io/nuestro-hogar/ (repo Oliver8998/nuestro-hogar). Copia local: `C:\Users\olive\Documents\nuestro-hogar`.
- Regla: a Oliver no se le pasa código. Lo meto yo directamente en el repo y en la carpeta, y hago push.

## Técnica
- Three.js 0.170 por CDN (import map), cámara ortográfica isométrica a 32°, habitación centrada y zoom 1.
- Guardado en localStorage con la clave `hogar-estado`. El `sw.js` es network-first: hay que subir la versión de la caché en cada cambio.
- Rejilla de casillas de 0,5 m en una habitación de 6×6 m. Apilado con `soporte` (altura de la superficie) y `apoyo()`.
- Los modelos son listas de `piezas`: `[w,h,d,x,y,z,color,forma?,{rx,ry,rz,transparente,brillo,metal,rugosidad}]`. El orden de las piezas importa para:
  - `colores.grupos`;
  - `encendible.piezas`;
  - el cuerpo del robot (piezas 3..5).
- Pruebas: playwright con `/usr/bin/google-chrome`, swiftshader y los service workers bloqueados. El servidor es `python3 -m http.server 8765`.

## Archivos (js/)
- Datos y modelos:
  - catalogo: muebles, materiales, rarezas y precios;
  - modelos: `construirPiezas`.
- Escena:
  - muebles: el gestor de colocar, arrastrar y apilar;
  - sala: habitación, paredes, puerta y desperfectos;
  - camara.
- Interacción e interfaz:
  - controles: los toques;
  - ui: tienda, inventario, ruleta, misiones y diálogos;
  - tienda3d: Pilar en el mostrador;
  - miniaturas.
- Sistemas del juego:
  - mascotas;
  - personajes: Pilar y Robi;
  - entregas: la furgoneta y el paquete flotando en la puerta;
  - suciedad: polvo, telarañas, bichos, barro, caca, robot friegasuelos y Robi;
  - misiones;
  - minijuegos: uno por tipo de suciedad;
  - inventario: objetos con usos;
  - ruleta;
  - sonido.
- main: lo orquesta todo.

## Hecho (resumen)
- Tienda e inventario:
  - Tienda 3D con la dependienta Pilar: lista de dos columnas con pestañas de texto y el objeto girando despacio en el mostrador.
  - Inventario en un panel inferior de 2 filas con barra de scroll. Para colocar algo se arrastra, viendo una vista previa.
  - Los pedidos tardan: llegan en furgoneta y el paquete se queda flotando y girando en la puerta.
- Ruleta con exclusivos, monedas y tickets.
- Mascotas: se adoptan pagando, se les pone nombre, se juega con ellas y tienen sus objetos.
- Suciedad:
  - Hay un minijuego para cada tipo y se usan productos con varios usos.
  - Soluciones periódicas: robot friegasuelos, arenero, jardín, trampa, y Robi, que es un robot de limpieza (decisión explícita de Oliver).
- Misiones diarias, de historia y eventos largos (por ejemplo, la visita de la madre en 10 días).
- Ajustes generales:
  - blancos y brillos rebajados;
  - cámara a 32° y centrada (Oliver: "está bien así");
  - economía más lenta y precios más altos.

## Modelos mejorados con Blender (hecho en gran parte, 23-nov-2026)
Petición de Oliver: "mejora todos los items, muebles, manchas, todo, con Blender, que siga siendo este estilo pero mejor".

Plan:
1. Blender (5.2.1, en el PC de Oliver, por MCP) genera la geometría por script con bmesh:
   - bordes biselados, cojines mullidos, torneados (lathe) para jarrones, macetas y pantallas, hojas, más detalle;
   - todo en metros y con la misma huella y la misma altura de `soporte`.
2. Convenciones del GLB:
   - Un nodo raíz `item_<id>` por objeto.
   - Las mallas `p<i>` sustituyen a la pieza i del catálogo: el color y el material salen del catálogo, así que se siguen pudiendo elegir colores y las luces se siguen encendiendo.
   - Los detalles extra van en mallas `c<hex>_<n>`, con material propio del GLB.
   - Ejes: three (x,y,z) → Blender (x,-z,y). En la exportación se usa +Y arriba.
   - Rotaciones de three en orden XYZ: en mathutils se usa `Euler(...,'ZYX')`.
3. Exportar a `Documents/nuestro-hogar/assets/modelos.glb`, pasarlo al repo y añadirlo a la caché del sw.
4. En JS:
   - Añadir GLTFLoader (`three/addons/`), precargar el GLB y crear `construirItem(info)` en modelos.js. Si falta un modelo, se usan las `piezas` de siempre.
   - `liberar` no debe tirar la geometría compartida.
   - Usarlo en muebles, miniaturas, tienda3d, el robot de suciedad y los modelos de suciedad.
5. Probar con playwright, hacer push y copiarlo a Documents.

## Interfaz
- Los botones (Tienda, Inventario, Misiones, Ruleta, Adoptar y sonido) están en una barra abajo, centrada, porque a la derecha tapaban la casa (petición de Oliver, 23-nov). La barra se oculta cuando el inventario está abierto.

## Plan "todas las ideas" (pedido el 23-nov: "me gustan todas, mete todas")
Fases:
1. ✅ Día y noche con la hora real, clima en la ventana y temporadas.
   - `ambiente.js`. Para probar: `?hora=22&clima=lluvia&temporada=navidad`.
   - Temporadas: Halloween (20 oct – 2 nov), Navidad (10 dic – 6 ene), San Valentín (7–15 feb) y el aniversario. Hay una pestaña "Temporada" en la tienda con objetos exclusivos (`temporada:` en el catálogo, que aún no tienen modelo de Blender).
2. ✅ Botón "Más" (✨) en la barra, que abre la hoja genérica `hoja-gen` / `ui.abrirGen`, con el módulo `mas.js`:
   - Ajustes: nombres, nombre de la casa, aniversario, cumpleaños y sonido. Pilar felicita en las fechas especiales y da un regalo; se guarda en `estado.celebrado`.
   - Cartel de madera con el nombre de la casa y los nombres, en la pared de la ventana.
   - Fotos subidas (`hogar-fotos` en localStorage, reducidas a 640 px) colgadas en 8 huecos de las paredes (`estado.paredFotos`).
   - Foto bonita de la casa con marco, que se puede compartir.
   - Diario con el antes y el después (`hogar-diario`): guarda una foto automática cada 2 días como mínimo.
3. ✅ Minijuegos para ganar monedas (cocina, memory, puzzle con foto), racha diaria, teletrabajo (ordenador) y huerto.
4. ✅ Objetos que se usan: sofá, tele con dibujos, radio con música y piano con teclas.
5. ✅ Mascotas:
   - Personalidad (`PERSONALIDADES`). Crecen: son bebés hasta los 4 días (escala de 0,7 a 1).
   - Trastadas: tiran deco (`datos.tirado` en el mueble) y se levanta con "🙌 Levantar".
   - Accesorios (`acc-*` en MATERIALES) que se ponen desde el menú de la mascota → 🎀 Ropa.
6. ✅ Progresión (`progreso.js`):
   - CASAS: piso cutre, piso reformado, ático, casa con jardín y mansión. Mudarse cuesta monedas y pide un mínimo de acogedor.
   - Habitaciones: `estado.habs[i]` guarda {muebles, suciedad, paredes}; la actual vive en el juego y `estado.habActual` es local. Se cambia con la pastilla de arriba.
   - Al mudarse se completan todos los desperfectos (`sala.completarTodo`).
   - Acogedor de 0 a 100, que da tickets al llegar a 50, 70 y 90.
   - Colecciones (`COLECCIONES`) y 21 logros (`LOGROS`), que dan +30 monedas cada uno.
7. ✅ Pareja con Supabase: sincronizar, notitas en la nevera, regalos, votaciones y misiones de pareja.
   - Proyecto Supabase `nuestro-hogae`, URL https://lekqmspkizhxsceyswzu.supabase.co, con la publishable key en `js/sync.js`. Oliver ya ejecutó el SQL de las tablas `hogares`, `mensajes` y `fotos` (RLS abierta para anon y realtime activado).
   - `sync.js` usa REST + sondeo cada 3 s (sin supabase-js). La casa entera va en `hogares.datos`; gana la última escritura y se usa `version` para el bloqueo optimista.
   - Los muebles llevan `uid` y se aplican por diferencias (`sincronizarMuebles` en main). Solo el móvil "yo=0" (quien creó la casa) genera suciedad.
   - `pareja.js`: notas (`estado.notas`), regalos (`estado.regalos`), votos (`estado.votos`) y misiones de pareja (`estado.parejaDia`). Las fotos van a la tabla `fotos`.
   - Desde el contenedor no se llega a supabase.co: se prueba con un Supabase falso en playwright (`/tmp/prueba/pareja.py`).
   - Juegos y usos: `juegos.js` (cocina, parejas, puzzle; 3 partidas premiadas al día) y `usos.js` (huerto, ordenador/teletrabajo, tele con dibujos, radio con música, piano, sofá con mascotas y notas de la nevera).

## Segunda tanda de ideas (pedida el 23-nov a las 17:32: "mete todo")
Lo de "más mundo" (jardín, terraza, exterior) va SOLO en las casas siguientes al piso y se va ampliando según se avanza.
- P1, pareja:
  - reacciones y presencia en directo (realtime broadcast);
  - cápsula del tiempo;
  - lista de deseos;
  - calendario de planes, con objetos que aparecen en casa;
  - canción vuestra en la radio;
  - "nuestro primer…" (recuerdos) y árbol de recuerdos.
- P2, vida:
  - hora de dormir (manta en el sofá, mascotas a dormir, luces);
  - visitas;
  - averías (gotera y se va la luz) con minijuego;
  - cumpleaños de las mascotas;
  - buzón con cartas.
- P3, cosas que crecen:
  - plantas que hay que regar (mustias o florecen);
  - desgaste y tapizar;
  - acuario vivo (comer y crías).
- P4, economía:
  - mercadillo de fin de semana;
  - pedidos a medida (color libre);
  - reciclar y taller;
  - pase mensual.
- P5, juntos en el mismo móvil:
  - duelo de limpieza y cocina en equipo a pantalla partida;
  - retos de decoración puntuados por el otro.
- P6, más mundo:
  - exteriores: terraza en el ático, jardín en la casa y jardín grande en la mansión, con objetos que se desbloquean;
  - la calle por la ventana;
  - mascotas nuevas: loro, tortuga, cobaya y dragoncito.

### Estado de la segunda tanda: ✅ todo metido (23-nov, por la tarde)
- `pareja.js`:
  - `recordar()` guarda en `estado.recuerdos`;
  - cápsulas (`estado.capsulas`), deseos (`estado.deseos[yo]`) y planes (`estado.planes`; sus objetos salen en `usos.propsPlanes`).
- `sync.js`: `conectarDirecto()` usa supabase-js (realtime broadcast `hogar-CODIGO`) para las reacciones y los toques 💗. Si falla, las reacciones van por la tabla `mensajes`.
- `vida.js`: manta y dormir, visitas (`estado.visita`), averías (`estado.averia`; minijuegos `gotera` y `luz` en juegos.js), cumplemeses de mascotas, buzón (`estado.correo`; el catálogo da un 25% en 3 objetos), loro que habla y dragón con fuego.
- `usos.js`:
  - plantas: regar con `datos.agua` y `datos.racha`; se ponen mustias a los 2 días sin agua y florecen con 3 días seguidos;
  - desgaste: `datos.nuevo` y "Tapizar" por 40;
  - acuario: los peces nadan, "Dar de comer" y crías;
  - "Nuestra canción" en la radio (`pareja.cancion` en Ajustes).
- `economia.js`:
  - mercadillo el sábado y el domingo (para probarlo: `?finde`);
  - pase del mes (`estado.pase`) con corona al completarlo;
  - taller: reciclar (`estado.piezas`), fabricar exclusivos y encargo a medida con un color libre `'#hex'`. `tonosDe` está en muebles.js.
- Más mundo:
  - exteriores Terraza (ático), Jardín (casa) y Jardín grande (mansión). `EXTERIORES` está en progreso.js y `sala.modoExterior` pone valla o barandilla sin paredes;
  - objetos `categoria: 'exterior'` con `nivel`: la pestaña 🌳 de la tienda sale desde el ático y solo se pueden colocar fuera;
  - colecciones nuevas: terraceo, verano y lujo;
  - la vista de la ventana cambia con la casa (`ambiente.vista`): calle con gente y coches (y la furgoneta si hay un pedido), tejados, jardín o colinas;
  - mascotas nuevas: cobaya, tortuga, loro y dragón (`vale-dragon` en la ruleta).
- Minijuegos para dos en el mismo móvil (`JUEGOS_DOS`: duelo y equipo) y retos de decoración (`estado.reto`, que puntúa el otro).
- Modelos de Blender nuevos en `blender/m_exterior.py`.
- Comprobación de sintaxis: `/home/claude/check.sh`. `node --check` no detecta errores en catalogo.js: hay que importarlo.

## Menú principal y cuentas (hecho, commit eee6016)
- `js/inicio.js`: pantalla `#inicio` al abrir. Crear cuenta o iniciar sesión (usuario + contraseña). Con la sesión iniciada: crear casa, unirse con código o "Seguir en vuestra casa".
- Una sola casa por cuenta y máximo 2 personas por casa. Quien se une se queda en esa casa.
- Supabase: tabla `cuentas` (con RLS y sin políticas) y RPCs `registrar_cuenta`, `entrar` y `asignar_hogar` (bcrypt con pgcrypto). Se guarda en `hogar-cuenta`; la contraseña solo está en memoria.
- `js/pareja2.js` (hub 💕 Nosotros): pregunta del día, quiz, mapa de viajes, cuenta atrás, buenas noches 🌙 y metas.

## Tercera tanda (pedida el 23-nov 18:10: "todo menos lo de vosotros dentro del juego") — HECHA
- Más casa (`js/casa2.js`):
  - Reformas (Más → 🪵): suelos (texturas canvas con UV planares en `sala.decorSuelo`), papel pintado (`sala.ponerPapel`, no deja pintar encima), cortinas, marcos y ventanal grande, tiras LED (arcoíris animado) y bombillas de color.
  - Se compra una vez (`estado.decor.compras`) y se pone por habitación en `estado.decor.salas['nivel-hab']`. Suma "Reformas a vuestro gusto" al acogedor (`extras` en `calcularAcogedor`).
  - Cocina (objeto `cocina` o Más → 🍳): `estado.despensa` (el huerto da ingredientes; huevos, harina, queso y leche se compran; setas y moras salen en los paseos), 8 `RECETAS` con un minijuego de punto de cocción → `estado.platos`. Los platos sirven para comer juntos (monedas), para dar a una mascota o para las fiestas.
  - Lavadora: `estado.ropa` sube cada 3 h si hay lavadora (solo yo=0) → Lavar (15 min, vibra) → Tender (minijuego de pinzas).
  - Chimenea (`nivel: 3`): fuego animado, luz que parpadea y chasquidos (`sonido.chasquido`). En invierno da +10 de acogedor si está encendida.
- Mascotas (`js/mascotas2.js`, botón ⭐ Más en el menú de la mascota):
  - trucos (`m.trucos`, 3 entrenos con el minijuego del aro; estado 'truco' en mascotas.js);
  - concursos semanales de belleza y carrera (`estado.concursos`, `estado.trofeos`);
  - paseo (perro y zorro) en canvas;
  - crías (`estado.crias`, nacen en 24 h; los dos padres adultos y contentos, máximo una vez cada 7 días).
- Social (`js/social.js`, Más → 🏘️ Amigos):
  - visitar casas por código en modo solo mirar (`visitando` en main: `guardar` y `aplicarRemoto` se aplazan; `controles.soloMirar`; `sala.modoVisita`);
  - me gusta y notas mediante la tabla `mensajes`, tipo 'visita', a la casa del otro;
  - ranking de amigos con `estado.puntuacion` y `estado.likes`;
  - fiesta: invitados que bailan; puntúan la comida, la música, las luces, lo acogedor y la gente.
- Rejugabilidad:
  - `js/sorpresas.js`: nevada dentro con el minijuego de copos, gatito en la puerta para adoptar y mapa del tesoro escondido en un mueble con pistas. Para probar: `?sorpresa=nieve|gato|tesoro`.
  - Logros nuevos y 14 secretos (`secreto: true`, salen como ??? y dan 80).
  - `js/fotoeditor.js`: filtros (aplicados por píxel para que funcione en iOS), pegatinas que se arrastran y marcos. También se puede guardar en el álbum.
  - `js/lofi.js`: música lofi generativa (mañana, tarde y noche) que se activa en Ajustes; se calla con la radio o en las fiestas.
- `juegos.custom(icono, nombre, montar)` sirve para montar minijuegos desde otros módulos (`j.alTerminar` para limpiar).
- Modelos de Blender en `blender/m_casa3.py`: cocina, lavadora y chimenea (`VERSION_MODELOS = 6`).
- Depuración: `?debug` expone `window.__h`. Tests en `/tmp/prueba/t3.py`, `t4.py` y `t5.py <nieve|gato|tesoro|fiesta|foto|lofi>`.

## Cuadros y pintar (pedido el 23-nov 19:20) — HECHO
- `js/cuadros.js`: los cuadros se cuelgan donde se quiera, en cualquier pared y en cada habitación.
  - Se guardan en `estado.cuadros` = `{id, foto, hab:'nivel-hab', pared, x, y, tam s|m|l|xl, marco madera|blanco|negro|dorado|polaroid|lienzo, k}`.
  - Sustituye a los 8 huecos fijos; `paredFotos` se migra solo.
- Para colgar: `cuadros.colocar(fotoId)` activa `controles.capturaToque`. Se toca una pared visible (no deja tapar la ventana ni la puerta), se eligen tamaño y marco abajo y se pulsa Listo.
- Al tocar un cuadro colgado: mover o cambiar el marco, retocar (si es pintado) o descolgar. En controles van `distCuadro` y `tocarCuadro`.
- Más → 🖼️ Fotos y cuadros:
  - "Fotos de la galería" deja elegir varias (`multiple`); con una sola se pasa directo a colgarla;
  - "Pintar un cuadro" abre `js/pintar.js`: formato y fondo, pincel, borrador, cubo de relleno, 4 grosores, 16 colores + uno libre y deshacer.
- Los cuadros pintados son fotos con `pintura: true` (se sincronizan por la tabla `fotos`).
- Acogedor: cuenta los cuadros de la habitación. Logros nuevos: Artistas y Galería de arte (10 cuadros).

## Trabajo del día (pedido el 23-nov 19:33) — HECHO
- `js/trabajos.js`: 14 minijuegos de trabajo (`TRABAJOS`): pizza, barista, florista, almacén, fachada, cajero, hamburguesa, dj, jardinero, taxi, fotógrafo, pastelero, biblioteca y fontanero.
  - Cada uno tiene `jugar(j, {sonido})` sobre `juegos.custom`; los helpers son `cronometro`, `bucle` y `marcador`.
- Cada día toca uno al azar con semilla por fecha (`delDia`), el mismo en los dos móviles y nunca el mismo que ayer. Para probar uno: `?trabajo=id`.
- 3 turnos al día a paga completa (hasta `pago`, con propina del 25% si es perfecto); después, horas extra al 30%.
- Datos en `estado.trabajos` = `{dia, turnos, mejor{}, hechos[]}`. Hay un chip con los turnos que quedan y un mosaico en Más → 💼.
- Logros: Currantes (5 trabajos distintos); secretos Pluriempleo (los 14) y Empleados del mes (5 turnos perfectos).
- Test: `/tmp/prueba/t7.py hoja,pizza,...`.

## Menú principal bonito (pedido el 23-nov 19:56) — HECHO
- `inicio.js` dibuja con `escenaSvg(nivel)` una escena SVG animada que depende de la hora:
  - de día: sol, nubes y pájaros; al atardecer, el sol se pone; de noche: luna, estrellas que titilan y luciérnagas;
  - casa con humo en la chimenea, ventanas que brillan, gato moviendo la cola, flores, corazones subiendo, valla desde el nivel 3 y torres en la mansión.
- Título con letras que entran y botan.
- En bienvenida, frases que van rotando y el botón grande "¡Empezar!".
- Con la sesión iniciada se ve una tarjeta de la casa (`ctx.resumen()` en main): monedas, racha, acogedor y hasta 3 novedades (regalo diario, trabajo de hoy, mascotas, cartas, pregunta del día y fechas especiales), más el botón "▶ ¡A jugar!" que late.
- El suelo de la escena sube con `.suelo-escena` para que la casa se vea por encima de la tarjeta.

### Escaparate 3D en el menú (pedido el 23-nov 20:03: "menos textos y más visual")
- `js/escaparate.js`: un segundo renderer de three dentro de `#inicio` que va pasando 7 casas decoradas (`SALAS`): salón, dormitorio romántico, cocina, rincón gamer, jardín, mansión y Navidad.
  - Cada sala tiene suelo y papel de casa2, muebles reales (con `GestorMuebles` en un grupo), mascotas, ventana con cortinas y LED, y versión de noche.
  - Entra con rebote, los muebles aparecen uno a uno, la cámara se balancea y cambia sola cada 6,5 s (tocarla no hace nada). Se destruye al cerrar el menú.
- 23-nov 20:13: sin nombre de sala ni puntitos; el fondo es solo cielo (sin colinas, vallas ni árboles). La luz de las salas sigue la hora real (`periodo()` y `LUZ` en escaparate.js): de día luz natural, al atardecer anaranjada y de noche oscuro con lámparas, chimenea y LED encendidos.
- 23-nov 20:20: cielo más elaborado:
  - degradado de 4 colores, sol con halo y rayos que giran, luna con cráteres y halo;
  - nubes esponjosas con sombra y brillo, banco de nubes abajo, globo aerostático (de día y al atardecer), Vía Láctea, estrellas que brillan y estrella fugaz.
  - Se quitaron las burbujas de avisos del menú.
  - La habitación tiene altura fija (52vh, o 44vh con sesión) y todo va centrado, para que no quede hueco hasta los botones.
- El menú tiene ahora menos texto: el título, el nombre de la sala con puntitos, una tarjeta mini (casa, 🪙, 🔥, 🕯️) y avisos en burbujas con icono (`resumen().novedades` = `{i, t}`).

## Día y noche reales (pedido el 23-nov 20:26) — HECHO
- `js/sol.js` calcula el amanecer y el atardecer (fórmula NOAA) según la zona horaria del móvil, con una tabla de ciudades (Madrid, Canarias, Lisboa, Latinoamérica…) y la fecha, así que tiene en cuenta la estación.
- `horaSolar()` estira la hora real para que el amanecer real caiga en el 7 de las tablas de ambiente y el atardecer en el 19,3; `ambiente.horaSol` la usa para luz, cielo y `esNoche`.
  - `ambiente.hora` sigue siendo la hora real: la usan las visitas, dormir y el lofi.
- `periodoSolar()` da día, atardecer o noche para el menú (escaparate y cielo). `?hora=` lo sigue forzando.

## Ideas pendientes (no pedidas aún)
- Sincronizar los dos móviles (Supabase).
- Minijuegos para ganar monedas.
- Mudarse a casas mejores, hasta una mansión.

### Cómo regenerar los modelos
- Los scripts están en `blender/`:
  - `hogar_lib.py`: helpers B (caja biselada), K (cojín), Y (cilindro), S (esfera), L (torno), T (toro), U (tubo) y P (prisma);
  - `m_muebles.py`, `m_resto.py`, `m_materiales.py` y `m_suciedad.py`: un `@modelo('id')` por objeto;
  - `catalogo.json`: los colores de las piezas, generados desde `js/catalogo.js` con node.
- En Blender (MCP): `import construir; construir.construir_todo(); construir.exportar()` escribe `assets/modelos.glb` con compresión Draco.
- Para ver todos los modelos con la luz del juego: `blender/vista.html` (`?viejo` muestra los antiguos y `?ids=a,b` filtra).
- En el juego:
  - `modelos.js` carga el GLB (GLTFLoader + DRACOLoader del CDN) y `construirPiezas(piezas, {id})` usa el modelo nuevo si existe.
  - `modeloSuelto('sucio-x')` sirve para la suciedad, el robot que se mueve (`robot-suelo`) y las cucarachas.
- Al copiar archivos al PC con `device_commit_files`, a veces se copia una versión vieja: hay que comprobarlo y repetir si pasa.

## Idiomas (ES / EN)
- `js/i18n.js` + `js/i18n_en.js` (~1535 frases). No hay claves en el código: el texto español se traduce al vuelo en el DOM (MutationObserver), igual en textos que en placeholder/title/aria-label/alt.
- `idioma()` lee `localStorage['hogar-idioma']`; si no hay, español si el móvil está en español, si no inglés. `ponerIdioma(i)` guarda y recarga.
- Cambiar idioma: píldora ES/EN en el menú principal o botón en Ajustes.
- Reglas de `traducirTexto`: exacta → patrones con `{n}` (un hueco pegado a una letra puede ir vacío, sufijo 'es' → 's') → minúscula → quitar emojis de los lados → partir por ' · ' / ' | ' → partir listas por ', '.
- Para textos nuevos: añadir la frase española exacta (o con `{0}`) a `i18n_en.js`. `[data-no-traducir]` excluye un bloque. Prueba: `/tmp/prueba/t10.py` lista lo que queda en español.

## Nombre
- El juego se llama **Our Place** (igual en los dos idiomas). Descartados: Little Nest (suena a bebés), Hearthly, Snug, Homely, Two Keys, Housewarming.
- Está en `js/inicio.js` (título animado), `index.html` (title y apple-mobile-web-app-title), `manifest.json` y el texto de invitación de `js/pareja.js`.
- Antes de publicarlo en tiendas: revisar bien el nombre (existe un juego de itch.io "Our Place" de 2019, la app educativa "OurPlace" y la marca de cocina Our Place, registrada solo para menaje). Valorar un subtítulo o una palabra inventada.
- "Nuestro Hogar" sigue siendo solo el nombre por defecto de la casa (lo cambia cada pareja en Ajustes).

## Revisión general y mejoras (23-nov 21:00, "adelante" con todo)
- Arreglado: en el menú faltaban `error()` y `ocupado()` (se perdieron con el escaparate), así que Entrar / Crear cuenta / ¡A jugar! fallaban.
- Supabase gratis se pausa tras 7 días sin actividad → `.github/workflows/mantener-vivo.yml` hace una consulta cada 3 días (se puede lanzar a mano en Actions). GitHub desactiva los cron tras 60 días sin commits en el repo: si pasa, reactivarlo en la pestaña Actions.
- Copia de seguridad: Ajustes → 💾 Descargar / 📂 Restaurar (`mas.descargarCopia` / `restaurarCopia`; JSON con `instantanea()`, fotos y diario).
- Menú Más reordenado (`extrasMenu` en main + `mas.abrir`): Buzón, Nosotros (incluye "Notas y regalos" = `pareja.abrir`), Ganar monedas (`abrirGanar`: trabajo + minijuegos), Objetivos (`abrirObjetivos`: pase, logros, colecciones), Casas, Reformas🔒, Cocina🔒, Amigos🔒, Taller🔒, Reto🔒, Fotos (`mas.abrirFotos`: foto, cuadros, diario, fotos del día) y Ajustes. Bloqueos con `bloqueoSi()` según `estado.historia` y el nivel de casa. `abrirHub(titulo, tiles)` sirve para hubs nuevos.
- Guía de inicio `js/guia.js` (5 pasos con flecha 👇 sobre los botones; avanza con `registrar()` y clics; `localStorage['hogar-guia']`, cada móvil la suya; se salta sola si `historia >= 3`).
- Los diálogos de inicio ya no salen con el menú abierto (`enMenu()` dentro de `dialogoAbierto()`).
- Suciedad, trastadas y ropa: las genera el móvil que tiene el turno (`estado.generador = {yo, hasta}`, se renueva cada 60 s, caduca a los 2 min) → si uno juega solo, la casa también se ensucia.
- Sin castigos: la madre ya no quita monedas (deja 30). Al volver tras 3+ días: "¡Os echábamos de menos!" con 60 monedas por día (máx. 300) y 2 tickets.
- Foto del día: `mas.postalDelDia()` una vez al día (`hogar-postal-dia`), polaroid con frase de una mascota; se guardan en `hogar-postales` (máx. 45) → Fotos → Fotos del día.
- Estado de ánimo: chip 💭 (con casa compartida) → 12 estados en `estado.animo[yo]` (duran 20 h). Al otro le sale un aviso.
- Racha de pareja: `estado.vistos[yo]` + `estado.rachaPareja` (sube si entráis los dos el mismo día; da 10 monedas × días, máx. 100). La tarjeta del menú muestra esta racha con casa compartida.
- Tras la mansión: `AMPLIACIONES` (Cine, Biblioteca, Gimnasio, Invernadero, Salón de baile, Torre del observatorio) en Casas → `estado.ampliaciones`; `habsCasa()` da la lista de habitaciones real.
- Notificaciones push:
  - Cliente: `js/avisos.js` (Ajustes → 🔔), `sw.js` con `push` y `notificationclick`. `window.avisarPareja(tipo, texto)` se llama al dejar nota, regalo, buenas noches, reacción 💗 y estado de ánimo.
  - Servidor MONTADO (23-nov 22:05): tablas de `supabase/avisos.sql` creadas y Edge Function `avisar` (código en `supabase/functions/avisar/index.ts`) desplegada desde el panel, con **Verify JWT desactivado**. Las claves VAPID se generaron solas y están en `push_claves`. Probado: clave, suscribir, enviar y quitar responden 200.
  - En iPhone solo funciona con el juego añadido a la pantalla de inicio (iOS 16.4+).
- Tests nuevos: `/tmp/prueba/t11.py` (jugador nuevo), `t12.py` (Más, guía, foto del día, copia, ampliar) y `t13.py <es|en>` (ánimo, racha y llamadas push).

## Mascotas nuevas, refugio, menú y noches (23-nov 22:15)
- Modelos: `js/modeloMascota.js` (`crearModeloMascota(especie, ESPECIES)`, mascotas.js lo reexporta). Ojos con brillo, hocico, nariz, boca, mejillas, bigotes, orejas con interior, patitas, colas de 2 tramos, rayas (gato), parche (perro), mofletes (hámster), dientes (conejo), manchas (cobaya), alas de membrana y pinchos (dragón), caparazón con placas (tortuga), aves con alas en pivote. Parámetros nuevos en `ESPECIES`: redondo, largo, mofletes, bigotes, dientes, pies, rayas, calcetines, hocico ('largo'|'zorro'), parche, manchas, patasCortas, cabezaGrande. Geometrías compartidas (`userData.compartida`).
  - Partes: raiz, cuerpoGrupo, cabeza, patas[], ojos[] (grupos), alas[] (pivotes), orejas[], cola + colaPunta, boca, lengua.
  - Visor: `blender/vista-mascotas.html?ids=gato,perro&lado=1.1&zoom=1` (`/tmp/prueba/vm.py salida.png "query"`).
- Comportamiento (`decidir` en mascotas.js, por pesos y personalidad): paseos de 2–4 paradas (`paseo`/`siguePaseo`), curiosear muebles, saludar a otra mascota, sentado, tumbado, estirarse, bostezo, acicalarse, perseguir la cola, aletear (aves y dragón, con 🔥), saltito (conejo/hámster), mirar alrededor, rascador, caseta, comedero, pelota. `accion(m, estado, dur, extra)` arranca un estado con duración.
  - `animar`: aceleración al andar, cabeza que mira y cabecea, orejas que se mueven, cola según felicidad, lengua del perro al correr/jugar, bostezo con boca, dormir hecho un ovillo, pingüino que se desliza al correr, tortuga que mete la cabeza al dormir.
- Refugio nuevo (`ui.abrirRefugio`): tarjetas de vuestras mascotas con barras ❤️🍖⚡ (al tocar se abre su menú), filtros (Todas / Con pelo / Con plumas / Especiales), tarjetas grandes con fondo del color de la especie y ficha (`ui.fichaEspecie`) con rasgos y botón de adoptar. Clases CSS `adopta-*`.
- Escaparate del menú: mascotas de verdad con `GestorMascotas` (`mas.crear`), que se mueven solas; salas con más muebles y cada sala con luz de noche (lámparas, farolas en el jardín). Cada sala dura 7,5 s. `LUZ.noche` más clara.
- Objeto nuevo `farola` (exterior, encendible, 140 monedas).
- Noches más claras en el juego: tabla `LUZ` de ambiente.js subida y `ambiente.luzNocturna()` añade una luz cálida de techo de 20:00 a 7:00 (no con apagón).
- Arreglo: un estilo `.moneda` del minijuego del cajero se aplicaba al contador de monedas de arriba (lo ponía como círculo dorado). Ahora solo afecta a `.tb-caja` / `.tb-bandeja`.
- Tests: `t14.py <hora> <n>` (mascotas en casa, cuenta estados), `t15.py` (refugio), `t16.py <hora>` (salas del menú).
- Pantalla de carga (23-nov 23:15): `#carga` en index.html (cielo según la hora, título, casita que bota, "Cargando…"/"Loading…") tapa el juego mientras se cargan los módulos y los modelos; main.js la quita con un fundido justo después de `inicio.mostrar()`. Si hay un error al cargar, dice "Algo ha fallado. Recarga la página".
- Menú sin cortes (23-nov 23:20): en `#inicio` lo que se encoge es la casa del medio (`.escaparate` con `flex: 0 1 min(52vh,480px)`, mínimo 70 px); título y panel nunca se cortan (márgenes automáticos y scroll si la pantalla es muy baja, por ejemplo con el teclado abierto). El texto "Crea tu cuenta"/"¡Hola…!" va en blanco con sombra para que se lea sobre el cielo.
- Diálogos largos: `#dialogo` se puede desplazar y la caja se centra cuando cabe (no se corta en pantallas bajas). Test: `/tmp/prueba/t18.py` (menú a 844/667/480 px) y `t19.py` (diálogo).
- Mascotas (24-nov 00:10): las mascotas se quedan como están (modelos de `modeloMascota.js`). Oliver hará los modelos nuevos con **Meshy** (24-nov: aparcado, lo deja para lo último de todo) y luego hay que integrarlos: cargarlos, ajustar tamaño y pivotes, y adaptar las animaciones (cabeza, patas, cola, orejas y alas se mueven por partes en `animar`). Un intento con Blender (cuerpos fusionados con remesh) quedó guardado en `git stash` ("mascotas blender") y sin publicar; en el PC quedaron `blender/m_mascotas.py` y `assets/mascotas.glb`, que el juego no usa.
- Guía de inicio nueva y pantalla más limpia (24-nov 00:30):
  - `js/guia.js` (clave `hogar-guia2`; si alguien terminó la guía vieja, `hogar-guia` ≥ 5, no la vuelve a ver). 9 pasos que te llevan de la mano: abrir la tienda → pestaña Reparar → comprar → cerrar la tienda → tocar el paquete (aro sobre el paquete en 3D con `posPaquete`) → arrastrar desde el inventario → la barra de Reforma → Misiones → Más. Se salta pasos solo si haces la acción por tu cuenta (`SALTOS`).
  - Bocadillo pequeño (máx. 280 px) junto al botón o a lo que hay que tocar, con flechita y aro rosa que late. No se esconde dentro de la tienda ni del inventario, solo con diálogos. Traducción con `traducir()` (respeta las negritas).
  - La visita de la madre no empieza hasta acabar la guía.
  - HUD: fuera el contador de tickets (está en la ruleta) y la píldora de la hora/clima. La barra de Reforma solo sale en el piso cutre mientras quedan arreglos; el 🕯️ acogedor sale después. 🧹 limpieza solo si hay algo sucio. "Mamá en X d" solo los 2 últimos días. Los avisos (cartas, ropa, trabajo, cuenta atrás, estado de ánimo, reto, crías…) ya NO están en el HUD: van en el teléfono fijo de la pared (ver abajo). Visita, avería y sorpresas siguen como píldoras sueltas porque son urgentes.
  - Test: `/tmp/prueba/t20.py` (guía en español) y `t20en.py` (en inglés).

## Teléfono de pared (avisos) — v44
- `js/telefono.js`: clase `Telefono(escena, sala)` con un teléfono retro rojo de disco (placa de madera, auricular colgado, cable rizado). Se cuelga en la primera pared visible según la cámara (orden pared 0 x=-2.45, pared 2 x=-0.8, pared 3 x=-1.7, pared 1 x=1.6; evita grietas y ventana). En exteriores va en un poste de madera con tejadillo en la esquina. Oculto al visitar otra casa.
- `crearExclamacion(tam)` (sprite "!" naranja, depthTest off) se reutiliza en los paquetes de la puerta (`entregas.crearPaquete`). Se quitó la píldora "📦 ¡Paquete en la puerta!"; la cuenta atrás 🚚 sigue.
- main.js: `pintarChipsVida()` deja en el HUD solo los URGENTES; el resto va a `mensajesTelefono`. Cada mensaje tiene firma (`firmaMensaje`: id + texto con números como #; correo y ánimo con texto exacto). Las firmas vistas se guardan en localStorage `hogar-tel-vistos`; si hay alguna sin ver, el teléfono suena (vibra) y sale el "!".
- Tocar el teléfono (vía `distCuadro`/`tocarCuadro` de controles) descuelga el auricular y abre el diálogo "☎️ Teléfono" con filas (título claro + detalle, `TITULOS_TELEFONO`); las nuevas llevan "!". Tocar una fila ejecuta su acción.

## Guía: paso "cerrar inventario" — v45
- Nuevo paso 8/10 en `js/guia.js` (`cerrarInv`, apunta a `#cerrar-inv`) entre "Reforma" y "Misiones"; se salta solo si el inventario ya está cerrado. Clave nueva `hogar-guia3` (migra `hogar-guia2`: valores >=7 se suman 1). `guia` expuesta en `?debug` (`__h.guia`).

## v46
- Barra de abajo: la insignia verde ("¡Gratis!") va centrada encima de su botón y los contadores rosas pegados a la esquina (right:-3px), así no se pisan entre botones vecinos.
- Guía: nuevo paso `cerrarMis` (cerrar la hoja de Misiones con su ✕) antes del paso de Más. Ahora son 11 pasos. Clave `hogar-guia4` (migra guia3 +1 desde 9, guia2 +1 desde 7 y +2 desde 8).

## Tocar vs mantener (v47)
- `js/controles.js`: tocar un mueble = interactuar (`eventos.alInteractuar`); mantener 380 ms (vibra) = seleccionar → arrastrar/minimenú. Si arrastras sin esperar, gira la cámara. Si el mueble ya está seleccionado se puede arrastrar directo, y un toque sobre él también interactúa. Mascotas igual: toque = reacción (`alInteractuarMascota`), mantener = ficha.
- `js/interacciones.js`: `Interacciones` con una reacción (o varias que se van alternando) para cada uno de los 65 objetos del catálogo: animaciones (salto, meneo, temblor, giro, latido, aplastar, balanceo, flotar), sonidos sintetizados, partículas y bocadillos de texto (`ui.bocadillo`). Las lámparas parpadean y cambian, la tele se enciende, la radio pone música, la pelota rueda y viene una mascota a jugar, el comedero llama a una mascota, el piano improvisa una melodía, etc. Un objeto tirado se levanta con un toque. Con algo encima solo hay efectos (sin mover). Mascotas: reacción según especie; dormidas sueltan 💤 y al tercer toque bostezan.
- Pistas la primera vez (3 veces) "Mantén pulsado…" en localStorage `hogar-pista-mantener`.

## Tienda con mostrador (v49)
- `js/mostrador.js`: `mostradorActual({nivelCasa, imprescindibles})` elige 7 objetos (3 muebles, 2 deco, 1 de mascotas/limpieza, 1 exterior si la casa lo permite) + 1 mascota no exclusiva, con semilla = periodo de 2 días locales (`periodoMostrador`), así los dos móviles ven lo mismo. Uno de los 7 va al -30%. `imprescindibles`: si la historia pide cama (paso 5) o robot (paso 8) y no lo tenéis, se mete en el mostrador.
- Pestañas de la tienda: 🏪 Mostrador · 🧰 Reparar · 🧴 Básicos (materiales de limpieza y mascotas: pienso, chuches, accesorios…) · 🎁 Temporada y 🧺 Mercadillo cuando tocan. Alias: abrirTienda('muebles'|'deco'|'exterior') → mostrador, ('limpieza'|'mascotas') → basicos. Las ofertas de cartas salen al final del mostrador (✉️ -25%).
- `js/tienda3d.js`: mostrador 3D con 8 huecos (4 arriba en una tarima y 4 delante, cada uno en su platito); Pilar detrás. El seleccionado sube, gira y tiene un aro dorado y foco. Se puede tocar el objeto en 3D para elegirlo (`alTocarHueco`). En las otras pestañas se ve el plato giratorio de antes. La mascota del mostrador está en un cojín y se mueve.
- Adoptar: la mascota del mostrador se adopta desde la tienda (`alAdoptarMostrador`); queda "¡Adoptado!" hasta el siguiente cambio (`estado.mostradorAdoptado = periodo`). Quitado el botón 🐾 Adoptar de la barra; el refugio ahora es "Vuestras mascotas" (tile en Más), solo con la lista de las vuestras (Mateo, el veterinario).
- `comprobarEvento` ya no salta con una hoja abierta.

## Objetos de pared: teléfono y ventanas (v50)
- `js/paredObjs.js` (`ObjetosPared`): `estado.paredObjs = [{id, tipo:'ventana'|'telefono', hab, pared, x, y, tam?, principal?}]`. Cada habitación tiene por defecto su ventana principal (`v0-<hab>`, pared 0 x=1) y su teléfono (`t-<hab>`, pared 0 x=-2.45). El teléfono ya NO cambia de pared al girar la cámara (`Telefono.fijar`); fuera sigue en el poste.
- Tocar = interactuar (teléfono abre mensajes; ventana: pajaritos/estrellas + bocadillo). Mantener pulsado (380 ms, `eventos.mantenerPared` en controles) = opciones: mover (barra `#colocar-pared`, tocar una pared), tamaño de ventana (Pequeña 0.65, Normal 1, Grande 1.3, Ventanal 1.6), "➕ Poner otra ventana · 🪙 200" y quitar (solo las extra). También hay botón "Añadir otra ventana" en Reformas → Ventana.
- La ventana principal es `sala.ventana` (lleva el cielo de ambiente, la cortina y el desperfecto del cristal); mientras el cristal está roto no se puede tocar/mover. Las extra se construyen aparte con el cielo compartido (`ambiente.textura`) y el color de marco actual. `casa2.aplicar` ya no escala la ventana: guarda `ventanaGrande` (si no hay tam, la principal sale 'l') y llama a `alAplicar` → `paredObjs.pintar()`.
- Choques: puerta, otros objetos de pared y cuadros (`rectangulos`/`choca`); `Cuadros.choca` usa también `paredObjs`. Si la pareja mueve algo, `actualizar` detecta el cambio de firma y repinta.

## Barra de abajo y botón Trabajar (v51)
- Bucle del juego: Trabajar (ganar) → Tienda (gastar) → Inventario/colocar (decorar) → Misiones (rumbo + más monedas). La barra: 🛒 Tienda · 🎒 Inventario · 💼 TRABAJAR (grande, verde, sobresale) · 📋 Misiones · ✨ Más. Iconos en "baldosas" de color suave; contadores pegados al icono.
- `#btn-trabajar` → `abrirTrabajar()` (main.js): tarjeta del trabajo de hoy con 3 turnos (✓), botón "¡A trabajar!" con la paga, "Ver todos los trabajos", y "Más formas de ganar": 🎡 Ruleta diaria (se quitó el botón de la barra) y 🎮 Minijuegos. `abrirGanar` = `abrirTrabajar`; quitada la tile "Ganar monedas" de Más.
- Insignia naranja del botón: turnos con paga entera que quedan, o 🎡 si solo queda la tirada gratis; late si hay algo pendiente (`refrescarTrabajar`, llamado en `ordenarHud`; `ui.tiradaGratis` guarda `ui.ruletaGratis`).
- Guía: el último paso apunta a Trabajar.

## Encargos en vez de minijuegos libres (v53)
- Ya no se pueden jugar minijuegos cuando quieras. `js/encargos.js`: la familia, vecinos y amigos llaman por teléfono pidiendo favores puntuales. Clientes (`CLIENTES`): Mamá, Don Ramón (personaje nuevo 'ramon'), Sol, Vuestros amigos, Pilar. Cada uno tiene confianza 0-100 (`estado.encargos.conf`), que se ve como corazones.
- `TIPOS`: cada encargo tiene cliente, confianza mínima (`min`) para desbloquearse, texto, pago base y qué se juega: receta (cocina de verdad: necesita una cocina en casa + ingredientes de la despensa, con botón "Comprar lo que falta"; usa `casa2.juegoCoccion`), un trabajo (`TRABAJOS` de trabajos.js: jardinero, fontanero, almacén, florista, DJ…) o un juego de juegos.js (puzzle, memory, duelo, equipo).
- Llamadas: cada 2-5 h reales (solo el móvil generador, sin guía ni menú), máx. 2 a la vez, el cliente se elige por confianza (<12 no llama). Duran 24 h (recetas 36 h); si caducan, -8 confianza. "Decirle que no" -3. Resultado: pago = base·(0.35+0.65·nota); confianza += (nota-0.55)·30; si sube, la siguiente llamada llega antes. Con más confianza piden cosas nuevas y mejor pagadas.
- Aparecen como mensajes en el teléfono (chips `enc-…`) y en Trabajar → "📞 Encargos" (agenda con todos los clientes). Si hay una receta pendiente y no tenéis cocina, la cocina entra en el mostrador (`alImprescindibles`).
- Ingredientes de huerto ahora también se compran (tomate 4, lechuga 4, zanahoria 3, patata 3, fresa 6, pimiento 4). Pase del mes: "Ayudad con encargos" (5) en vez de "Jugad minijuegos". Quitada la lista de trabajos por descubrir y el consejo de abajo de Trabajar. `?encargo` fuerza una llamada a los ~20 s.

## Minijuegos propios de los encargos (v55)
- `js/favores.js` → `JUEGOS_FAVOR`: 13 minijuegos nuevos que solo salen en encargos (ninguno repite los trabajos del día): tartaletas (mantener y soltar en la raya), cesped (arrastrar para cortar sin pisar flores), gotas (mover el cubo), buscar (objeto escondido en el trastero), escalera (izquierda/derecha alternando con equilibrio), regar (mantener 6 plantas en la zona verde), cuadros (clavar cuando está recto), parrilla (dar la vuelta y servir sin quemar), globos (inflar hasta la marca sin explotar), hoguera (frotar de lado a lado), cola (dar a cada cliente lo que pide), bici (saltar obstáculos), bandeja (equilibrar). Estilos `.fv-*`.
- `encargos.js`: los tipos usan `favor:` en vez de `trabajo:`; los de juegos.js (puzzle de mamá, duelo de limpieza de Sol, cena en equipo, parejas de Pilar) y la receta se mantienen porque ya no se pueden jugar sueltos.

## Todo llega al teléfono; fuera el buzón (v57)
- Quitada la tile "Buzón" de Más y el aviso del trabajo del día del teléfono (el botón Trabajar ya lleva el contador).
- Cada carta sin leer es un mensaje propio en el teléfono ("Carta de X" + título) que abre la carta directamente (`vida.abrirCarta`). Las ya leídas: botón "📬 Cartas anteriores" en el teléfono (`vida.abrirCorreo`, vuelve al teléfono).
- Lo de la pareja ya no salta solo: notas, regalos y propuestas de compra llegan como mensajes del teléfono (`pareja.chips()`, `verNota`, `abrirRegalo`, `verVoto`). La respuesta a tus propuestas sigue saliendo sola.
- Los chips pueden traer `titulo` (se usa como título de la fila del teléfono).

## Lofi sin petardeo (v57)
- El "vinilo" tenía clics aleatorios metidos en el ruido (~40/s) y la caja y el charles usaban ese mismo ruido con clics → petardeo. Ahora: ruido limpio para la batería, siseo suave sin clics y con fundido en el bucle, y ataques de 4-5 ms en bombo/caja/charles. Medido renderizando 10 s: 300-400 saltos bruscos antes, 0 ahora, mismo volumen.
- Furgoneta (v58): la franja rosa acababa justo en la cara trasera de la caja → parpadeo (z-fighting). Ahora sobresale 1-2 cm (`PIEZAS_FURGONETA[4]` = 1.53 × 0.97, x -0.255).
- Minijuego de hormigas (v59): las hormigas salían casi transparentes porque el canvas dibuja los emojis con la transparencia del último `fillStyle` (el del suelo era rgba .08). Ahora `suelo()`/`pared()` dejan `fillStyle = '#000'`, y las hormigas llevan un halo claro y son algo más grandes (40px).

## Economía más dura: todo ×3 de caro, ganancias ÷2 (v60)
- `js/balance.js`: `MULT_PRECIO = 3`, `MULT_GANANCIA = 0.5`, `caro(n)`, `paga(n)`, `encarecer(lista)`. Para reajustar, cambiar ahí (y los literales listados abajo).
- Precios ×3 aplicados sobre los datos al cargar: CATALOGO, MATERIALES, PRECIO_RAREZA (catalogo.js), suelos/papeles/cortinas/marcos/LEDs/bombillas e ingredientes (casa2.js), ESPECIES (mascotas.js), CASAS (progreso.js), AMPLIACIONES (main.js). Literales: tirada de ruleta 240, Robi exprés 120, tapizar 120, ventana extra 600. Vender un objeto da 1/12 de su precio nuevo (la mitad de lo de antes).
- Ganancias ÷2: `ganar()` aplica `paga()` salvo que se le pase `exacto=true` (encargos ya calculan `e.pago` con `paga`). Con `paga()` en el origen: premios de misiones/historia/eventos (`darPremio` + `textoPremio`), pase, colecciones, cartas, concursos de mascotas, fiestas, visitas. Literales a la mitad (con sus textos): regalo de reforma 100, logros 15/40, racha de pareja 5/día máx. 50, retos 10/estrella, cumpleaños 75, bienvenida 30/día máx. 150, bonus diario 25+5/día, averías 13, cumple de mascota 25, misiones de pareja 20/30, preguntas 10, quiz 8/acierto, reencuentro 25, metas 30, tesoro 50, ruleta 20/60/10. Los textos que muestran pagos (Trabajar, trabajo del día, ordenador) usan `paga()`.

## Minijuegos más difíciles + 6 clásicos nuevos (v62)
- Dificultad global: `TIEMPO = 0.8` y `VELOCIDAD = 1.2` exportados de `js/favores2.js`; los `cronometro`/`bucle` de trabajos.js, favores.js y favores2.js los aplican (20% menos tiempo, todo un 20% más rápido). juegos.js: tubería 10 s, cocina en equipo 48 s, cocina 36 s, puzzle 70 s, parejas con 8 parejas (rejilla 4×4) y nota más estricta.
- `js/favores2.js` → `JUEGOS_FAVOR2` (canvas + cruceta/deslizar): conducir (vista desde arriba, 3 carriles, esquivar coches/conos/baches, charcos frenan; nota por tiempo en llegar, mamá al médico), cruzar (tipo Frogger, Don Ramón al mercado, 3 viajes), pasear (tipo Snake con Toby y la correa, empieza al deslizar), almacen (Sokoban, 4 niveles verificados con BFS, deshacer/reiniciar), cometa (tipo Flappy, 3 vidas, empieza al tocar), diferencias (2 láminas de 5 diferencias). Encargos nuevos en `TIPOS`: medico, pasatiempos (mamá), mercado (Ramón), toby (Sol), cometa (amigos), almacen-pilar (Pilar).
- Trabajo de fontanería rehecho tipo Pipe Mania: tablero 6×8 lleno de piezas giradas (rectas, codos, T y cruces), el agua sale sola tras una cuenta atrás (o con "¡Abrir el agua ya!") y avanza; si llega a un hueco es fuga. Nota = tableros resueltos/3 − fugas.
- Las llamadas de encargos no entran mientras hay un minijuego abierto.

## Objetos de corazón con forma real (v63)
- Nueva forma de pieza `'corazon'` en `construirPiezas` (js/modelos.js): `THREE.Shape` de corazón extruida con bisel (aspecto mullido), normalizada a 1×1×1 y escalada a w×h×d; geometría compartida (`userData.compartida`). Si un objeto tiene alguna pieza `'corazon'` se ignora su versión del GLB (la del GLB eran 3 bultos).
- cojin-corazon, lampara-corazon (base + corazón, `encendible.piezas: [1]`) y puff-corazon (tumbado con `rx: -PI/2`) usan ahora una sola pieza de corazón.

## Objetos de pared se mueven como los muebles + minijuegos de limpiar (v64)
- Teléfono, ventanas y cuadros: mantener pulsado (380 ms) los selecciona (brillo amarillo, rojo si choca) y se arrastran directamente por las paredes visibles, también a otra pared. Si ya está seleccionado, se arrastra sin esperar. Al soltar se guarda. Tocar fuera deselecciona; tocar uno seleccionado interactúa (abre el teléfono, reacción de la ventana, ver el cuadro). Con 2 dedos se cancela y vuelve a su sitio.
- Menú flotante como el de los muebles (`paredObjs.opcionesMenu`): ventana → 📏 tamaño (cicla Pequeña/Normal/Grande/Ventanal si cabe), ➕ Otra 🪙600, 📤 Quitar (solo las extra); teléfono → ☎️ Mensajes; cuadro (`cuadros.opcionesMenu`) → 📏 tamaño, 🖼️ marco, 🖌️ Retocar (pinturas), 📤 Descolgar.
- `comprarVentana` ya no pide tocar una pared: busca un hueco libre (`huecoLibre`) en las paredes visibles, la pone y la deja seleccionada. El modo viejo de colocar (barra `#colocar-pared`/`#colocar-cuadro` con `capturaToque`) solo se usa al colgar un cuadro nuevo desde el álbum.
- controles.js: modo `'pared'` con eventos `paredSeleccionada`, `agarrarPared`, `moverPared`, `soltarPared`, `cancelarPared` (sustituye a `mantenerPared`). main.js: `refrescarMenu`/`colocarMenu` contemplan `paredObjs.sel`; seleccionar mueble o mascota deselecciona lo de la pared.
- minijuegos.js: el suelo pinta primero un fondo oscuro, así las juntas entre tablas ya no dejan restos de fotogramas anteriores. Polvo: muestra 96×96 y termina solo cuando no queda nada (con ✨ de pista en los restos al pasar del 90%). Barro y hormigas: no se completa mientras quede alguna mancha u hormiga viva; las hormigas dejan de salir al llegar a la meta.

## Niveles de experiencia y Obras en vez de mudanzas (v65)
- Decisión de Oliver (24-nov): se quitan las mudanzas. El piso crece con **Obras** (habitaciones y exteriores) que se desbloquean por **nivel de experiencia** y se pagan. Fases siguientes: ampliar el salón por filas (6×6 → 6×9) y **pisos de inversión** (uno a la vez; comprar, reformar y vender o alquilar con inquilinos; los muebles se quedan en el piso).
- `js/experiencia.js`: `estado.xp` (compartido). `xpPara(n) = 150 + 75·(n−1)`, nivel máx. 30. `XP_EVENTO` da XP por cada `registrar(evento)` (trabajar 40, encargo 35, reformar 25, obra 150…); los eventos pequeños tienen tope de 15 al día (`estado.xpHoy`). Gastar monedas da 1 XP por cada 15 (lo detecta `refrescarHud` con `monedasVistas`; `aplicarRemoto` lo resetea para no contar lo de la pareja). Misión reclamada +20, logro +50.
- Subir de nivel: 30·nivel monedas + 1 ticket por nivel y diálogo con lo desbloqueado (espera si hay diálogo, hoja, minijuego, guía o visita; `retener(ms)`). Pastilla `#pill-nivel` (⭐ + barra) cuando no está la de Reforma; abre el panel de nivel con todos los desbloqueos. Migración: `migrar()` calcula XP desde `estado.stats`, logros y el nivel de casa anterior.
- `OBRAS` en progreso.js (nivel, precio): Dormitorio 5/5000, Terraza 8/7000, Cocina 10/8000, Baño 13/10000, Estudio 16/12000, Jardín 20/18000, Sala de juegos 22, Cine 24, Gimnasio 25, Biblioteca 26, Invernadero 27, Salón de baile 28, Observatorio 30. `habsCasa()` = habitaciones de `CASAS[nivel]` (se queda fijo, sin mudanzas) + `ampliaciones` viejas + `estado.obras`. `abrirObras` (Más → Obras) y `hacerObra`: cobra, añade la habitación, te lleva a ella y la llena de suciedad (polvo, telarañas, barro, hormigas); las paredes salen sin pintar. La primera obra pide la reforma terminada.
- Objetos con `nivel` en el catálogo: 2→nivel 8, 3→14, 4→20 (`NIVEL_OBJETO`) y los de exterior además piden tener terraza o jardín (`puedeItem`, que usa el mostrador). Reto de decoración: nivel 6. Cocina (Más): mueble de cocina u obra de cocina. Logros "¡Más espacio!" (primera obra) y "Vida de lujo" (nivel 20).

## Ampliar el salón y pisos de inversión (v66)
- **Ampliar el salón** (obras `ampliar1/2/3`, niveles 4/11/18, 2500/4000/6000): `estado.salonFilas` (0–3) ensancha la habitación 0 en X de 6 a 9 m (`anchoHab(i)`; las demás habitaciones y exteriores siguen 6×6). `aplicarTam()` en main ajusta todo al entrar en cada habitación, al cargar, al visitar (`anchoVisita`) y al sincronizar:
  - sala.js: `redimensionar(ancho)` reconstruye los tramos de las paredes 0 y 1 (`construirTramos`), mueve las paredes 2 y 3, muestra 12–18 tablas y escala la base; `largoPared(i)` y `ancho()`.
  - muebles.js: límites por eje `lx`/`lz` (en casillas) y rejilla rectangular propia (`ajustarTam`). mascotas.js: rejilla `NX×NZ` (`usarRejilla`, `posCelda`, `claveCelda`); suciedad y la fiesta de social.js lo usan. camara.js: `ajustar(ancho, fondo)` agranda la vista y el paneo. paredObjs/cuadros limitan con `largoPared`. Tiras LED y el jardincito de fuera se recolocan.
- **Inmobiliaria** (`js/inmobiliaria.js`, nivel 9 con el piso reformado; Más → 🔑 Inmobiliaria). Solo un piso a la vez en `estado.inversion = {calle, tipo, precio, compra, acogedor, hab:{muebles, suciedad, paredes, sucio?}, inquilino:{id, desde, tarifa}, satisfaccion, averia, proximaAveria, cobrado}`.
  - Ofertas: 3 cada 3 días con semilla (iguales en los dos móviles): "Para tirarlo" 3000–4500 (colchón y cajas de trastos + mucha suciedad), "Hecho polvo" 4500–6000, "Solo necesita pintura" 6000–8000.
  - El piso es la habitación especial `INV = 50` (`estado.habActual`), con sus datos en `estado.inversion.hab` (`habDe`, `enPiso`, `nombreHab`). Se entra desde la pastilla de habitaciones o la ficha. Paredes sin pintar. La clave de habitación `nivel-50` vale para ventanas, cuadros y decoración, y se borra al vender (`limpiarRastro`).
  - Vender: precio × (0,8 + 0,8 × acogedor/100); los muebles se quedan en el piso. Alquilar: 3 candidatos (`INQUILINOS`: estudiante, pareja, señora con gato, teletrabajo, familia) con muebles que quieren; tarifa/h = precio × 0,0016 × (0,5 + acogedor/100) × mult × (×1,4 si tiene todo, −15% por cada cosa que falte). La hucha llena 24 h y se cobra en la ficha (al cobrar, la tarifa se acerca a la actual).
  - Averías (gotera o luz, con los minijuegos de juegos.js) cada 36–60 h. Si pasan 24 h sin arreglar, −40 de satisfacción; a 0 el inquilino se va. Llegan como mensajes del teléfono (`chips()`): llamada de Mateo al desbloquear, avería, hucha llena e inquilino que se ha ido.
  - XP: comprar piso 60, alquilar 20, cobrar 5, vender: beneficio/10 (mínimo 60).

## Salón ampliable también hacia el fondo (v67)
- 6 obras de ampliación en orden (`filas` = paso, `estado.salonFilas` 0–6): 6×7 (nivel 4, 2500), 7×7 (7, 3500), 7×8 (11, 4500), 8×8 (14, 6000), 8×9 (18, 7500), 9×9 (22, 9000). `TAM_SALON` en main da [ancho X, fondo Z] por paso; `tamHab(i)` sustituye a `anchoHab`.
- `sala.redimensionar(ancho, fondo)`: mueve las 4 paredes, reconstruye los tramos de todas y escala las tablas y la base en Z; `sala.fondo()`. Los paquetes y la furgoneta de entregas van en un grupo raíz que se desplaza con la puerta (`entregas.desplazarZ`).

## Mascotas y personajes de Kenney (v68)
- Oliver eligió los packs CC0 de Kenney: **Cube Pets** (mascotas) y **Mini Characters 1** (personajes). Copias en `assets/kenney/mascotas/` y `assets/kenney/personajes/`, cada una con su `Textures/colormap.png`, y las licencias en `assets/kenney/`. Los zips originales están en Descargas del PC.
- Especies ahora (`ESPECIES`, campo `kenney`):
  - conejo (bunny), pato → "Pollito" (chick), cerdito (pig, nueva), gato, koala (nueva), perro, loro;
  - pingüino (épico) y zorro y panda (legendarios; panda nueva, sustituye al dragón; `vale-dragon` ahora da un panda).
  - Fuera: hámster, cobaya, tortuga y dragón. Las mascotas guardadas se convierten con `ESPECIE_ANTIGUA` (hámster→conejo, cobaya→cerdito, tortuga→koala, dragón→panda).
- `modeloMascota.js`: `cargarMascotasKenney` (se espera al arrancar, en main) y `modeloKenney`: clona la escena del GLB a escala 0.27 dentro de `cuerpoGrupo` (la raíz sigue a tam × 1,5 × crecimiento) con `AnimationMixer`. Las piezas sueltas (patas, cola…) quedan vacías y el modelo procedural sigue como respaldo. En `GestorMascotas.animar` el estado elige la animación (`ponerClip`): idle, walk, run, eat, dance, gesture-positive y static (para dormir). La tienda 3D y el gato callejero actualizan su mixer.
- `personajes.js`: lola→female-b (Pilar), mateo→male-d, sol→female-c, mama→female-d, ramon→male-b, amigos→male-f. Se clonan con SkeletonUtils a escala 1.45, con animación idle (`actualizarPersonajes(dt)` en el bucle de main, `animarPersonaje(g, clip)`) y `userData.cabeza` = el hueso `head`. Robi (la limpiadora) es el robot de Kenney (`character-robot`): hace la animación interact-right mientras limpia y emote-yes al irse. Pilar en la tienda: escala 1.35, y 1.18.

## Cosas del mundo con "!" y se tocan directamente (v70)
- Visitas, el gatito callejero y las averías de casa ya no tienen pastilla en el HUD. Llevan un "!" encima (`crearExclamacion`, que se balancea) y se atienden tocándolos: el visitante, el gato, el charco de la gotera o el cuadro eléctrico nuevo de la pared del fondo (`vida.cuadroLuz`, x=2.35 y=1.95, solo mientras no hay luz).
- controles.js: modo `'mundo'` que se mira antes que los paquetes (`eventos.mundo(rayo)` → `vida.tocable(r)` o `sorpresas.tocable(r)`, que devuelven la acción). Los avisos dicen "Tocadle para saludar" o "Tocad el charco / el cuadro eléctrico".
- Zonas táctiles: tocar una pared ya no abre las grietas o la humedad si no se toca encima de ellas (se quitó el atajo al `requisito` en `sala.tocar`). La zona de las grietas pasa de 1,1×1,3 a 0,8×1,0.

## Inventario con nombres (v71)
- Cada casilla del inventario lleva el nombre debajo (`.nombre-ranura`, hasta 2 líneas). Filas de 86 px y bandeja de 160 px de alto.

## Barra de durabilidad y cartel movible (v73)
- Inventario: los objetos con `usos > 1` llevan una barra de durabilidad (`.durabilidad`) en vez del "x/y". Es verde por encima del 60%, amarilla por encima del 30% y roja por debajo, y baja animada (`ui.durPrev` guarda el valor anterior). En esas casillas el nombre se queda en una línea.
- El cartel "Nuestro Hogar" (`mas.cartel`) es ahora un objeto de pared más (`tipo: 'cartel'`, por defecto `c-<hab>` en la pared 0, x=-0,35, y=2,1, medidas 0,95×0,8). Se mantiene pulsado para moverlo, al tocarlo se balancea, y su menú tiene ✏️ Cambiar texto, que abre Ajustes.

## Confianza de los encargos más lenta (v74)
- `terminar`: confianza += round((nota − 0,6) × 12) (antes (nota − 0,55) × 30). Un encargo perfecto da +5 y uno malo hasta −7. Corazones = floor(confianza/20) (antes redondeaba), así que hacen falta unos 4–5 encargos bien hechos por corazón.

## Biblioteca de arrastrar y pulido de minijuegos (v75)
- Biblioteca (trabajos.js): ya no se pulsa. Los libros salen desordenados en un carrito y hay que arrastrarlos (pointer events + fantasma `.bb-arrastrado`) a la estantería de abajo en orden, de menor a mayor. Si sueltas el que no toca, rebota y cuenta como fallo. Las estanterías tienen 6 libros o más, y desde la 3.ª llevan códigos letra+número (se ordenan por letra y luego por número). Dura 55 s y la nota es (colocados − fallos·2)/26.
- DJ: tocar un carril sin nota cuenta como fallo (nota = (aciertos − fallos·0,5)/total). Además lleva chispas al acertar, notas con brillo, anillos en los carriles y 🔥 con la racha.
- CSS de pulido visual: cielo con nubes (globos), techo y tuberías (gotas), noche con hoguera, pastelería (tartaletas), calle con edificios (bici), mesa (bandeja), mostrador (cola), escalera, cocina (hamburguesería) y sombras en los canvas de DJ y fachada.

## Más juegos y eventos de vecinos (v76)
- `js/trabajos2.js`: 6 trabajos nuevos que se suman a `TRABAJOS` (ahora 20; el del día rota entre todos):
  - 🎣 Pescador: mantener pulsado para subir la red y que el pez quede dentro (estilo Stardew). Peces con distinta dificultad (carpa, payaso, globo, tiburón raro).
  - ✉️ Cartero: arrastrar cartas al buzón de su piso. Las ⚡ urgentes dan extra si van en menos de 4 s, la 📰 publicidad va a la papelera. Los buzones cambian cada 6 cartas.
  - 🛟 Socorrista: tocar a los que se hunden 🆘 antes de que se les acabe la burbuja. Los que saludan 👋 son trampa.
  - 🔐 Cerrajero: tocar cuando la ganzúa pasa por la franja verde; cada fallo tira un pin. Más pines y franjas más estrechas en cada cerradura.
  - 🍣 Sushi: arrastrar los platos de la cinta al cliente que los pidió, antes de que se le acabe la paciencia.
  - 🍦 Heladería: mover el cucurucho y coger las bolas en el orden del pedido. Una equivocada lo estropea.
- `JUEGOS_FAVOR3` (también en trabajos2.js): cartas (mayor o menor con Don Ramón), karaoke (tipo Simón), calcetines (emparejar color + dibujo) y toby (pillar al perro cuando asoma; el gato es trampa). También incluye los 6 trabajos para usarlos como favores.
- encargos.js: 10 encargos nuevos: partida y pesca (Ramón), colada y toby-escapa (Sol), karaoke y piscina (amigos), llaves y japonés (mamá), correo y helados (Pilar).
- `js/vecinos.js`: eventos de vecinos. Cada visita lleva un `ev` (elegido con `elegirEvento`) y al tocar al visitante se abre `atenderEvento`:
  - sal: piden un ingrediente; se da de la despensa o se compra.
  - cartas, toby y karaoke: se juega el minijuego y paga según la nota.
  - pelis: preparar algo con 2 ingredientes o pedir pizza.
  - tupper: mamá trae ingredientes.
  - muestras y esquejes: elegir un objeto gratis.
  - ruido: pedir perdón, invitar a café o hacerse el sordo.
  - cita: elegir la ropa que pega con su plan.
  - consejo: pregunta con una respuesta buena.
  - saludo: la visita de siempre.
  - Las respuestas suben o bajan la confianza del encargo de esa persona (`CLIENTE_DE`).
- vida.js: Don Ramón también visita. Las visitas pueden llegar cada 5 h (antes 18 h), de 10 a 22 h, duran 6 min y no repiten visitante seguido. `forzarVisita(quien, ev)` para pruebas (`__h.vida.forzarVisita('ramon','cartas')`) y `terminarVisita()`. main pasa `encargos` al ctx de Vida.

## Escaparate del inicio rehecho (v77)
- `escaparate.js` tiene 8 salas de tamaños distintos (`ancho`/`fondo` en metros): estudio 5×5, salón alargado 8×5, dormitorio 6×6, cocina 7×6, gamer 6×5, jardín 8×6, mansión 8×8 y Navidad 6×6.
- Cada sala tiene su lista de `ventanas` (`['f'|'i', posición, ancho]`, en el fondo o en la pared izquierda). Algunas tienen 2 o 3 ventanas.
- Los muebles están colocados con sentido: sofá mirando a la tele o a la chimenea, sillas alrededor de la mesa, mesitas a los lados de la cama, cosas encima de cómodas y estanterías. Se comprobó que no hay solapes ni piezas fuera de la sala.
- Robi (el robot de Kenney) limpia en el estudio y en la mansión: recorre `robi` (puntos en metros), anda con `walk` y limpia con `interact-right` echando burbujas. En el salón alargado y en la cocina, la aspiradora (`aspiradora: {base, ruta}`) sale de su base, recorre la ruta tragándose las bolas de polvo y vuelve; el polvo reaparece después.
- La cámara ajusta el zoom al tamaño de cada sala, con transición suave.
- Fluidez:
  - La sala siguiente se construye por trozos durante la actual (un generador `pasosConstruir` con unos 5 ms por fotograma) y se precompilan sus shaders con `compileAsync` antes de cambiar.
  - Las luces de las lámparas salen de los muebles y usan un grupo fijo de 8 PointLights. Así el número de luces no cambia y no se recompila todo al aparecer una lámpara.
  - Los muebles aparecen con escala, no con `visible`.
  - La sala vieja se libera poco a poco (`basura`, 2 ms por fotograma). No se liberan las geometrías ni los materiales compartidos de Kenney.
- main.js: mientras se ve el menú de inicio (`enMenu()`), el bucle del juego no renderiza (antes había dos escenas 3D a la vez). Solo sigue la sincronización.
- CSS: quitado `filter: drop-shadow` del canvas, que era carísimo en móvil. Ahora la sombra es un degradado debajo (`.esc-lienzo::before`).
- Medido en pruebas: la mediana de fotograma pasó de 167 a 83 ms y el pico de 350 a 150 ms (en el renderizado por software de las pruebas, que es mucho más lento que un móvil).

## Mascotas: subirse a muebles, volar, caca y pis (v78)
- `mascotas.js`:
  - Cada especie tiene `salto`, la altura máxima a la que sube: gato 0,85, zorro 0,62, koala 0,6, perro 0,55, pollito 0,5 (aletea), panda 0,5, conejo 0,45, cerdito 0,4, pingüino 0. El loro tiene `vuela` y llega a 1,9.
  - `SUBIBLE` da la altura de la superficie de cada mueble (sofá 0,5, cama 0,55, puff, mesita, cómoda, mesa, estantería 1,6, nevera 1,8…). En sofá, cama y sillón huevo no se usa la fila del respaldo. Tampoco las casillas tapadas por objetos encima ni las ocupadas por otra mascota (`superficie`).
  - `subirA` / `subirAlgo`: va al lado, se agacha (`agacharse`) y salta en arco (`saltarA`: estado `saltar` con `m.salto`, y `m.alturaBase` marca la altura). Arriba guarda `m.encima` y solo se sienta, se tumba, mira, se acicala o bosteza. Si está cansada duerme allí (si es sofá, cama o puff). Al rato baja con `bajar`.
  - `ir()` baja primero si la mascota está encima de algo y espera a que acabe un salto. `accion()` también espera al salto.
  - Si quitan o mueven el mueble, la mascota se suelta (`soltar`) y cae.
  - Al aterrizar en el suelo hace un pequeño aplastamiento.
  - El loro (`volarAlgo`) vuela a muebles altos (75%) o da una vuelta y aterriza en otro sitio. Vuela en curva batiendo las alas, y desde arriba a veces vuela a otro mueble.
  - Estados nuevos `caca` y `pis`. En caca se agacha temblando, con la cola arriba y los ojos apretados. En pis el perro y el zorro levantan la pata trasera junto a un mueble (`levantaPata`); los demás se agachan.
  - `m.alAcabar` es un callback que se ejecuta al terminar una acción. `necesidad(m, tipo, alFin, junto)`.
  - Kenney: `modeloMascota` guarda `partes.nodos` (alas, cola, patas, cuerpo con su quaternion de reposo). Tras el mixer se suman giros: las alas aletean, la cola se mueve y se levanta, y la pata se levanta para el pis.
  - Al cargar, si una mascota queda dentro de un mueble, se mueve a una casilla libre.
- `suciedad.js`:
  - Tipo nuevo `pis`: charco amarillo brillante. Se limpia con la fregona (`limpiaTipo`; el minijuego es el del barro), con el robot o con Robi.
  - `necesidad()` sustituye a la caca instantánea:
    - Si tienen arenero, gatos, conejos y koalas van y lo hacen allí, sin ensuciar.
    - Si hay jardín, perros, pollitos, pingüinos y zorros salen a hacerlo fuera.
    - Si no, se hace la animación y aparece la caca o el charco detrás. El perro lo hace junto a una planta o un mueble.
  - Temporizadores: `tCaca` cada 6–12 min y `tPis` cada 5–11 min (las aves no hacen pis). Si la mascota está ocupada se reintenta a los 15 s.
- El escaparate del inicio también usa todo esto: el gato se sube al sofá y el loro vuela.

## Parpadeo de la ventana (v79)
- Era z-fighting: el cielo de la ventana estaba a solo 4 mm de la pared, y la cámara tenía near 0,1 / far 100. Con el búfer de profundidad de 16 bits de muchos móviles no alcanza la precisión.
- camara.js: near 4 y far 44, ajustados a la escena porque la cámara está a 20 del objetivo. La precisión de profundidad es más del doble.
- Capas de la ventana separadas de la pared (`cara` ya está 6 mm por fuera): cielo +1 mm, cristal +12 mm, grietas +16 mm y cartón +24 mm. Se aplicó en sala.js (ventana principal), paredObjs.js (ventanas extra) y ambiente.js (el cielo).

## Jugar juntos, mascotas sociales, plantas que crecen, racha semanal y álbum (v80)
- `duo.js` (Más → 🎮 Jugar juntos): minijuegos a dúo en directo por el canal broadcast de Supabase (`sync.emitir('duo', …)`). La invitación también va por `sync.mandar` y por aviso push.
  - Protocolo: `invita` → `acepta` → `empieza` (con semilla) → `j` (datos de juego) → `fin`, o `sale`. Quien invita es el anfitrión: decide el resultado y cobra las monedas (van al estado compartido). XP `duo` 25.
  - ✏️ Adivina el dibujo: 4 rondas por turnos. Los trazos se envían cada 90 ms. El que adivina elige entre 6 opciones y cada fallo resta 4 s.
  - 🍳 Cocina a dúo: el chef (anfitrión) ve la comanda y «grita» ingredientes. El pinche tiene la despensa, que se baraja en cada plato. El anfitrión lleva el plato y lo reenvía.
  - 🛋️ Subir el sofá: cada uno mantiene pulsado para levantar su punta. Si hay desnivel o se pasa por una viga con el sofá alto, golpe. El anfitrión simula y envía el estado a unos 12 Hz.
- Mascotas (mascotas.js):
  - `perseguir` (una huye y la otra la sigue corriendo), `jugarJuntas` (saltitos y cola mirándose), `acurrucarse` (con poca energía duerme al lado de otra que duerme) y `celos` (si otra está comiendo en el comedero, se enfadan: estado `enfado` con el clip gesture-negative).
  - Suciedad: `m.sucia` sube un 33% al día (y al jugar con la pelota). Se ven manchas de barro en el cuerpo (`pintarManchas`), salen moscas si pasa de 0,7 y pierden felicidad más rápido.
  - Menú 🛁 Bañar (`bano.js`): frotar las manchas con la esponja y aclarar la espuma con la ducha. Después la mascota se sacude (`sacudirse`). XP `banar`.
- Plantas (usos.js):
  - `crece` va de 0,25 (brote) a 1 (adulta): +0,25 por cada día regado y el tamaño va del 50% al 100%. Las plantas antiguas pasan a adultas.
  - Burbuja 💧 encima cuando tienen sed (más de 20 h sin regar).
  - Se mueven con la brisa (más en el exterior). Las mustias se inclinan.
  - La lluvia riega las plantas del exterior. Añadida la maceta grande (olivo).
  - muebles.js respeta `escalaVis` y `balanceo`.
- Racha diaria (`album.js` PREMIOS_RACHA): calendario de 7 días (monedas, ticket, pienso, objeto raro el 7.º). Si se falta un día vuelve al día 1. Cada semana seguida da +10 monedas por día (hasta +30).
- Álbum de pegatinas (Objetivos → 📒): todos los objetos del catálogo y las especies. Se pegan al tenerlos en casa, en el inventario o al adoptar. 6 pestañas y premios por hitos (5, 12, 20… y todo). `album.revisar()` corre en `revisarProgreso`.
- main.js: mientras hay un minijuego abierto (`juegoTapando`), la escena 3D no se renderiza.

## Presentación antes de cada juego (v82)
- `intro.js`: `mostrarIntro()` abre una capa (`#intro-juego`) con el vídeo del juego arriba, el botón «▶ ¡A jugar!» en medio y «¿De qué va?» y «Cómo se juega» debajo. Tiene la casilla «No volver a mostrar» (localStorage `hogar-intro-saltar`). Si se cierra con ✕, el juego no empieza y la llamada devuelve null.
- `conIntro(op, abrir)` envuelve `juegos.custom(icono, nombre, montar, intro)`, `juegos.jugar(id)` (clave `jue:id`) y `minijuegos.jugar(tipo)` (clave `limp:tipo`; la limpieza solo la enseña la primera vez de cada tipo, guardado en `hogar-intro-limpieza`). Los métodos `customYa`, `jugarYa` y `minijuegos.jugarYa` arrancan sin presentación. `window.__sinIntro = true` la desactiva (para pruebas).
- Claves: `trab:id` (trabajos; en «qué» va `t.texto` y además el pago), `fav:id` (favores; el encargo pasa su texto), `jue:*`, `limp:*`, `bano`, `copos`, `tender`, `entrenar`, `carrera`, `paseo`, `cocinar`. Las de casa2, sorpresas y mascotas2 se deducen del nombre en `custom`, o con `juegos.siguienteIntro`.
- `intros.js` (generado): `{ que, como, video }`. El «cómo» sale del primer `j.info()` de cada juego. `video: 'trab-x'` reutiliza el vídeo de un trabajo y `video: false` enseña solo el icono animado.
- Vídeos en `assets/videos/<clave con - en vez de :>.mp4`: 56 clips H.264 de 320×400, unos 6 s, 1,3 MB en total. Se grabaron jugando con un bot (Playwright `record_video` y recorte con ffmpeg; scripts en /tmp/prueba t80.py y cortar.py). El service worker no los intercepta (por las peticiones Range). Sin vídeo (tender, entrenar, carrera, paseo, cocinar) se ve el icono flotando.
- Arreglado: en el cajero salía «Paga con: NaN €» cuando el total pasaba de 50 € (faltaba el billete de 100).

## Optimizaciones sin perder calidad (v83)
- Arranque: `cargarModelos()`, las mascotas Kenney y los personajes se cargan a la vez (`Promise.all`); antes se esperaba primero a `modelos.glb`.
- Service worker: los recursos pesados que no cambian (assets/ menos los vídeos, CDN de jsdelivr con three, fuentes e iconos) se sirven de la caché `hogar-recursos-1` al instante y se actualizan por detrás. Esta caché no se borra al subir de versión. JS, CSS y HTML siguen siendo red-primero. **Si se cambia un asset sin cambiar su URL (`?v=`), hay que subir `RECURSOS` a `hogar-recursos-2`.**
- Luces: `estabilizarLuces()` corre antes de cada render y mantiene fijo el número de PointLights visibles, rellenando con luces apagadas (`userData.relleno`) en escalones de 4 que solo suben. Así añadir, quitar o encender lámparas, o cambiar de habitación, ya no recompila todos los shaders (era el tirón al colocar una lámpara). Comprobado: los programas se quedan en 20 al añadir y quitar lámparas.
- Sync: tras guardar con éxito se emite `cambio` por el canal en directo y la pareja descarga al momento. Con el directo conectado, el sondeo baja de cada 3 s a cada 10 s (menos batería y datos, y los cambios llegan antes).
- usos.js: la limpieza de las burbujas de sed se hace cada 2 s, no en cada fotograma.
- (Ya estaba en v80: no se renderiza la escena 3D con un minijuego abierto. Y en v77: no se renderiza en el menú de inicio.)

## Bienvenida única y lo que hace tu pareja (v84)
- `bienvenida.js`: al entrar sale UNA sola pantalla (`mostrarBienvenida`) con, si toca: fecha especial (con botón a la tienda en temporada), foto del día (`mas.postalHoy()`, botón «Al álbum»), calendario de la racha con el premio de hoy, vuelta tras días fuera, racha de pareja, «Mientras no estabas» y «La casa os necesita» (`pendientesCasa()`: suciedad, hambre, baños, sed, paquetes y avisos de la inmobiliaria). Sustituye a los diálogos encadenados de antes (buenos días, os echábamos de menos, fechas, racha de pareja y postal). La primera vez sigue saliendo solo la bienvenida de Pilar.
- `revisarFechas(true)` y `revisarRachaPareja(true)` devuelven datos sin abrir diálogos. `mas.postalDelDia(true)` (respaldo cada 5 s) guarda la foto sin diálogo.
- Actividad de pareja: `registrar()` anota en `estado.actividad` (`{de, e, t, n}`, últimas 60, agrupa repeticiones en 30 min) los eventos de `ACTIVIDAD` (regar, bañar, comer, cocinar, limpiar, trabajar, favores, obras…). En la bienvenida se ve lo nuevo del otro desde tu última visita (`hogar-actividad-vista` en localStorage). Al llegar un cambio remoto con actividad reciente (menos de 3 min) salen avisos en directo: «💧 Lucía ha regado las plantas».
- El calendario de racha muestra las monedas ya ajustadas con `paga()`.

## Menú ordenado y castigos más suaves (v85)
- Más (`mas.abrir`) agrupado: 💑 Vosotros, 🏠 La casa, 🏘️ El barrio, ⭐ Progreso, ⚙️ Otros. Colecciones van dentro del álbum (pestaña «colecciones», `htmlColecciones`). La ruleta pasa a Objetivos (ya no está en Trabajar ni cuenta en su globo). Fuera los juegos de dos en el mismo móvil (ya están los de dúo en directo).
- Racha diaria: un día de gracia por semana (`racha.perdon` = semana usada). Si faltáis un solo día se mantiene y la bienvenida lo avisa.
- Suciedad: `TOPE_SUCIEDAD = 7`. Sin jugar se generan como mucho 3 cosas nuevas; las mascotas fuera de línea hacen como mucho 1 caca; en juego, tope de 3 cacas y 2 pises.
- Las plantas mustias ya no quitan puntos de «acogedor».
- Vecinos: decir que no a una visita ya no resta corazones; «Hacerse el sordo» con el ruido resta 2 y el evento sale la mitad de veces.
- Dúo: las 3 primeras partidas del día pagan completo, las siguientes el 30 % (`estado.duoHoy`).

## La casa de vuestros sueños, ajustes, guía tardía, minijuegos e inglés (v86)
- `sueno.js` (Objetivos → 🏡, primera casilla): 8 sueños (`METAS`): todas las obras, nivel 30, acogedor 90 (`estado.acogedorMax`), 80 % del álbum, 3 mascotas, 50 recuerdos, 4 vecinos con cariño ≥ 80 (`encargos.datos().conf`) y 100 días jugando (`estado.diasJugados`, sube en cada día nuevo; también `estado.rachaMax`). Cada sueño da `paga(400)` y un recuerdo. `sueno.revisar()` corre en `revisarProgreso` (no en el piso de inversión).
- Al cumplir los 8: escena final (`escenaFinal`) cuando no hay nada abierto: franjas de cine, cámara girando, frases con días, muebles, mascotas y recuerdos, «La casa de vuestros sueños», vuestros nombres y fuegos artificiales. `body.modo-cine` esconde el HUD. Premio: `paga(3000)`, 10 tickets y la **Placa de la casa soñada** (`placa-suenos`, legendaria). `estado.sueno.final` guarda la fecha; se puede volver a ver desde la ficha del sueño.
- Libro de recuerdos (`sueno.libro()`, también en Nosotros → 📖): portada con la casa y vuestros nombres, «Nuestros números», recuerdos de 6 en 6 por meses, fotos (postales y fotos de la pared) y cierre. Se pasa con flechas o deslizando. `estado.inicio` = fecha del primer recuerdo.
- Ajustes: deslizador de música (0 = apagada, `lofi.ponerVolumen`, `hogar-vol-musica`) y de efectos (`sonido.ponerVolumen`, bus propio, `hogar-vol-efectos`), tamaño de texto (Normal / Grande / Muy grande → `body.texto-grande/texto-muy`, `zoom` en hojas, diálogos, presentación y libro; `hogar-texto`) y avisos (Todos / Solo importantes, `hogar-avisos-modo`).
- Avisos: `ui.aviso` ya no pisa uno que lleva menos de 1,3 s: se encolan (máx. 3, sin repetir). `ui.avisoSuave()` se salta en modo «Solo importantes»: actividad de la pareja en directo, caca y pis, nuevo recuerdo, pegatina nueva y la lluvia.
- Guía para quien se une tarde (`mostrarGuiaTarde` en bienvenida.js): si al unirte la casa ya tiene progreso (nivel 3+, 3 recuerdos, 3 días o nivel de casa), al entrar salen 4 tarjetas: lo que ya tenéis, «aquí no hay muñecos: sois vosotros», cómo se avanza y qué hacer juntos. Marca con `hogar-guia-tarde`.
- Minijuegos clásicos: Cocina rápida (los ingredientes vuelan a la sartén, cada plato suma tiempo, ⭐ si sale sin fallos, objetivo 6 platos); Parejas (vistazo de 1,6 s al empezar y racha); Puzzle (2 pistas que colocan una pieza a cambio de 6 s).
- Inglés: ~450 entradas nuevas en `i18n_en.js`. Para buscar lo que falte: script con acorn que saca literales y plantillas (los `${}` pasan a `{n}`), los parte por etiquetas HTML y prueba `traducirTexto` (en /tmp/i18n/faltan.mjs durante la sesión). Lo que queda marcado son nombres propios (Don Ramón → Mr Ramón, etc.).

## Modo foto (v87)
- Más → Fotos → 📸 Modo foto (`mas.modoFoto()`): se esconde todo el HUD (`body.modo-foto`) y queda un marco cuadrado con rejilla de tercios (botón # para quitarla). La cámara se mueve con los gestos de siempre.
- Botón de luz: Ahora / Mañana (9 h) / Atardecer (19:24) / Noche (22:30). Cambia `ambiente.horaFija` y llama a `calcular()`; al salir se restaura.
- 🐾 ¡Posad!: las mascotas despiertas miran a cámara 7 s (`ctx.posar` en main.js, estado `mirar` con `objetivoMirar`).
- Disparo: flash y sonido de obturador. `capturarZona(rect)` recorta justo lo que hay dentro del marco, sin los sprites (avisos «!», burbujas de sed) y lo pasa al editor de siempre (filtros, pegatinas y marcos) → compartir, álbum o diario (`editarYCompartir`).
- Mientras está abierto cuenta como `dialogoAbierto()`, así no saltan visitas ni eventos encima.
- Meshy queda cerrado: se usan los modelos de cubo descargados.

## Las entidades no se atraviesan (v88)
- `choques.js` → `separar(cuerpos, dt, libre)`: cada cuerpo es un círculo en el suelo `{ p, r, peso, fijo, y, mueve, vx, vz }`. Si dos se solapan se empujan poco a poco (más el de menos peso). Si los dos van andando uno contra otro, además se apartan de lado para cruzarse sin atascarse. `libre(x, z)` impide empujar a nadie dentro de un mueble o fuera de la habitación; si un lado no puede moverse, se mueve el otro.
- En casa (`evitarChoques` en main.js, cada fotograma): mascotas en el suelo (`mascotas.cuerposChoque()`, radio 0,16 × tamaño; quedan fuera las que están encima de muebles, saltando, en el baño o de paseo), el robot aspirador (peso 3; fijo mientras limpia), Robi la limpiadora y el vecino de visita (fijos).
- En los pisos de la pantalla de inicio (escaparate.js): mascotas contra Robi y la aspiradora, que siguen su ruta y apartan a las mascotas.

## El piso dentro de un edificio y el dron de reparto (v89)
- `edificio.js` (`Edificio`): el piso ya no flota. Está en la 4ª planta de un edificio:
  - Debajo: el bloque del edificio (`bloque`) con fachada de ventanas y balcones, cornisas por planta y bajos con tiendas y toldos, hasta la calle (`CALLE_Y` = -9,5).
  - Encima: 3 plantas más (`paneles`, uno por pared) que siguen la misma regla que las paredes: se esconden las que dan a la cámara.
  - Alrededor: 2 calles con asfalto, pasos de cebra, bordillos, farolas y árboles (InstancedMesh), 8 coches que circulan (InstancedMesh, color por instancia) y ~45 edificios vecinos de 3 a 12 plantas.
  - Edificios vecinos fusionados en una malla por material, con un atributo `aV` (índice del edificio) y un uniform `uEsc[96]`: si un edificio quedaría delante del piso tapándolo, se «hunde» suavemente en el suelo (`actualizar`). Una sola llamada de dibujo por material.
  - Texturas de fachada hechas en canvas (6 estilos; 12 × 12 m por repetición) con un `emissiveMap` de ventanas encendidas al azar. De noche (`ambiente.nocheK`, de 18:30 a 21 sube poco a poco) se encienden ventanas, escaparates, farolas y faros. Niebla con el color del cielo para la distancia.
  - Se dibuja en dos pasadas (`edificio.renderizar`): primero la ciudad (capa 2, near -40 / far 170) y, tras limpiar profundidad, la casa con la cámara de siempre (near 4 / far 44). Así no se pierde precisión de profundidad en la casa (lo del parpadeo de la ventana). Las fotos (`mas.capturar`) usan la misma función (`ctx.pintar`).
  - Según la casa (`tipoEdificio`): pisos 0-1 en medio del edificio; ático sin plantas encima; casa con jardín, mansión y jardín a pie de calle (el bloque de abajo se esconde y la ciudad sube). Los pisos de inversión, en medio.
  - Zoom mínimo 0,5 para ver más ciudad.
- Reparto en dron (`entregas.js`): sustituye a la furgoneta. Llega volando desde fuera y se queda flotando junto a la pared que da a la cámara (la abierta) con el paquete colgando de un cable. Si giráis la cámara, se recoloca. Al tocar el paquete se suelta y el dron se va. Varios paquetes = varios drones en fila. `entregas.puntoEspera(k)` en main.js decide el sitio.

## Pisos de los vecinos de abajo y gente en la calle (v90)
- Fuera las plantas de encima: el edificio acaba en vuestro piso.
- `pisosVecinos.js` (`PisosVecinos`, dentro de `edificio`): las 2 plantas de debajo son pisos abiertos como el vuestro, con paredes que se esconden del lado de la cámara, ventana y muebles del catálogo (4 decorados: salón, dormitorio con escritorio, comedor, salón con tele). La planta baja sigue con tiendas.
- Cada 7-19 s pasa algo en uno de esos pisos (`empezarEvento`): alguien se asoma al borde y saluda, pasea por casa, dos vecinos charlan, alguien se sienta en el sofá con la tele cambiando de color, riega la planta, un gato o un perro da una vuelta y se asoma; de noche, fiesta con luces de colores y gente saltando, o se enciende/apaga la luz del piso. Los puntos se eligen en la mitad que da a la cámara para que se vea. Pasos: `aparecer / ir / anim / mirar / mover / espera / desaparecer`.
- De noche los pisos de abajo tienen luz cálida (emisivo de paredes y suelo); uno de cada cuatro, a oscuras.
- Peatones (`edificio.peatones`): 5 vecinos que van andando por las aceras.

## Pisos de abajo cerrados, se ven por la ventana (v91)
- Los 2 pisos de debajo ya no están abiertos: tienen fachada completa (`pisosVecinos.construir`) con huecos de ventana de verdad (cajas alrededor de cada hueco), marco, cristal casi transparente, alféizar, cortinas por dentro y, por fuera, macetas con flores o balcón con barandilla (en los balcones el hueco llega al suelo y sirve de puerta). Por dentro las paredes llevan papel pintado (`ShapeGeometry` con agujeros donde van las ventanas).
- Los eventos se hacen en una ventana que da a la cámara (`ventanas[]` con `dentro`, `alfeizar`, `fuera`): alguien se asoma y saluda, sale al balcón, pasa por delante, dos vecinos charlan junto a la ventana, riega las macetas, un gato se sienta en el alféizar; de noche, la luz azulada de la tele parpadeando, fiesta con colores o luces que se encienden/apagan.
- Edificios vecinos: ya no hay ninguno pegado al vuestro (calle de 3 m alrededor) y se hunden también si tapan los pisos de abajo, no solo el vuestro. Casa con jardín y mansión, a pie de calle.
