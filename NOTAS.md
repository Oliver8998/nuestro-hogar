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

## En curso: modelos mejorados con Blender
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

## Ideas pendientes (no pedidas aún)
- Sincronizar los dos móviles (Supabase).
- Minijuegos para ganar monedas.
- Mudarse a casas mejores, hasta una mansión.
