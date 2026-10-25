// ¿Se están pasando el contacto para cerrar el bolo por fuera? Detecta teléfonos, emails y
// «WhatsApp» en un mensaje del chat. Solo sirve para AVISAR (nunca bloquea): el bolo se
// cierra mejor con una propuesta dentro de Musikeeo. Sin React, para poder probarlo aparte.

// Móviles y fijos de España: 9 cifras que empiezan por 6, 7, 8 o 9, juntas o en grupos
// (612 345 678, 612-34-56-78, +34 612345678). Un precio («600 €») o una fecha no casan.
const TELEFONO = /(?:^|[^\d])(?:\+?34[\s.-]?)?[6789]\d{2}(?:[\s.-]?\d{3}[\s.-]?\d{3}|[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})(?!\d)/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PALABRAS = /(?:^|[^a-záéíóúñ])(whats\s?app|wasap|wassap|guasap|wsp|wpp|telegram|mi\s+(?:n[uú]mero|m[oó]vil|tel[eé]fono)|ll[aá]mame|te\s+llamo)(?![a-záéíóúñ])/i;

export function tieneContacto(texto: string): boolean {
    if (!texto) return false;
    return TELEFONO.test(texto) || EMAIL.test(texto) || PALABRAS.test(texto);
}
