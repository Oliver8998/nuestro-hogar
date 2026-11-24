export const MULT_PRECIO = 3;
export const MULT_GANANCIA = 0.5;

export function caro(n) {
  return Math.round(n * MULT_PRECIO);
}

export function paga(n) {
  return n > 0 ? Math.max(1, Math.round(n * MULT_GANANCIA)) : n;
}

export function encarecer(lista) {
  for (const x of lista) if (x && typeof x.precio === 'number') x.precio = caro(x.precio);
  return lista;
}
