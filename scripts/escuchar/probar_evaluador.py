#!/usr/bin/env python3
"""Prueba de cordura de evaluar.py. Crea en <salida>/ tres juegos de estimaciones
y evalúa cada uno:
  referencia/  las propias referencias (+ tempo, tono, secciones y pulsos reales) -> 1.0
  todo_N/      un solo tramo N por fichero, tempo x2, tono "C:maj", sin secciones -> ~0
  linea_base/  plantillas de croma ingenuas (verificar_croma.py --estimar)
Uso: python3 probar_evaluador.py <salida>
"""
import glob
import json
import os
import shutil
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))


def main():
    salida = sys.argv[1]
    with open(os.path.join(AQUI, 'manifest.json')) as f:
        man = json.load(f)
    ref, todo_n = os.path.join(salida, 'referencia'), os.path.join(salida, 'todo_N')
    for e in man['files']:
        sub, nombre = e['path'][:-4].split('/')
        for d in (ref, todo_n):
            os.makedirs(os.path.join(d, sub), exist_ok=True)
        shutil.copy(os.path.join(AQUI, e['lab']), os.path.join(ref, sub, nombre + '.lab'))
        for ext in ('.secciones.lab', '.beats.txt'):
            if os.path.exists(os.path.join(AQUI, sub, nombre + ext)):
                shutil.copy(os.path.join(AQUI, sub, nombre + ext), os.path.join(ref, sub, nombre + ext))
        if e.get('tempo'):
            with open(os.path.join(ref, sub, nombre + '.tempo.txt'), 'w') as f:
                f.write(f"{e['tempo']}\n")
            with open(os.path.join(todo_n, sub, nombre + '.tempo.txt'), 'w') as f:
                f.write(f"{2 * e['tempo']}\n")
        if e.get('key'):
            with open(os.path.join(ref, sub, nombre + '.tono.txt'), 'w') as f:
                f.write(e['key'] + '\n')
            with open(os.path.join(todo_n, sub, nombre + '.tono.txt'), 'w') as f:
                f.write('C:maj\n')
        with open(os.path.join(todo_n, sub, nombre + '.lab'), 'w') as f:
            f.write(f"0.000000\t{e['duration']:.6f}\tN\n")
    base = os.path.join(salida, 'linea_base')
    subprocess.run([sys.executable, os.path.join(AQUI, 'verificar_croma.py'), '--estimar', base], check=True)
    for d in (ref, todo_n, base):
        print(f'\n===== {os.path.basename(d)} =====', flush=True)
        subprocess.run([sys.executable, os.path.join(AQUI, 'evaluar.py'), d], check=True)


if __name__ == '__main__':
    main()
