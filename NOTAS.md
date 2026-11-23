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
  - Entra con rebote, los muebles aparecen uno a uno, la cámara se balancea y cambia cada 6,5 s; si se toca, pasa a la siguiente. Se destruye al cerrar el menú.
- 23-nov 20:13: sin nombre de sala ni puntitos; el fondo es solo cielo (sin colinas, vallas ni árboles). La luz de las salas sigue la hora real (`periodo()` y `LUZ` en escaparate.js): de día luz natural, al atardecer anaranjada y de noche oscuro con lámparas, chimenea y LED encendidos.
- 23-nov 20:20: cielo más elaborado:
  - degradado de 4 colores, sol con halo y rayos que giran, luna con cráteres y halo;
  - nubes esponjosas con sombra y brillo, banco de nubes abajo, globo aerostático (de día y al atardecer), Vía Láctea, estrellas que brillan y estrella fugaz.
  - Se quitaron las burbujas de avisos del menú.
  - La habitación tiene altura fija (52vh, o 44vh con sesión) y todo va centrado, para que no quede hueco hasta los botones.
- El menú tiene ahora menos texto: el título, el nombre de la sala con puntitos, una tarjeta mini (casa, 🪙, 🔥, 🕯️) y avisos en burbujas con icono (`resumen().novedades` = `{i, t}`).

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
