// Pantallas con su propia barra abajo (la canción del Cancionero, y su editor con «Guardar»): ahí no va la barra de la app,
// para que nunca haya dos barras apiladas
const PROPIAS = /^\/cancionero\/(?:nueva|[^/]+\/editar|(?!escuchar$|repertorio$)[^/]+)$/;
export const conBarraPropia = (pathname: string) => PROPIAS.test(pathname);
