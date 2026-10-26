// La ubicación del móvil, una vez y en memoria. Para el mapa de musikeers solo sale de aquí la
// celda del geohash (lib/geohash): la latitud y la longitud no se guardan ni se envían.

export interface Posicion { lat: number; lng: number }

export class FalloUbicacion extends Error {
    readonly sinPermiso: boolean;
    constructor(mensaje: string, sinPermiso: boolean) {
        super(mensaje);
        this.sinPermiso = sinPermiso;
    }
}

export function pedirUbicacion(opciones: { espera?: number; vieja?: number } = {}): Promise<Posicion> {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new FalloUbicacion('Este navegador no sabe dónde estás. Elige la zona en el mapa.', false));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            e => reject(e.code === e.PERMISSION_DENIED
                ? new FalloUbicacion('Sin permiso para tu ubicación. Actívalo en los ajustes del navegador o elige la zona en el mapa.', true)
                : new FalloUbicacion('No hemos podido saber dónde estás. Prueba otra vez o elige la zona en el mapa.', false)),
            // Para una zona de ~1 km no hace falta el GPS fino: así contesta enseguida
            { enableHighAccuracy: false, timeout: opciones.espera ?? 12000, maximumAge: opciones.vieja ?? 60000 },
        );
    });
}
