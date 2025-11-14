#!/usr/bin/env bash
set -euo pipefail
if [[ $# -eq 0 ]]; then
  echo "Uso: savegametoys \"mensaje\"" >&2
  exit 1
fi
REPO_ROOT="/Users/H/Downloads/Proyectos/LosTOYS"
LOG_DIR="${REPO_ROOT}/logs"
TREE_FILE="${LOG_DIR}/tree-latest.txt"
LOG_FILE="${LOG_DIR}/bitacora.md"
BRANCH="${SAVEGAMETOYS_BRANCH:-main}"
IGNORE_PATTERN=".git|node_modules|venv|.next|__pycache__"
if ! command -v tree >/dev/null 2>&1; then
  echo "Error: instala 'tree'" >&2
  exit 1
fi
cd "${REPO_ROOT}"
mkdir -p "${LOG_DIR}"
tree -a -I "${IGNORE_PATTERN}" > "${TREE_FILE}"
{
  echo "## $(date '+%Y-%m-%d %H:%M:%S %Z') - $*"
  git status -sb
  echo
} >> "${LOG_FILE}"
git add -A
git commit -m "$*"
git push origin "${BRANCH}"
echo "Cambios guardados en origin/${BRANCH}."
