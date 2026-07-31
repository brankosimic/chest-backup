# chest-backup — AUR package

## Prerequisites

- A GitHub release tag (e.g. `v1.0.0`) pushed to the repository
- An Arch Linux system with `base-devel` installed
- An AUR account (ssh key registered)

## Publishing workflow

### 1. Tag the release

```bash
# Bumps version (1.0.0 → 1.0.1), creates commit + signed tag, pushes
pnpm run release:patch

# Or manually:
# git tag -s v1.0.0 -m "v1.0.0"
# git push origin v1.0.0
```

The PKGBUILD downloads the tagged tarball from GitHub.

### 2. Create the AUR repository

```bash
# On the AUR server (one-time setup)
ssh aur@aur.archlinux.org setup-repository chest-backup

# Clone the AUR repo locally
git clone aur@aur.archlinux.org:chest-backup.git
cd chest-backup
```

### 3. Copy PKGBUILD and generate .SRCINFO

```bash
cp /path/to/chest-backup/contrib/aur/PKGBUILD .
makepkg --printsrcinfo > .SRCINFO
```

### 4. Verify, commit, and push

```bash
# Verify the PKGBUILD is valid
namcap PKGBUILD

# Test a local build (optional)
makepkg -si

# Commit and push to AUR
git add PKGBUILD .SRCINFO
git commit -m "chest-backup v0.0.0"
git push origin master
```

### 5. Install from AUR

Users install with their preferred AUR helper:

```bash
# paru / yay (CachyOS)
paru -S chest-backup

# Manual
git clone https://aur.archlinux.org/chest-backup.git
cd chest-backup
makepkg -si
```

## Post-install setup

Config is stored per-user in `~/.config/chest-backup/` (the service runs as a
user unit, so `/etc` would not be writable):

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
> never overwritten on upgrade. If you were on a pre-0.1.7 package, any config
> in `/etc/chest-backup/` is migrated to `~/.config/chest-backup/` automatically.

## Notes

- The API server is always started (required for the web UI and daemon).
- The system tray icon starts automatically when a desktop session (X11/Wayland) is detected.
- If running headless (no desktop), the daemon runs inside the API process — no tray needed.
