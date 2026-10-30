#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
template="$root/contrib/aur/PKGBUILD.template"
pkgver="$(node -p "require('$root/package.json').version")"

repo_url="$(git -C "$root" remote get-url origin)"
repo_url="${repo_url#git@}"
case "$repo_url" in
  *github.com/*) repo="${repo_url#*github.com/}" ;;
  github.com:*)   repo="${repo_url#github.com:}" ;;
  *) echo "error: origin is not a GitHub remote: $repo_url" >&2; exit 1 ;;
esac
repo="${repo%.git}"
source_url="https://github.com/$repo/archive/v$pkgver.tar.gz"

sha256="$(curl -fsSL "$source_url" | sha256sum | cut -d' ' -f1)"

make_makedepends() {
  printf "makedepends=(\n  'nodejs'\n  'pnpm'\n  'python'\n)\n"
}

build_fn() {
  printf 'build() {\n  cd "$srcdir/$pkgname-$pkgver"\n\n  pnpm install --frozen-lockfile --ignore-scripts\n  pnpm rebuild cpu-features esbuild ssh2\n  pnpm build\n}\n\n'
}

emit() {
  local out="$1" name="$2" suffix="$3" sha="$4" makedeps="$5" build="$6" tmp
  sed -e "s|__PKGNAME__|$name|" \
      -e "s|__PKGVER__|$pkgver|" \
      -e "s|__SUFFIX__|$suffix|" \
      -e "s|__REPO__|$repo|" \
      -e "s|__SHA256__|$sha|" \
      -e "/^__MAKEDEPENDS__$/d" \
      -e "/^__BUILD__$/d" \
      "$template" >"$out"
  if [ -n "$makedeps" ]; then
    tmp="$out.tmp"
    awk -v mk="$makedeps" 'BEGIN{f=0} /^optdepends=\($/{if(!f){print mk; f=1}} {print}' "$out" >"$tmp" && mv "$tmp" "$out"
  fi
  if [ -n "$build" ]; then
    tmp="$out.tmp"
    awk -v b="$build" 'BEGIN{f=0} /^package\(\) \{$/{if(!f){print b; print ""; f=1}} {print}' "$out" >"$tmp" && mv "$tmp" "$out"
  fi
}

emit "$root/contrib/aur/PKGBUILD" "chest-backup" "" "$sha256" "$(make_makedepends)" "$(build_fn)"
emit "$root/contrib/aur-bin/PKGBUILD" "chest-backup-bin" " (precompiled)" "SKIP" "" ""

cp "$root/contrib/aur/chest-backup.install" "$root/contrib/aur-bin/chest-backup.install"
