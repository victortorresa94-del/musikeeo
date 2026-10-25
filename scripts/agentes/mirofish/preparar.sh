#!/usr/bin/env bash
# Instala MiroFish (github.com/666ghj/MiroFish, AGPL-3.0) FUERA del repo de Musikeeo y lo
# deja listo para simular la escena de Barcelona. No se copia su código aquí: es una
# herramienta aparte (su licencia AGPL obliga a publicar el código si se sirviera a usuarios).
#
#   LLM_API_KEY=… ZEP_API_KEY=… bash scripts/agentes/mirofish/preparar.sh
#
# LLM: cualquier API con formato OpenAI. Por defecto Kimi (Moonshot), la misma que Rodrigo.
# ZEP: memoria de los agentes, plan gratis en https://app.getzep.com
set -euo pipefail
DESTINO="${MIROFISH_DIR:-$HOME/mirofish}"
AQUI="$(cd "$(dirname "$0")" && pwd)"

[ -n "${LLM_API_KEY:-}" ] || { echo "Falta LLM_API_KEY (clave de Kimi u otra con formato OpenAI)"; exit 1; }
[ -n "${ZEP_API_KEY:-}" ] || { echo "Falta ZEP_API_KEY (gratis en https://app.getzep.com)"; exit 1; }
command -v uv >/dev/null || { echo "Falta uv: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }

if [ ! -d "$DESTINO/.git" ]; then
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/666ghj/MiroFish "$DESTINO"
fi
cd "$DESTINO"

cat > .env <<ENV
LLM_API_KEY=${LLM_API_KEY}
LLM_BASE_URL=${LLM_BASE_URL:-https://api.moonshot.ai/v1}
LLM_MODEL_NAME=${LLM_MODEL:-kimi-k2-turbo-preview}
ZEP_API_KEY=${ZEP_API_KEY}
OASIS_DEFAULT_MAX_ROUNDS=${MIROFISH_RONDAS:-20}
ENV

(cd backend && uv python install 3.12 >/dev/null && uv sync --python 3.12)
npm install --no-audit --no-fund >/dev/null && (cd frontend && npm install --no-audit --no-fund >/dev/null)

mkdir -p semillas && cp "$AQUI/semilla-musikeeo.md" "$AQUI/requisito.md" semillas/
cat <<FIN

MiroFish listo en $DESTINO
  Arrancar:  cd $DESTINO && npm run dev     → http://localhost:3000 (API en :5001)
  En la web: idioma Español, sube semillas/semilla-musikeeo.md y pega semillas/requisito.md
             como lo que quieres predecir. Empieza con pocas rondas (20): gasta tokens.
  Después, los agentes que haya inventado MiroFish pueden usar el Feed de Musikeeo:
    node scripts/agentes/simular-feed.ts --mirofish=$DESTINO/backend/uploads/simulations/<id>/reddit_profiles.json
    node scripts/agentes/red-social.ts --mirofish=$DESTINO/backend/uploads/simulations/<id>/reddit_profiles.json
FIN
