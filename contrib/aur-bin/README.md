# chest-backup-bin — AUR package (precompiled)

Precompiled variant of `chest-backup`. Ships the built API bundle and web assets
from the GitHub release — no build step, installs in seconds. Requires only
`bun` at runtime.

## Prerequisites

- A GitHub release tag (e.g. `v1.0.0`) pushed to the repository
- An Arch Linux system with an AUR account (ssh key registered)
- No `base-devel` required for users installing the package

## Publishing workflow

### 1. Tag the release

```bash
pnpm run release:patch
# or manually:
git tag -s v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

The PKGBUILD downloads the tagged tarball from GitHub.

### 2. Create the AUR repository

```bash
ssh aur@aur.archlinux.org setup-repository chest-backup-bin
git clone aur@aur.archlinux.org:chest-backup-bin.git
cd chest-backup-bin
```

### 3. Copy PKGBUILD and generate .SRCINFO

```bash
cp /path/to/chest-backup/contrib/aur-bin/PKGBUILD .
cp /path/to/chest-backup/contrib/aur-bin/chest-backup.install .
makepkg --printsrcinfo > .SRCINFO
```

### 4. Verify, commit, and push

```bash
namcap PKGBUILD
makepkg -si
git add PKGBUILD .SRCINFO chest-backup.install
git commit -m "chest-backup-bin v1.0.0"
git push origin master
```

## Install from AUR

```bash
paru -S chest-backup-bin
```

## Post-install setup

Config is stored per-user in `~/.config/chest-backup/`:

```bash
nano ~/.config/chest-backup/chest-backup.json
nano ~/.config/chest-backup/.env
```

The user service is enabled and started automatically on install, and linger is
enabled so scheduled backups run at boot without a login.

1. Open the web UI at http://localhost:5199 and manage sources, destinations,
   and schedule from there — no manual editing required.
2. After upgrading an existing install, restart the service to pick up the new
   config location:
   `systemctl --user restart chest-backup`

> Defaults are seeded into `~/.config/chest-backup/` on first install and are
> never overwritten on upgrade.

## Notes

- The API server is always started (required for the web UI and daemon); the backup daemon runs inside it.
- Requires the same GitHub tag as `chest-backup`; both packages can be installed side by side only if you change one of the service names, since they share `/usr/bin/chest-backup`.
