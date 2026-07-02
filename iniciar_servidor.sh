#!/bin/bash
# ════════════════════════════════════════════════════════
#  Servidor local para Estacionamiento El Paso — PWA
#  Uso: bash iniciar_servidor.sh
# ════════════════════════════════════════════════════════

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8080
IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      Estacionamiento El Paso — PWA           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Servidor listo en el puerto $PORT"
echo ""
if [ -n "$IP" ]; then
  echo "  📱 Desde tu CELULAR (misma red WiFi):"
  echo "     http://$IP:$PORT"
  echo ""
fi
echo "  💻 Desde este equipo:"
echo "     http://localhost:$PORT"
echo ""
echo "  ──────────────────────────────────────────"
echo "  Android Chrome:  Abre la URL"
echo "                   → menú ⋮ → 'Añadir a pantalla de inicio'"
echo ""
echo "  iPhone Safari:   Abre la URL"
echo "                   → ícono compartir □↑ → 'Añadir a inicio'"
echo "  ──────────────────────────────────────────"
echo ""
echo "  Ctrl+C para detener el servidor"
echo ""

cd "$DIR"

# Usar Python 3 si está disponible, sino Python 2
if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT
elif command -v python &>/dev/null; then
  python -m SimpleHTTPServer $PORT
else
  echo "ERROR: Python no encontrado. Instala Python 3."
  exit 1
fi
