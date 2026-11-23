const PI = Math.PI;

export const PRECIO_RAREZA = { raro: 150, epico: 350, legendario: 700 };

export const RAREZAS = {
  comun: { nombre: 'Común', color: '#9aa5b1' },
  raro: { nombre: 'Raro', color: '#4f8fe0' },
  epico: { nombre: 'Épico', color: '#a35ee0' },
  legendario: { nombre: 'Legendario', color: '#f0a020' }
};

export const CATALOGO = [
  { id: 'colchon', categoria: 'muebles', nombre: 'Colchón viejo', precio: 0, enTienda: false, ancho: 2, fondo: 4, piezas: [
    [1, 0.18, 2, 0, 0.09, 0, 0xcfc6b0],
    [0.7, 0.08, 0.35, 0, 0.22, -0.7, 0xeeeeee]
  ]},

  { id: 'silla', categoria: 'muebles', nombre: 'Silla', precio: 60, ancho: 1, fondo: 1, piezas: [
    [0.42, 0.05, 0.42, 0, 0.45, 0, 0xa8794f],
    [0.42, 0.45, 0.05, 0, 0.7, -0.19, 0xa8794f],
    [0.04, 0.45, 0.04, -0.18, 0.225, -0.18, 0x7a5535],
    [0.04, 0.45, 0.04, 0.18, 0.225, -0.18, 0x7a5535],
    [0.04, 0.45, 0.04, -0.18, 0.225, 0.18, 0x7a5535],
    [0.04, 0.45, 0.04, 0.18, 0.225, 0.18, 0x7a5535]
  ], colores: { grupos: [[0, 1], [2, 3, 4, 5]], paleta: [
    [0xa8794f, 0x7a5535], [0xf2efe9, 0xd8d2c8], [0x3d3d3d, 0x262626], [0x7fa3c6, 0x5d7fa1], [0xe58f9e, 0xc96f7e]
  ]}},

  { id: 'mesita', categoria: 'muebles', nombre: 'Mesita de noche', precio: 50, ancho: 1, fondo: 1, soporte: 0.5, piezas: [
    [0.44, 0.46, 0.4, 0, 0.23, 0, 0xb98a5e],
    [0.46, 0.04, 0.42, 0, 0.48, 0, 0xa07450],
    [0.34, 0.14, 0.02, 0, 0.32, 0.205, 0xc99b6e],
    [0.05, 0.05, 0.05, 0, 0.32, 0.22, 0xe0c878, 'esfera']
  ], colores: { grupos: [[0, 2], [1]], paleta: [
    [0xb98a5e, 0xa07450], [0xf2efe9, 0xd9b98c], [0x9bb8d9, 0xf2efe9], [0xf4b3be, 0xf2efe9]
  ]}},

  { id: 'mesa', categoria: 'muebles', nombre: 'Mesa', precio: 100, ancho: 2, fondo: 2, soporte: 0.755, piezas: [
    [0.95, 0.05, 0.95, 0, 0.73, 0, 0xa8794f],
    [0.06, 0.7, 0.06, -0.42, 0.35, -0.42, 0x7a5535],
    [0.06, 0.7, 0.06, 0.42, 0.35, -0.42, 0x7a5535],
    [0.06, 0.7, 0.06, -0.42, 0.35, 0.42, 0x7a5535],
    [0.06, 0.7, 0.06, 0.42, 0.35, 0.42, 0x7a5535]
  ], colores: { grupos: [[0], [1, 2, 3, 4]], paleta: [
    [0xa8794f, 0x7a5535], [0xf2efe9, 0xd8d2c8], [0x3d3d3d, 0x262626], [0xd9b98c, 0xb8976b]
  ]}},

  { id: 'escritorio', categoria: 'muebles', nombre: 'Escritorio', precio: 140, ancho: 2, fondo: 1, soporte: 0.75, piezas: [
    [0.98, 0.04, 0.48, 0, 0.73, 0, 0xd9b98c],
    [0.3, 0.22, 0.44, 0.3, 0.6, 0, 0xd9b98c],
    [0.04, 0.71, 0.04, -0.45, 0.355, -0.2, 0x3d3d3d],
    [0.04, 0.71, 0.04, -0.45, 0.355, 0.2, 0x3d3d3d],
    [0.04, 0.71, 0.04, 0.45, 0.355, -0.2, 0x3d3d3d],
    [0.04, 0.71, 0.04, 0.45, 0.355, 0.2, 0x3d3d3d],
    [0.12, 0.03, 0.02, 0.3, 0.6, 0.225, 0x3d3d3d]
  ], colores: { grupos: [[0, 1]], paleta: [[0xd9b98c], [0xf2efe9], [0x8b5a3c], [0x9bb8d9]] }},

  { id: 'comoda', categoria: 'muebles', nombre: 'Cómoda', precio: 150, ancho: 2, fondo: 1, soporte: 0.8, piezas: [
    [0.96, 0.76, 0.44, 0, 0.38, 0, 0xe8dccb],
    [0.98, 0.04, 0.46, 0, 0.78, 0, 0xc9a57a],
    [0.88, 0.2, 0.02, 0, 0.15, 0.225, 0xf2e9dc],
    [0.88, 0.2, 0.02, 0, 0.38, 0.225, 0xf2e9dc],
    [0.88, 0.2, 0.02, 0, 0.61, 0.225, 0xf2e9dc],
    [0.05, 0.05, 0.05, 0, 0.15, 0.24, 0xc9a57a, 'esfera'],
    [0.05, 0.05, 0.05, 0, 0.38, 0.24, 0xc9a57a, 'esfera'],
    [0.05, 0.05, 0.05, 0, 0.61, 0.24, 0xc9a57a, 'esfera']
  ], colores: { grupos: [[0], [2, 3, 4]], paleta: [
    [0xe8dccb, 0xf2e9dc], [0x9bb8d9, 0xb5cce4], [0xa8d8c8, 0xc2e6da], [0xf4b3be, 0xf8ccd3], [0x6d4c3d, 0x8a6550]
  ]}},

  { id: 'estanteria', categoria: 'muebles', nombre: 'Estantería', precio: 130, ancho: 2, fondo: 1, soporte: 1.6, piezas: [
    [0.04, 1.6, 0.35, -0.48, 0.8, 0, 0x9c6b45],
    [0.04, 1.6, 0.35, 0.48, 0.8, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 0.05, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 0.55, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 1.05, 0, 0x9c6b45],
    [0.96, 0.03, 0.35, 0, 1.585, 0, 0x9c6b45],
    [0.1, 0.25, 0.25, -0.3, 0.2, 0, 0xc0504d],
    [0.08, 0.22, 0.25, -0.18, 0.19, 0, 0x4f81bd],
    [0.3, 0.2, 0.25, 0.2, 0.68, 0, 0x9bbb59],
    [0.07, 0.24, 0.24, 0.25, 1.19, 0, 0xe0c878]
  ], colores: { grupos: [[0, 1, 2, 3, 4, 5]], paleta: [[0x9c6b45], [0xf2efe9], [0x3d3d3d], [0xd9b98c]] }},

  { id: 'tele', categoria: 'muebles', nombre: 'Tele', precio: 230, ancho: 2, fondo: 1, piezas: [
    [0.95, 0.45, 0.4, 0, 0.225, 0, 0x6d4c3d],
    [0.2, 0.05, 0.15, 0, 0.475, -0.05, 0x333333],
    [0.85, 0.5, 0.05, 0, 0.75, -0.05, 0x222222]
  ], encendible: { piezas: [2], brillo: 0x6fa8dc, inicial: false },
  colores: { grupos: [[0]], paleta: [[0x6d4c3d], [0xf2efe9], [0x3d3d3d], [0xd9b98c]] }},

  { id: 'nevera', categoria: 'muebles', nombre: 'Nevera', precio: 250, ancho: 2, fondo: 2, soporte: 1.8, piezas: [
    [0.85, 1.8, 0.75, 0, 0.9, 0, 0xf2f2f2],
    [0.86, 0.02, 0.76, 0, 1.2, 0, 0xdddddd],
    [0.04, 0.4, 0.04, 0.33, 1.45, 0.39, 0x999999]
  ], colores: { grupos: [[0]], paleta: [[0xf2f2f2], [0xa8d8c8], [0xf2b8c6], [0x3d3d3d], [0xf2d06b]] }},

  { id: 'sofa', categoria: 'muebles', nombre: 'Sofá', precio: 280, ancho: 4, fondo: 2, piezas: [
    [1.9, 0.4, 0.85, 0, 0.2, 0.05, 0x6b8fb3],
    [1.9, 0.55, 0.2, 0, 0.55, -0.38, 0x5d7fa1],
    [0.18, 0.6, 0.85, -0.86, 0.3, 0.05, 0x5d7fa1],
    [0.18, 0.6, 0.85, 0.86, 0.3, 0.05, 0x5d7fa1],
    [0.8, 0.1, 0.6, -0.42, 0.45, 0.08, 0x7fa3c6],
    [0.8, 0.1, 0.6, 0.42, 0.45, 0.08, 0x7fa3c6]
  ], colores: { grupos: [[0], [1, 2, 3], [4, 5]], paleta: [
    [0x6b8fb3, 0x5d7fa1, 0x7fa3c6], [0x7a9e6b, 0x6a8c5c, 0x93b884], [0xd99aa5, 0xc78893, 0xe8b4bd],
    [0x8c8c8c, 0x7a7a7a, 0xa3a3a3], [0xd1a34a, 0xbb8f3d, 0xe2bb6a]
  ]}},

  { id: 'cama', categoria: 'muebles', nombre: 'Cama', precio: 380, ancho: 3, fondo: 4, piezas: [
    [1.4, 0.3, 1.95, 0, 0.15, 0, 0x8b5a3c],
    [1.3, 0.2, 1.8, 0, 0.4, 0.05, 0xf3efe6],
    [1.4, 0.9, 0.08, 0, 0.45, -0.95, 0x8b5a3c],
    [0.5, 0.1, 0.3, -0.3, 0.55, -0.7, 0xf0eae1],
    [0.5, 0.1, 0.3, 0.3, 0.55, -0.7, 0xf0eae1],
    [1.32, 0.04, 1.1, 0, 0.51, 0.4, 0xe58f9e]
  ], colores: { grupos: [[5]], paleta: [[0xe58f9e], [0x7fa3c6], [0x93b884], [0xf2d06b], [0xb39ddb], [0xf3efe6]] }},

  { id: 'caja', categoria: 'deco', nombre: 'Caja', precio: 10, ancho: 1, fondo: 1, soporte: 0.42, piezas: [
    [0.45, 0.4, 0.45, 0, 0.2, 0, 0xb8875a],
    [0.46, 0.03, 0.1, 0, 0.405, 0, 0xd9c27a]
  ]},

  { id: 'libros', categoria: 'deco', nombre: 'Pila de libros', precio: 20, ancho: 1, fondo: 1, soporte: 0.15, piezas: [
    [0.3, 0.05, 0.22, 0, 0.025, 0, 0xc0504d],
    [0.28, 0.05, 0.2, 0.01, 0.075, 0.01, 0x4f81bd, { ry: 0.2 }],
    [0.26, 0.05, 0.21, -0.01, 0.125, 0, 0x9bbb59, { ry: -0.15 }]
  ]},

  { id: 'cactus', categoria: 'deco', nombre: 'Cactus', precio: 20, ancho: 1, fondo: 1, piezas: [
    [0.16, 0.12, 0.16, 0, 0.06, 0, 0xc96f4a, 'cil'],
    [0.09, 0.24, 0.09, 0, 0.24, 0, 0x5a9e4b, 'cil'],
    [0.09, 0.09, 0.09, 0, 0.36, 0, 0x5a9e4b, 'esfera'],
    [0.05, 0.1, 0.05, 0.065, 0.26, 0, 0x5a9e4b, 'cil'],
    [0.05, 0.05, 0.05, 0.065, 0.31, 0, 0x5a9e4b, 'esfera'],
    [0.04, 0.04, 0.04, 0, 0.405, 0, 0xf28aa0, 'esfera']
  ], colores: { grupos: [[0]], paleta: [[0xc96f4a], [0xf2efe9], [0x7fa3c6], [0xf2d06b]] }},

  { id: 'jarron', categoria: 'deco', nombre: 'Jarrón con flores', precio: 30, ancho: 1, fondo: 1, piezas: [
    [0.16, 0.26, 0.16, 0, 0.13, 0, 0x7fa3c6, 'cil'],
    [0.02, 0.18, 0.02, 0, 0.33, 0, 0x5a9e4b, 'cil'],
    [0.1, 0.1, 0.1, 0, 0.44, 0, 0xf28aa0, 'esfera'],
    [0.08, 0.08, 0.08, 0.07, 0.4, 0.03, 0xf7e07a, 'esfera'],
    [0.08, 0.08, 0.08, -0.06, 0.41, -0.03, 0xb39ddb, 'esfera']
  ], colores: { grupos: [[0]], paleta: [[0x7fa3c6], [0xf2efe9], [0xe58f9e], [0xa8d8c8]] }},

  { id: 'radio', categoria: 'deco', nombre: 'Radio retro', precio: 45, ancho: 1, fondo: 1, piezas: [
    [0.3, 0.18, 0.12, 0, 0.09, 0, 0xe58f9e],
    [0.1, 0.012, 0.1, -0.06, 0.09, 0.061, 0x3d3d3d, 'cil', { rx: PI / 2 }],
    [0.08, 0.05, 0.01, 0.07, 0.1, 0.061, 0xf2efe9],
    [0.012, 0.22, 0.012, 0.1, 0.27, 0, 0x999999, 'cil', { rz: -0.4 }]
  ], colores: { grupos: [[0]], paleta: [[0xe58f9e], [0x7fa3c6], [0xa8d8c8], [0xf2d06b], [0x3d3d3d]] }},

  { id: 'lampara-mesa', categoria: 'deco', nombre: 'Lámpara de mesa', precio: 40, ancho: 1, fondo: 1, piezas: [
    [0.14, 0.03, 0.14, 0, 0.015, 0, 0x3d3d3d, 'cil'],
    [0.02, 0.22, 0.02, 0, 0.13, 0, 0x3d3d3d, 'cil'],
    [0.22, 0.16, 0.22, 0, 0.3, 0, 0xfff1c9, 'cil']
  ], encendible: { piezas: [2], luz: 0.3, intensidad: 1.5, inicial: true },
  colores: { grupos: [[2]], paleta: [[0xfff1c9], [0xffd1dc], [0xd1ecff], [0xd9f7d1]] }},

  { id: 'planta', categoria: 'deco', nombre: 'Planta', precio: 40, ancho: 1, fondo: 1, piezas: [
    [0.3, 0.3, 0.3, 0, 0.15, 0, 0xc96f4a, 'cil'],
    [0.45, 0.5, 0.45, 0, 0.55, 0, 0x5a9e4b, 'esfera'],
    [0.3, 0.3, 0.3, 0.08, 0.8, 0.05, 0x6db35a, 'esfera']
  ], colores: { grupos: [[0]], paleta: [[0xc96f4a], [0xf2efe9], [0x3d3d3d], [0x7fa3c6], [0xe0c06a]] }},

  { id: 'puff', categoria: 'deco', nombre: 'Puf', precio: 50, ancho: 1, fondo: 1, soporte: 0.375, piezas: [
    [0.4, 0.34, 0.4, 0, 0.17, 0, 0xe8b4bd, 'cil'],
    [0.38, 0.035, 0.38, 0, 0.357, 0, 0xf2c9cf, 'cil']
  ], colores: { grupos: [[0], [1]], paleta: [
    [0xe8b4bd, 0xf2c9cf], [0x9bb8d9, 0xb5cce4], [0xf2d06b, 0xf7e2a0], [0x8c8c8c, 0xa8a8a8]
  ]}},

  { id: 'espejo', categoria: 'deco', nombre: 'Espejo de pie', precio: 90, ancho: 1, fondo: 1, piezas: [
    [0.34, 0.04, 0.26, 0, 0.02, 0, 0xd9b98c],
    [0.4, 1.4, 0.05, 0, 0.76, -0.05, 0xd9b98c],
    [0.32, 1.28, 0.01, 0, 0.76, -0.02, 0xdfeef5, { metal: 0.6, rugosidad: 0.1 }]
  ], colores: { grupos: [[0, 1]], paleta: [[0xd9b98c], [0xf2efe9], [0x3d3d3d], [0xe0c06a]] }},

  { id: 'lampara', categoria: 'deco', nombre: 'Lámpara de pie', precio: 75, ancho: 1, fondo: 1, piezas: [
    [0.25, 0.04, 0.25, 0, 0.02, 0, 0x444444, 'cil'],
    [0.03, 1.3, 0.03, 0, 0.67, 0, 0x444444, 'cil'],
    [0.35, 0.3, 0.35, 0, 1.4, 0, 0xfff1c9, 'cil']
  ], encendible: { piezas: [2], luz: 1.35, inicial: true },
  colores: { grupos: [[2]], paleta: [[0xfff1c9], [0xffd1dc], [0xd1ecff], [0xd9f7d1], [0xffe08a]] }},

  { id: 'alfombra', categoria: 'deco', nombre: 'Alfombra', precio: 90, suelo: true, ancho: 4, fondo: 3, piezas: [
    [1.9, 0.02, 1.4, 0, 0.01, 0, 0xd9a5b3],
    [1.6, 0.025, 1.1, 0, 0.012, 0, 0xe8c2cc]
  ], colores: { grupos: [[0], [1]], paleta: [
    [0xd9a5b3, 0xe8c2cc], [0xa5c4d9, 0xc2d8e8], [0xb3d9a5, 0xcce8c2], [0xe0c48a, 0xf0dcaf], [0x8c8c8c, 0xb0b0b0]
  ]}},

  { id: 'pelota', categoria: 'mascotas', nombre: 'Pelota', precio: 25, ancho: 1, fondo: 1, paraMascota: true, juguete: true, piezas: [
    [0.16, 0.16, 0.16, 0, 0.08, 0, 0xe8c547, 'esfera'],
    [0.165, 0.03, 0.165, 0, 0.08, 0, 0xf0eae1, 'cil', { rx: 0.4 }]
  ], colores: { grupos: [[0]], paleta: [[0xe8c547], [0xe05050], [0x5a9fd6], [0x6cc08a]] }},

  { id: 'comedero', categoria: 'mascotas', nombre: 'Comedero', precio: 60, ancho: 1, fondo: 1, paraMascota: true, comedero: true, piezas: [
    [0.3, 0.08, 0.3, 0, 0.04, 0, 0xe58f9e, 'cil'],
    [0.22, 0.03, 0.22, 0, 0.075, 0, 0x8a5a3c, 'cil']
  ], colores: { grupos: [[0]], paleta: [[0xe58f9e], [0x7fa3c6], [0x6cc08a], [0xf2d06b]] }},

  { id: 'cama-mascota', categoria: 'mascotas', nombre: 'Cama de mascota', precio: 100, ancho: 2, fondo: 2, paraMascota: true, camaMascota: true, piezas: [
    [0.8, 0.16, 0.8, 0, 0.08, 0, 0x9bb8d9, 'cil'],
    [0.62, 0.06, 0.62, 0, 0.14, 0, 0xdbe7f3, 'cil']
  ], colores: { grupos: [[0], [1]], paleta: [
    [0x9bb8d9, 0xdbe7f3], [0xe58f9e, 0xf8dde2], [0x6cc08a, 0xd8efdf], [0x8b5a3c, 0xe8d8c4]
  ]}},

  { id: 'rascador', categoria: 'mascotas', nombre: 'Rascador', precio: 110, ancho: 1, fondo: 1, soporte: 0.9, piezas: [
    [0.44, 0.05, 0.44, 0, 0.025, 0, 0xd9c29a],
    [0.12, 0.8, 0.12, 0, 0.45, 0, 0xc9a66b, 'cil'],
    [0.38, 0.05, 0.38, 0, 0.875, 0, 0xd9c29a],
    [0.008, 0.3, 0.008, 0.14, 0.71, 0, 0xf0eae1, 'cil'],
    [0.07, 0.07, 0.07, 0.14, 0.55, 0, 0xe58f9e, 'esfera']
  ]},

  { id: 'caseta', categoria: 'mascotas', nombre: 'Caseta', precio: 220, ancho: 2, fondo: 2, piezas: [
    [0.85, 0.6, 0.85, 0, 0.3, 0, 0xc0504d],
    [0.6, 0.05, 0.95, -0.21, 0.74, 0, 0x6d4c3d, { rz: 0.62 }],
    [0.6, 0.05, 0.95, 0.21, 0.74, 0, 0x6d4c3d, { rz: -0.62 }],
    [0.32, 0.38, 0.02, 0, 0.19, 0.43, 0x3b2f26],
    [0.85, 0.3, 0.03, 0, 0.66, 0.42, 0xc0504d, { rz: PI / 4, ry: 0 }]
  ], colores: { grupos: [[0, 4]], paleta: [[0xc0504d], [0x7fa3c6], [0xf2d06b], [0x6cc08a]] }},

  { id: 'robot', categoria: 'limpieza', nombre: 'Robot friegasuelos', precio: 600, ancho: 1, fondo: 1, paraMascota: true, robot: true, piezas: [
    [0.44, 0.04, 0.3, 0, 0.02, -0.05, 0xd8d0c4],
    [0.3, 0.1, 0.06, 0, 0.07, -0.17, 0xf2efe9],
    [0.06, 0.03, 0.02, 0, 0.1, -0.14, 0x6cc08a, { brillo: true }],
    [0.34, 0.07, 0.34, 0, 0.075, 0.06, 0xf7f4ef, 'cil'],
    [0.12, 0.02, 0.12, 0, 0.12, 0.06, 0x3b2f26, 'cil'],
    [0.03, 0.02, 0.03, 0.09, 0.12, 0.06, 0x6cc08a, 'cil', { brillo: true }]
  ]},

  { id: 'arenero', categoria: 'limpieza', nombre: 'Arenero', precio: 140, ancho: 2, fondo: 1, paraMascota: true, arenero: true, piezas: [
    [0.8, 0.14, 0.42, 0, 0.07, 0, 0x7fa3c6],
    [0.72, 0.03, 0.34, 0, 0.13, 0, 0xe8d8b0],
    [0.05, 0.05, 0.05, 0.2, 0.15, 0.05, 0xd9c49a, 'esfera'],
    [0.04, 0.04, 0.04, -0.15, 0.15, -0.06, 0xd9c49a, 'esfera']
  ], colores: { grupos: [[0]], paleta: [[0x7fa3c6], [0xe58f9e], [0x6cc08a], [0xf2d06b]] }},

  { id: 'trampa', categoria: 'limpieza', nombre: 'Trampa para bichos', precio: 100, ancho: 1, fondo: 1, paraMascota: true, trampa: true, piezas: [
    [0.26, 0.06, 0.26, 0, 0.03, 0, 0x6cc08a],
    [0.18, 0.06, 0.18, 0, 0.08, 0, 0xf2d06b, 'cil'],
    [0.08, 0.02, 0.02, 0.09, 0.03, 0.13, 0x3b2f26]
  ]},

  { id: 'lampara-lava', categoria: 'deco', nombre: 'Lámpara de lava', enTienda: false, rareza: 'raro', ancho: 1, fondo: 1, piezas: [
    [0.2, 0.12, 0.2, 0, 0.06, 0, 0x6b5bb5, 'cil'],
    [0.15, 0.36, 0.15, 0, 0.3, 0, 0xc27ee8, 'cil', { transparente: 0.85 }],
    [0.08, 0.08, 0.08, 0.02, 0.24, 0, 0xff9a3c, 'esfera', { brillo: true }],
    [0.06, 0.07, 0.06, -0.02, 0.38, 0.01, 0xff7a3c, 'esfera', { brillo: true }],
    [0.12, 0.06, 0.12, 0, 0.51, 0, 0x6b5bb5, 'cil']
  ], encendible: { piezas: [1], luz: 0.35, intensidad: 1.2, colorLuz: 0xc27ee8, inicial: true }},

  { id: 'peluche', categoria: 'deco', nombre: 'Oso de peluche', enTienda: false, rareza: 'raro', ancho: 1, fondo: 1, piezas: [
    [0.32, 0.34, 0.28, 0, 0.17, 0, 0xb07a4f, 'esfera'],
    [0.26, 0.24, 0.24, 0, 0.42, 0.02, 0xb07a4f, 'esfera'],
    [0.09, 0.09, 0.06, -0.1, 0.53, 0, 0xb07a4f, 'esfera'],
    [0.09, 0.09, 0.06, 0.1, 0.53, 0, 0xb07a4f, 'esfera'],
    [0.11, 0.08, 0.07, 0, 0.4, 0.12, 0xe8cfa8, 'esfera'],
    [0.035, 0.035, 0.03, -0.05, 0.46, 0.12, 0x222222, 'esfera'],
    [0.035, 0.035, 0.03, 0.05, 0.46, 0.12, 0x222222, 'esfera'],
    [0.12, 0.05, 0.05, 0, 0.29, 0.12, 0xe58f9e]
  ]},

  { id: 'globo', categoria: 'deco', nombre: 'Globo terráqueo', enTienda: false, rareza: 'raro', ancho: 1, fondo: 1, piezas: [
    [0.22, 0.03, 0.22, 0, 0.015, 0, 0x8b5a3c, 'cil'],
    [0.03, 0.3, 0.03, 0, 0.17, 0, 0x8b5a3c, 'cil'],
    [0.34, 0.34, 0.34, 0, 0.5, 0, 0x5a9fd6, 'esfera'],
    [0.16, 0.14, 0.08, 0.06, 0.56, 0.13, 0x6db35a, 'esfera'],
    [0.12, 0.1, 0.07, -0.1, 0.44, 0.11, 0x6db35a, 'esfera'],
    [0.1, 0.12, 0.07, -0.12, 0.55, -0.1, 0x6db35a, 'esfera']
  ]},

  { id: 'puff-corazon', categoria: 'deco', nombre: 'Puf corazón', enTienda: false, rareza: 'raro', ancho: 2, fondo: 2, piezas: [
    [0.46, 0.36, 0.46, -0.15, 0.18, -0.08, 0xe0505f, 'esfera'],
    [0.46, 0.36, 0.46, 0.15, 0.18, -0.08, 0xe0505f, 'esfera'],
    [0.42, 0.34, 0.42, 0, 0.17, 0.1, 0xe0505f, { ry: PI / 4 }]
  ], colores: { grupos: [[0, 1, 2]], paleta: [[0xe0505f], [0xf4b3be], [0xb39ddb]] }},

  { id: 'acuario', categoria: 'deco', nombre: 'Acuario', enTienda: false, rareza: 'epico', ancho: 2, fondo: 1, soporte: 1.0, piezas: [
    [0.96, 0.45, 0.42, 0, 0.225, 0, 0x3d3d3d],
    [0.9, 0.5, 0.38, 0, 0.71, 0, 0x7fc8e8, { transparente: 0.45 }],
    [0.88, 0.04, 0.36, 0, 0.48, 0, 0xe8d8a8],
    [0.09, 0.05, 0.03, -0.2, 0.7, 0.05, 0xff8c42, 'esfera'],
    [0.07, 0.045, 0.03, 0.15, 0.8, -0.05, 0xffd23f, 'esfera'],
    [0.07, 0.045, 0.03, 0.02, 0.62, 0.08, 0xff5d8f, 'esfera'],
    [0.04, 0.28, 0.04, 0.32, 0.62, 0, 0x3d9e4b, 'cil'],
    [0.04, 0.2, 0.04, 0.27, 0.58, 0.06, 0x4fb35e, 'cil'],
    [0.92, 0.03, 0.4, 0, 0.975, 0, 0x3d3d3d]
  ], encendible: { piezas: [1], brillo: 0x7fd8f8, luz: 0.8, intensidad: 1.2, colorLuz: 0x7fd8f8, inicial: true }},

  { id: 'arcade', categoria: 'deco', nombre: 'Máquina arcade', enTienda: false, rareza: 'epico', ancho: 2, fondo: 2, piezas: [
    [0.7, 1.55, 0.6, 0, 0.775, -0.05, 0x6b4fb5],
    [0.5, 0.4, 0.02, 0, 1.15, 0.255, 0x222222],
    [0.66, 0.08, 0.3, 0, 0.9, 0.35, 0x4a3590, { rx: -0.3 }],
    [0.06, 0.04, 0.06, -0.15, 0.95, 0.38, 0xe05050, 'cil'],
    [0.06, 0.04, 0.06, 0, 0.95, 0.38, 0xf2d06b, 'cil'],
    [0.06, 0.04, 0.06, 0.15, 0.95, 0.38, 0x5a9fd6, 'cil'],
    [0.66, 0.16, 0.04, 0, 1.45, 0.25, 0xffd23f, { brillo: true }]
  ], encendible: { piezas: [1], brillo: 0x6fe3a0, luz: 1.2, intensidad: 1, colorLuz: 0x6fe3a0, inicial: true },
  colores: { grupos: [[0]], paleta: [[0x6b4fb5], [0xe05050], [0x3d3d3d], [0x5a9fd6]] }},

  { id: 'sillon-huevo', categoria: 'muebles', nombre: 'Sillón huevo', enTienda: false, rareza: 'epico', ancho: 2, fondo: 2, piezas: [
    [0.7, 0.04, 0.7, 0, 0.02, -0.05, 0x3d3d3d, 'cil'],
    [0.05, 1.8, 0.05, 0, 0.9, -0.38, 0x3d3d3d, 'cil'],
    [0.05, 0.05, 0.42, 0, 1.8, -0.18, 0x3d3d3d],
    [0.02, 0.32, 0.02, 0, 1.63, 0.02, 0x999999, 'cil'],
    [0.7, 0.9, 0.62, 0, 0.98, 0.05, 0xd9b98c, 'esfera'],
    [0.5, 0.32, 0.36, 0, 0.82, 0.2, 0xf2efe9, 'esfera']
  ], colores: { grupos: [[5]], paleta: [[0xf2efe9], [0xe58f9e], [0x7fa3c6], [0xf2d06b]] }},

  { id: 'piano', categoria: 'muebles', nombre: 'Piano de cola', enTienda: false, rareza: 'legendario', ancho: 3, fondo: 2, soporte: 1.08, piezas: [
    [1.3, 0.35, 0.8, 0, 0.75, -0.05, 0x1a1a1a, { rugosidad: 0.25 }],
    [1.25, 0.03, 0.7, 0, 1.06, -0.12, 0x1a1a1a, { rx: -0.45, rugosidad: 0.25 }],
    [1.1, 0.04, 0.15, 0, 0.78, 0.42, 0xf0eae1],
    [1.0, 0.03, 0.06, 0, 0.81, 0.39, 0x222222],
    [0.08, 0.58, 0.08, -0.5, 0.29, 0.25, 0x1a1a1a, 'cil'],
    [0.08, 0.58, 0.08, 0.5, 0.29, 0.25, 0x1a1a1a, 'cil'],
    [0.08, 0.58, 0.08, 0, 0.29, -0.35, 0x1a1a1a, 'cil']
  ]},

  { id: 'cerezo', categoria: 'deco', nombre: 'Cerezo en flor', enTienda: false, rareza: 'legendario', ancho: 2, fondo: 2, piezas: [
    [0.45, 0.4, 0.45, 0, 0.2, 0, 0xd9b98c, 'cil'],
    [0.1, 0.9, 0.1, 0, 0.85, 0, 0x6b4f36, 'cil'],
    [0.05, 0.5, 0.05, 0.15, 1.2, 0, 0x6b4f36, 'cil', { rz: -0.7 }],
    [0.8, 0.6, 0.8, 0, 1.55, 0, 0xf6b8c8, 'esfera'],
    [0.5, 0.4, 0.5, 0.3, 1.4, 0.15, 0xf9cbd6, 'esfera'],
    [0.5, 0.4, 0.5, -0.3, 1.45, -0.1, 0xf3a6ba, 'esfera']
  ]},
  { id: 'ordenador', categoria: 'deco', nombre: 'Ordenador portátil', precio: 260, ancho: 1, fondo: 1, ordenador: true, piezas: [
    [0.36, 0.02, 0.26, 0, 0.01, 0.02, 0x9aa0a6, { metal: 0.4, rugosidad: 0.4 }],
    [0.34, 0.005, 0.22, 0, 0.022, 0.02, 0x3d3d3d],
    [0.36, 0.24, 0.015, 0, 0.13, -0.11, 0x9aa0a6, { rx: -0.2, metal: 0.4, rugosidad: 0.4 }],
    [0.32, 0.2, 0.005, 0, 0.13, -0.1, 0x223040, { rx: -0.2 }]
  ], encendible: { piezas: [3], brillo: 0x7fb8e8, luz: 0.25, intensidad: 0.6, colorLuz: 0x9fd0ff, inicial: false },
  colores: { grupos: [[0, 2]], paleta: [[0x9aa0a6], [0xf2b8c6], [0x3d3d3d], [0xd9c27a]] }},

  { id: 'huerto', categoria: 'deco', nombre: 'Huerto en jardinera', precio: 180, ancho: 2, fondo: 1, huerto: true, piezas: [
    [0.9, 0.3, 0.42, 0, 0.15, 0, 0x9c6b45],
    [0.84, 0.04, 0.36, 0, 0.29, 0, 0x5e4329],
    [0.7, 0.06, 0.2, 0, 0.33, 0, 0x7cc46a],
    [0.7, 0.22, 0.24, 0, 0.42, 0, 0x5a9e4b],
    [0.08, 0.08, 0.08, 0.2, 0.45, 0.06, 0xe05050, 'esfera']
  ], colores: { grupos: [[0]], paleta: [[0x9c6b45], [0xf2efe9], [0x7fa3c6], [0x6d4c3d]] }},

  { id: 'arbol-navidad', categoria: 'temporada', temporada: 'navidad', enTienda: false, nombre: 'Árbol de Navidad', precio: 220, ancho: 2, fondo: 2, piezas: [
    [0.3, 0.2, 0.3, 0, 0.1, 0, 0xc0504d, 'cil'],
    [0.08, 0.3, 0.08, 0, 0.3, 0, 0x6b4f36, 'cil'],
    [0.8, 0.6, 0.8, 0, 0.6, 0, 0x2f7d4a, 'cono'],
    [0.62, 0.5, 0.62, 0, 0.95, 0, 0x358a52, 'cono'],
    [0.42, 0.42, 0.42, 0, 1.25, 0, 0x3c9a5c, 'cono'],
    [0.12, 0.12, 0.04, 0, 1.5, 0, 0xffd23f, 'esfera', { brillo: true }],
    [0.06, 0.06, 0.06, 0.2, 0.7, 0.2, 0xe05050, 'esfera']
  ], encendible: { piezas: [5, 6], luz: 1.2, intensidad: 1.2, colorLuz: 0xffd890, inicial: true }},

  { id: 'muneco-nieve', categoria: 'temporada', temporada: 'navidad', enTienda: false, nombre: 'Muñeco de nieve', precio: 120, ancho: 1, fondo: 1, piezas: [
    [0.36, 0.34, 0.36, 0, 0.17, 0, 0xf4f8fb, 'esfera'],
    [0.26, 0.24, 0.26, 0, 0.44, 0, 0xf4f8fb, 'esfera'],
    [0.18, 0.18, 0.18, 0, 0.63, 0, 0xf4f8fb, 'esfera'],
    [0.03, 0.08, 0.03, 0, 0.64, 0.1, 0xf28a3c, 'cono', { rx: Math.PI / 2 }],
    [0.22, 0.04, 0.22, 0, 0.53, 0, 0xc0504d, 'cil'],
    [0.16, 0.12, 0.16, 0, 0.76, 0, 0x3d3d3d, 'cil']
  ], colores: { grupos: [[4]], paleta: [[0xc0504d], [0x5a9fd6], [0x6cc08a], [0xf2d06b]] }},

  { id: 'regalos', categoria: 'temporada', temporada: 'navidad', enTienda: false, nombre: 'Montón de regalos', precio: 90, ancho: 1, fondo: 1, soporte: 0.25, piezas: [
    [0.3, 0.25, 0.3, -0.05, 0.125, -0.03, 0xe05050],
    [0.2, 0.18, 0.2, 0.13, 0.09, 0.1, 0x5a9fd6],
    [0.16, 0.14, 0.16, -0.1, 0.32, -0.04, 0x6cc08a, { ry: 0.4 }]
  ]},

  { id: 'calabaza', categoria: 'temporada', temporada: 'halloween', enTienda: false, nombre: 'Calabaza con cara', precio: 110, ancho: 1, fondo: 1, piezas: [
    [0.42, 0.32, 0.42, 0, 0.16, 0, 0xf28a2c, 'esfera'],
    [0.04, 0.08, 0.04, 0, 0.35, 0, 0x5a7a3a, 'cil'],
    [0.2, 0.08, 0.02, 0, 0.16, 0.2, 0xffd060, { brillo: true }]
  ], encendible: { piezas: [2], luz: 0.2, intensidad: 1.0, colorLuz: 0xffa040, inicial: true }},

  { id: 'fantasma', categoria: 'temporada', temporada: 'halloween', enTienda: false, nombre: 'Fantasmita', precio: 130, ancho: 1, fondo: 1, piezas: [
    [0.32, 0.5, 0.32, 0, 0.3, 0, 0xf4f4f8, 'esfera'],
    [0.05, 0.07, 0.03, -0.06, 0.38, 0.14, 0x222222, 'esfera'],
    [0.05, 0.07, 0.03, 0.06, 0.38, 0.14, 0x222222, 'esfera']
  ]},

  { id: 'caldero', categoria: 'temporada', temporada: 'halloween', enTienda: false, nombre: 'Caldero burbujeante', precio: 150, ancho: 1, fondo: 1, piezas: [
    [0.4, 0.3, 0.4, 0, 0.18, 0, 0x2a2a2a, 'esfera'],
    [0.3, 0.02, 0.3, 0, 0.3, 0, 0x7ee05a, 'cil', { brillo: true }]
  ], encendible: { piezas: [1], luz: 0.4, intensidad: 0.9, colorLuz: 0x7ee05a, inicial: true }},

  { id: 'lampara-corazon', categoria: 'temporada', temporada: 'sanvalentin', enTienda: false, nombre: 'Lámpara corazón', precio: 140, ancho: 1, fondo: 1, piezas: [
    [0.2, 0.04, 0.2, 0, 0.02, 0, 0xf2efe9, 'cil'],
    [0.18, 0.18, 0.08, -0.06, 0.3, 0, 0xf06080, 'esfera'],
    [0.18, 0.18, 0.08, 0.06, 0.3, 0, 0xf06080, 'esfera'],
    [0.18, 0.18, 0.08, 0, 0.21, 0, 0xf06080, { rz: Math.PI / 4 }]
  ], encendible: { piezas: [1, 2, 3], luz: 0.3, intensidad: 1.0, colorLuz: 0xff7090, inicial: true }},

  { id: 'rosas', categoria: 'temporada', temporada: 'sanvalentin', enTienda: false, nombre: 'Ramo de rosas', precio: 90, ancho: 1, fondo: 1, piezas: [
    [0.14, 0.24, 0.14, 0, 0.12, 0, 0xe8f4f8, 'cil', { transparente: 0.6 }],
    [0.02, 0.2, 0.02, 0, 0.32, 0, 0x4a8a3c, 'cil'],
    [0.2, 0.12, 0.2, 0, 0.44, 0, 0xd02040, 'esfera']
  ]},

  { id: 'cojin-corazon', categoria: 'temporada', temporada: 'sanvalentin', enTienda: false, nombre: 'Cojín corazón', precio: 70, ancho: 1, fondo: 1, piezas: [
    [0.22, 0.2, 0.12, -0.08, 0.26, 0, 0xf06080, 'esfera'],
    [0.22, 0.2, 0.12, 0.08, 0.26, 0, 0xf06080, 'esfera'],
    [0.24, 0.24, 0.12, 0, 0.14, 0, 0xf06080, { rz: Math.PI / 4 }]
  ], colores: { grupos: [[0, 1, 2]], paleta: [[0xf06080], [0xe0505f], [0xf4b3be], [0xb39ddb]] }}
];

