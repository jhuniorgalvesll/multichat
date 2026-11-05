#!/usr/bin/env sh
set -eu
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
OUT="$DIR/fertisem-checkout-lite-v1.6.19-public-sanitized.zip"
cat "$DIR"/parts/fertisem-checkout-lite-v1.6.19-public-sanitized.zip.part-* > "$OUT"
echo "ZIP reconstruido: $OUT"
echo "SHA-256 esperado: fc59b971e63b901b6409b0367acab4cea4b0e8405a411923a6af11aec31dd0d7"
