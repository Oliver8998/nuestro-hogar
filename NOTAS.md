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
