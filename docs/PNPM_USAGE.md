# PNPM Usage Guide

Quick reference for essential pnpm commands.

---

## Installation & Setup

```bash
# Install all dependencies
pnpm install

# Install specific package
pnpm add <package>
pnpm add -D <package>  # dev dependency

# Remove package
pnpm remove <package>
```

---

## Dependency Management

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update <package>

# Check outdated packages
pnpm outdated

# Why is this package installed?
pnpm why <package>
```

---

## Cache & Cleanup

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Troubleshooting

| Problem                   | Solution                                  |
| ------------------------- | ----------------------------------------- |
| Peer dependency warnings  | Usually safe to ignore, pnpm handles them |
| Package not found         | Run `pnpm install` after pulling changes  |
| Corrupted lockfile        | Delete `pnpm-lock.yaml` and reinstall     |
| Build errors after update | Clear `.next` folder: `rm -rf .next`      |
