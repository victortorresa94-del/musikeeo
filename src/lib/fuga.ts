// ¿Se están pasando el contacto para cerrar el bolo por fuera? Detecta teléfonos, emails y
// «WhatsApp» en un mensaje del chat, y los TAPA antes de enviarlo hasta que se acepta una
// propuesta de bolo en ese chat (como Airbnb hasta confirmar la reserva). Se hace en el
// dispositivo: el texto original no se guarda ni se manda a ningún sitio. Sin React.

// Móviles y fijos de España: 9 cifras que empiezan por 6, 7, 8 o 9, juntas o en grupos
// (612 345 678, 612-34-56-78, +34 612345678, 93 412 34 56). Un precio («600 €») o una fecha no casan.
const NUM_ES = String.raw`(?:\+?34[\s.-]?)?(?:[6789]\d{2}(?:[\s.-]?\d{3}[\s.-]?\d{3}|[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})|[6789]\d[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})`;
// Otros países: «+» y al menos 8 cifras (+33 6 12 34 56 78, +44 7911 123456)
const NUM_INTL = String.raw`\+\d{1,3}(?:[\s.-]?\d){7,12}`;
const TELEFONO = new RegExp(String.raw`(^|[^\d+])(${NUM_ES}|${NUM_INTL})(?!\d)`);
const TELEFONO_G = new RegExp(TELEFONO.source, 'g');
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const EMAIL_G = /[^\s@<>()[\]]+@[^\s@<>()[\]]+\.[a-z]{2,}/gi;
// Enlaces que abren un chat fuera: wa.me, api/chat.whatsapp.com, t.me, telegram.me, m.me
const ENLACE_G = /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|(?:api|chat|web)\.whatsapp\.com|t\.me|telegram\.(?:me|dog)|m\.me)\/\S*/gi;
const PALABRAS = /(?:^|[^a-záéíóúñ])(whats\s?app|wasap|wassap|guasap|wsp|wpp|telegram|mi\s+(?:n[uú]mero|m[oó]vil|tel[eé]fono)|ll[aá]mame|te\s+llamo)(?![a-záéíóúñ])/i;

export const OCULTO = { telefono: '[teléfono oculto]', email: '[email oculto]', enlace: '[enlace oculto]' };

export function tieneContacto(texto: string): boolean {
    if (!texto) return false;
    return TELEFONO.test(texto) || EMAIL.test(texto) || PALABRAS.test(texto) || new RegExp(ENLACE_G.source, 'i').test(texto);
}

// Tapa teléfonos, emails y enlaces de mensajería. La palabra «WhatsApp» sola no se tapa
// (no da el contacto): solo sale el aviso.
export function taparContacto(texto: string): { texto: string; tapado: boolean } {
    if (!texto) return { texto, tapado: false };
    const salida = texto
        .replace(ENLACE_G, OCULTO.enlace)
        .replace(EMAIL_G, OCULTO.email)
        .replace(TELEFONO_G, (_m, antes: string) => `${antes}${OCULTO.telefono}`);
    return { texto: salida, tapado: salida !== texto };
}
