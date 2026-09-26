#!/usr/bin/env bash
# Local build on Arch: release binary, tarball, then the pacman package from that tarball.
# Pass --install to install it with pacman.
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci
npx tauri build --no-bundle
tarball=$(packaging/build-linux-tarball.sh "${GOALLADDER_BIN:-src-tauri/target/release/goalladder}")
ver=$(node -p "require('./package.json').version")
# makepkg uses a source file already in the PKGBUILD folder instead of downloading it
cp "$tarball" "packaging/arch/GoalLadder-${ver}-x86_64.tar.gz"
cd packaging/arch
makepkg -f --noconfirm
pkg=$(ls -t goalladder-bin-*.pkg.tar.zst | head -1)
echo "Built packaging/arch/$pkg"
if [ "${1:-}" = "--install" ]; then
  sudo pacman -U --noconfirm "$pkg"
fi
