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

1. Edit the default config to match your sources and destinations:

```bash
sudo nano /etc/chest-backup/chest-backup.json
```

2. Optionally set secrets in the env file:

```bash
sudo nano /etc/chest-backup/.env
```

3. Enable and start the user service:

```bash
systemctl --user daemon-reload
systemctl --user enable --now chest-backup
```

4. Open the web UI at http://localhost:5199

> Default configs are shipped to `/etc/chest-backup/` on install. On package
> upgrades, pacman preserves your edits and saves new defaults as `.pacnew`
> files — safe to update without losing settings.

## Notes

- The API server is always started (required for the web UI and daemon).
- The system tray icon starts automatically when a desktop session (X11/Wayland) is detected.
- If running headless (no desktop), the daemon runs inside the API process — no tray needed.
