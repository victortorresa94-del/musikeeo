// Pantallas con su propia barra abajo (la canción del Cancionero): ahí no va la barra de la app,
// para que nunca haya dos barras apiladas
const PROPIAS = /^\/cancionero\/(?!nueva$|escuchar$|repertorio\/)[^/]+$/;
export const conBarraPropia = (pathname: string) => PROPIAS.test(pathname);
