#!/usr/bin/env bash
# Packs a binary, desktop entry, icons and licence into a tarball for the Arch PKGBUILD
# and for anyone who wants to install by hand.
# Usage: build-linux-tarball.sh [binary]   (defaults to the local release build)
# For release uploads pass the binary from the Ubuntu 22.04 .deb, which runs on older glibc.
set -euo pipefail
cd "$(dirname "$0")/.."
bin=${1:-src-tauri/target/release/goalladder}
ver=$(node -p "require('./package.json').version")
name="GoalLadder-${ver}"
out="src-tauri/target/release/bundle/tarball"
rm -rf "${out:?}/$name"; mkdir -p "$out/$name/icons"
install -m755 "$bin" "$out/$name/goalladder"
cp packaging/goalladder.desktop LICENSE "$out/$name/"
for s in 32 64 128 256; do cp "src-tauri/icons/${s}x${s}.png" "$out/$name/icons/"; done
cp packaging/icon.svg "$out/$name/icons/goalladder.svg"
tar -C "$out" -czf "$out/${name}-linux-x86_64.tar.gz" "$name"
echo "$out/${name}-linux-x86_64.tar.gz"
