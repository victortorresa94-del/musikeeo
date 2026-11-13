// La pantalla de editar la canción y el editor de sus notas van cada uno en su trozo de código.
// Se piden al abrir una canción, cuando el móvil está libre. Así, aunque mientras tanto se publique
// otra versión de la app (y con ella desaparezcan del servidor y de la caché los trozos de la que
// tienes abierta), «Editar» y el lápiz de la ficha abren sin ir a buscar nada fuera. Sin esto, al
// tocarlos la pantalla pedía un trozo que ya no existe y la app se recargaba entera (13-nov,
// Víctor: «le daba la ficha editar y se ha caído por completo»)
let pedido = false;

export function precargarEditarCancion() {
    if (pedido) return;
    pedido = true;
    const cargar = () => {
        import('../../pages/cancionero/EditarCancion').catch(() => { pedido = false; });
        import('../notas/EditorNotas').catch(() => { /* la pantalla se defiende sola si falta */ });
    };
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
    if (ric) ric(cargar); else setTimeout(cargar, 1500);
}