function pintura(id, nombre, color) {
  return {
    id, categoria: 'reparar', nombre, precio: 45, usos: 2, pinta: color, pista: 'Arrástrala hasta una pared',
    piezas: [
      [0.28, 0.26, 0.28, 0, 0.13, 0, 0xd0d0d0, 'cil', { metal: 0.4, rugosidad: 0.4 }],
      [0.29, 0.1, 0.29, 0, 0.13, 0, color, 'cil'],
      [0.26, 0.02, 0.26, 0, 0.27, 0, color, 'cil'],
      [0.03, 0.3, 0.03, 0.13, 0.4, 0.05, 0xb07a4f, 'cil', { rz: -0.4 }],
      [0.08, 0.08, 0.03, 0.07, 0.26, 0.05, color, { rz: -0.4 }]
    ]
  };
}

export const MATERIALES = [
  { id: 'insecticida', categoria: 'limpieza', nombre: 'Insecticida', precio: 35, usos: 4, limpia: 'bichos', pista: 'Arrástralo hasta los bichos (o a la habitación si hay cucarachas)', piezas: [
    [0.12, 0.3, 0.12, 0, 0.15, 0, 0x5ac8a8, 'cil'],
    [0.125, 0.1, 0.125, 0, 0.14, 0, 0xf0eae1, 'cil'],
    [0.08, 0.06, 0.08, 0, 0.33, 0, 0xf0eae1, 'cil'],
    [0.07, 0.03, 0.03, 0.04, 0.35, 0, 0xe05050]
  ]},
  { id: 'limpiador', categoria: 'limpieza', nombre: 'Fregona y cubo', precio: 15, usos: 6, limpia: 'barro', pista: 'Arrástralo hasta las manchas del suelo', piezas: [
    [0.3, 0.25, 0.3, 0, 0.125, 0, 0x5a9fd6, 'cil'],
    [0.26, 0.02, 0.26, 0, 0.24, 0, 0xc8e6f5, 'cil'],
    [0.03, 0.7, 0.03, 0.05, 0.5, 0, 0xd9b98c, 'cil', { rz: 0.2 }],
    [0.18, 0.08, 0.18, -0.02, 0.24, 0, 0xf2efe9, 'esfera']
  ]},
  { id: 'clavos', categoria: 'reparar', nombre: 'Martillo y clavos', precio: 25, pista: 'Arrástralo hasta la tabla levantada', piezas: [
    [0.05, 0.4, 0.05, 0, 0.2, 0, 0xb07a4f, 'cil'],
    [0.24, 0.07, 0.08, 0.03, 0.42, 0, 0x8c8c8c, { metal: 0.6, rugosidad: 0.3 }],
    [0.015, 0.1, 0.015, 0.15, 0.05, 0.06, 0xaaaaaa, 'cil'],
    [0.015, 0.1, 0.015, 0.19, 0.05, 0.0, 0xaaaaaa, 'cil']
  ]},
  { id: 'cristal', categoria: 'reparar', nombre: 'Cristal', precio: 90, pista: 'Arrástralo hasta la ventana rota', piezas: [
    [0.5, 0.6, 0.03, 0, 0.3, 0, 0xa9d4e8, { transparente: 0.75 }],
    [0.06, 0.4, 0.01, -0.1, 0.33, 0.02, 0xf0eae1, { rz: 0.5 }],
    [0.03, 0.2, 0.01, 0.05, 0.38, 0.02, 0xf0eae1, { rz: 0.5 }]
  ]},
  { id: 'masilla', categoria: 'reparar', nombre: 'Masilla', precio: 30, pista: 'Arrástrala hasta las grietas de la pared', piezas: [
    [0.28, 0.24, 0.28, 0, 0.12, 0, 0xf2efe9, 'cil'],
    [0.3, 0.03, 0.3, 0, 0.255, 0, 0xb0b0b0, 'cil'],
    [0.12, 0.01, 0.18, 0.1, 0.3, 0.05, 0x8c8c8c, { rx: 0.3, metal: 0.5 }]
  ]},
  { id: 'antihumedad', categoria: 'reparar', nombre: 'Antihumedad', precio: 35, pista: 'Arrástralo hasta las manchas de humedad', piezas: [
    [0.12, 0.32, 0.12, 0, 0.16, 0, 0x5a9fd6, 'cil'],
    [0.1, 0.08, 0.1, 0, 0.36, 0, 0xf0eae1, 'cil'],
    [0.06, 0.08, 0.02, 0, 0.17, 0.06, 0xf0eae1, 'esfera']
  ]},
  pintura('pintura-crema', 'Pintura crema', 0xf3eadb),
  pintura('pintura-rosa', 'Pintura rosa', 0xf6d5da),
  pintura('pintura-azul', 'Pintura azul', 0xd3e4f2),
  pintura('pintura-verde', 'Pintura verde', 0xd8ead2),
  pintura('pintura-amarilla', 'Pintura amarilla', 0xf7e7b5),
  pintura('pintura-lila', 'Pintura lila', 0xe2d7f0),
  { id: 'atrapapolvo', categoria: 'limpieza', nombre: 'Bayeta atrapapolvo', precio: 10, usos: 5, pista: 'Arrástrala hasta el polvo', limpia: 'polvo', piezas: [
    [0.34, 0.04, 0.26, 0, 0.02, 0, 0xf2d06b, { ry: 0.3 }],
    [0.34, 0.04, 0.26, 0.02, 0.06, 0.01, 0x7fa3c6, { ry: -0.2 }],
    [0.2, 0.06, 0.2, 0.05, 0.1, 0.03, 0xf0eae1, 'esfera']
  ]},
  { id: 'plumero', categoria: 'limpieza', nombre: 'Plumero', precio: 12, usos: 6, pista: 'Arrástralo hasta las telarañas', limpia: 'telarana', piezas: [
    [0.03, 0.45, 0.03, 0, 0.22, 0, 0xb07a4f, 'cil'],
    [0.2, 0.26, 0.2, 0, 0.55, 0, 0xf4b3be, 'esfera'],
    [0.16, 0.2, 0.16, 0.06, 0.6, 0.04, 0xf2d06b, 'esfera']
  ]},
  { id: 'bolsitas', categoria: 'limpieza', nombre: 'Bolsitas para cacas', precio: 10, usos: 10, pista: 'Arrástralas hasta la caca', limpia: 'caca', piezas: [
    [0.14, 0.24, 0.14, 0, 0.12, 0, 0x6cc08a, 'cil'],
    [0.15, 0.04, 0.15, 0, 0.25, 0, 0x4e9d6b, 'cil'],
    [0.12, 0.14, 0.02, 0.1, 0.1, 0.06, 0xa8e0b8, { rz: 0.3 }]
  ]},
  { id: 'servicio-limpieza', categoria: 'limpieza', nombre: 'Robot de limpieza (3 días)', precio: 350, servicio: 'limpiadora', pista: 'Robi, un robot de limpieza, vendrá a dejar la casa reluciente cada poco rato durante 3 días', piezas: [
    [0.5, 0.12, 0.5, 0, 0.06, 0, 0x5ac8b8, 'cil'],
    [0.42, 0.4, 0.42, 0, 0.32, 0, 0xdfe8ee, 'cil', { metal: 0.3, rugosidad: 0.35 }],
    [0.48, 0.34, 0.38, 0, 0.7, 0, 0xdfe8ee, { metal: 0.3, rugosidad: 0.35 }],
    [0.38, 0.22, 0.02, 0, 0.7, 0.195, 0x223a40],
    [0.07, 0.09, 0.02, -0.08, 0.72, 0.21, 0x7ff0d8, 'esfera', { brillo: true }],
    [0.07, 0.09, 0.02, 0.08, 0.72, 0.21, 0x7ff0d8, 'esfera', { brillo: true }],
    [0.02, 0.14, 0.02, 0, 0.94, 0, 0xdfe8ee, 'cil'],
    [0.08, 0.08, 0.08, 0, 1.03, 0, 0xf4b3be, 'esfera']
  ]},
  { id: 'jardin', categoria: 'limpieza', nombre: 'Jardín para el perro', precio: 800, servicio: 'jardin', pista: 'Un trocito de césped junto a la casa: los perros harán ahí sus cosas', piezas: [
    [0.9, 0.1, 0.9, 0, 0.05, 0, 0x8a6a4a],
    [0.88, 0.04, 0.88, 0, 0.12, 0, 0x7cc46a],
    [0.04, 0.22, 0.9, -0.43, 0.24, 0, 0xf0eae1],
    [0.9, 0.22, 0.04, 0, 0.24, -0.43, 0xf0eae1],
    [0.08, 0.08, 0.08, 0.2, 0.18, 0.2, 0xf28aa0, 'esfera'],
    [0.07, 0.07, 0.07, 0.28, 0.17, 0.1, 0xf7e07a, 'esfera'],
    [0.3, 0.3, 0.3, -0.15, 0.3, -0.15, 0x5a9e4b, 'esfera']
  ]},
  { id: 'pienso', categoria: 'mascotas', nombre: 'Comida para mascotas', precio: 20, usos: 5, pista: 'Toca a tu mascota y dale de comer', piezas: [
    [0.3, 0.4, 0.15, 0, 0.2, 0, 0xd9a05a],
    [0.2, 0.15, 0.01, 0, 0.22, 0.08, 0xf0eae1],
    [0.08, 0.05, 0.02, 0, 0.22, 0.09, 0xc0504d, 'esfera']
  ]},
  { id: 'chuches', categoria: 'mascotas', nombre: 'Chuches', precio: 15, usos: 6, pista: 'Toca a tu mascota y dale un premio', piezas: [
    [0.22, 0.25, 0.22, 0, 0.125, 0, 0xe8f4f8, 'cil', { transparente: 0.55 }],
    [0.24, 0.05, 0.24, 0, 0.27, 0, 0xe58f9e, 'cil'],
    [0.07, 0.07, 0.07, -0.04, 0.06, 0.03, 0xf2d06b, 'esfera'],
    [0.07, 0.07, 0.07, 0.04, 0.07, -0.02, 0xe05050, 'esfera'],
    [0.07, 0.07, 0.07, 0.01, 0.13, 0.03, 0x6cc08a, 'esfera'],
    [0.07, 0.07, 0.07, -0.03, 0.15, -0.04, 0x5a9fd6, 'esfera']
  ]},
  { id: 'vale-zorro', categoria: 'mascotas', nombre: 'Zorrito', enTienda: false, rareza: 'legendario', mascota: 'zorro', pista: 'Tócalo para darle la bienvenida a casa' },
  { id: 'vale-pinguino', categoria: 'mascotas', nombre: 'Pingüino', enTienda: false, rareza: 'epico', mascota: 'pinguino', pista: 'Tócalo para darle la bienvenida a casa' }
];

export function infoItem(id) {
  const mueble = CATALOGO.find(d => d.id === id);
  if (mueble) return { ...mueble, tipo: 'mueble' };
  const material = MATERIALES.find(d => d.id === id);
  return material ? { ...material, tipo: 'material' } : null;
}

export function precioVenta(info) {
  const base = info.precio ?? PRECIO_RAREZA[info.rareza] ?? 0;
  return Math.floor(base / 2);
}
