#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
SOURCE_FONT="${1:-${XIAOLAI_FONT_PATH:-}}"
OUTPUT_FONT="${2:-${PROJECT_DIR}/public/fonts/cantopop.woff2}"

# Space, 0-9, A-Z, a-z, 圖, 地.
UNICODES="U+0020,U+0030-0039,U+0041-005A,U+0061-007A,U+5716,U+5730"

if [[ -z "${SOURCE_FONT}" ]]; then
  printf 'Usage: npm run font:generate -- /path/to/XiaolaiSC-Regular.ttf\n' >&2
  printf 'Alternatively, set XIAOLAI_FONT_PATH.\n' >&2
  exit 1
fi

if [[ ! -f "${SOURCE_FONT}" ]]; then
  printf 'Xiaolai source font not found: %s\n' "${SOURCE_FONT}" >&2
  exit 1
fi

if ! command -v pyftsubset >/dev/null 2>&1; then
  printf 'pyftsubset is required. Install it with: pipx install fonttools[woff]\n' >&2
  exit 1
fi

mkdir -p "$(dirname -- "${OUTPUT_FONT}")"
TEMP_FONT="$(mktemp "${OUTPUT_FONT}.tmp.XXXXXX")"
trap 'rm -f "${TEMP_FONT}"' EXIT

pyftsubset "${SOURCE_FONT}" \
  --output-file="${TEMP_FONT}" \
  --flavor=woff2 \
  --unicodes="${UNICODES}" \
  --layout-features='*' \
  --no-hinting \
  --notdef-glyph \
  --notdef-outline \
  --recommended-glyphs \
  --name-IDs='0,1,2,3,4,5,6' \
  --name-languages='*' \
  --name-legacy \
  --drop-tables+=DSIG

mv "${TEMP_FONT}" "${OUTPUT_FONT}"
chmod 0644 "${OUTPUT_FONT}"
trap - EXIT

FONT_SIZE="$(wc -c < "${OUTPUT_FONT}" | tr -d ' ')"
printf 'Generated %s (%s bytes)\n' "${OUTPUT_FONT}" "${FONT_SIZE}"
printf 'Included: space, A-Z, a-z, 0-9, 地, 圖\n'
