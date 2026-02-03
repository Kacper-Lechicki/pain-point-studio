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

---

## AI Optimization Instructions

> **For AI assistants auditing files according to this document:**
>
> I will provide you with package.json or dependency-related files, and you will verify and optimize them according to these instructions, ensuring that their behavior remains unchanged.
>
> **Key rules:**
>
> 1. Verify dependencies are in correct section (dependencies vs devDependencies)
> 2. Check for duplicate or conflicting package versions
> 3. Ensure pnpm-specific features are used correctly (workspace, overrides)
> 4. Validate scripts in package.json follow project conventions
> 5. Confirm no unnecessary dependencies are installed
> 6. **Do not upgrade versions** - only fix structural issues
> 7. Build behavior must remain **identical**
