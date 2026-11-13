// Lo que comparten las piezas del catálogo (colores, iconos, valores), sin componentes
import { CheckSquare, Hash, Tags, Type } from 'lucide-react';
import { opcionesDe, type CampoFiltro } from '../../lib/biblioteca';
import { catalogoService, claveAspecto, type TipoCampo, type TipoValor } from '../../services/catalogoService';
import type { Cancion } from '../../types/cancionero';
import { estiloBloque, pastelDe, pastelGrupo, pastelValor } from './estilo';

export type PestanaCatalogo = TipoValor | 'columnas';
export const CAMPO_FILTRO: Record<TipoValor, CampoFiltro> = { grupo: 'proyectos', estilo: 'estilos', etiqueta: 'etiquetas', canta: 'canta' };
export const ICONO_TIPO: Record<TipoCampo, typeof Hash> = { casilla: CheckSquare, etiqueta: Tags, numero: Hash, texto: Type };

// Los iconos de la app que se pueden poner a un grupo
export const ICONOS_APP = [
    '/images/cancionero/micro.webp', '/images/cancionero/rumba.webp', '/images/cancionero/pop.webp', '/images/cancionero/latino.webp',
    '/images/cancionero/repertorios.webp', '/images/cancionero/claqueta.webp', '/images/cancionero/escuchar.webp', '/images/cancionero/dame-el-tono.webp',
    '/images/categorias/guitarras.webp', '/images/categorias/bateria.webp', '/images/categorias/teclados.webp', '/images/categorias/cuerdas.webp',
    '/images/categorias/bandas.webp', '/images/categorias/musicos.webp', '/images/categorias/djs.webp', '/images/categorias/salas.webp',
    '/images/categorias/altavoces.webp', '/images/categorias/momento-boda-3d.webp',
];

// El color con que se pinta un valor (el elegido o el de siempre)
export function pastelDeValor(tipo: TipoValor, valor: string) {
    if (tipo === 'grupo') return pastelGrupo(valor);
    if (tipo === 'estilo') return estiloBloque(valor).pastel;
    return pastelValor(tipo, valor) ?? pastelDe(claveAspecto(tipo, valor));
}

// Los valores de un tipo: los de las canciones (con cuántas) y los creados aquí
export function valoresDeTipo(canciones: Cancion[], tipo: TipoValor): { valor: string; n: number }[] {
    const lista = opcionesDe(canciones, CAMPO_FILTRO[tipo], () => null).map(o => ({ valor: o.valor, n: o.n }));
    for (const v of catalogoService.valores(tipo)) if (!lista.some(x => norm(x.valor) === norm(v))) lista.push({ valor: v, n: 0 });
    return lista;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
