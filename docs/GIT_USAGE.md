# Git Usage Guide

Quick reference for git commands and recovery scenarios.

---

## Daily Workflow

```bash
# Check status
git status

# Stage and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin <branch>

# Pull latest changes
git pull origin <branch>
```

---

## Branching

```bash
# Create and switch to new branch
git checkout -b feature/my-feature

# Switch branches
git checkout <branch>

# List branches
git branch -a

# Delete branch (local)
git branch -d <branch>

# Delete branch (remote)
git push origin --delete <branch>
```

---

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve login timeout issue
docs: update README
test: add unit tests for auth
setup: configure ESLint rules
```

---

## 🚨 Recovery Scenarios

### "I committed to wrong branch"

```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Switch to correct branch and recommit
git checkout correct-branch
git commit -m "your message"
```

### "I need to undo my last commit"

```bash
# Undo commit, keep changes staged
git reset --soft HEAD~1

# Undo commit, keep changes unstaged
git reset HEAD~1

# Undo commit, discard changes (DANGEROUS)
git reset --hard HEAD~1
```

### "I committed sensitive data"

```bash
# Remove file from history (if not pushed)
git reset --soft HEAD~1
# Remove the sensitive file
git add .
git commit -m "fix: remove sensitive data"

# If already pushed - CONTACT TEAM LEAD
# You may need to rotate credentials
```

### "I messed up my branch completely"

```bash
# Reset to match remote (DANGEROUS - loses local changes)
git fetch origin
git reset --hard origin/<branch>
```

### "I accidentally deleted a file"

```bash
# Restore from last commit
git checkout HEAD -- path/to/file

# Restore from specific commit
git checkout <commit-hash> -- path/to/file
```

### "I need to undo pushed commits"

```bash
# Create a revert commit (safe for shared branches)
git revert <commit-hash>
git push

# Force push (DANGEROUS - only for personal branches)
git reset --hard HEAD~1
git push --force-with-lease
```

### "My merge has conflicts"

```bash
# See conflicting files
git status

# After resolving conflicts manually:
git add .
git commit -m "fix: resolve merge conflicts"

# Abort merge and go back
git merge --abort
```

### "I want to discard all local changes"

```bash
# Discard unstaged changes
git checkout -- .

# Discard all changes including staged
git reset --hard HEAD

# Also remove untracked files
git clean -fd
```

### "I need changes from another branch"

```bash
# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Merge entire branch
git merge <branch>

# Rebase onto another branch
git rebase <branch>
```

---

## Stashing (Temporary Storage)

```bash
# Save changes temporarily
git stash

# Save with message
git stash push -m "work in progress"

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash apply stash@{1}

# Delete all stashes
git stash clear
```

---

## Useful Commands

```bash
# View commit history
git log --oneline -10

# See what changed in a commit
git show <commit-hash>

# Compare branches
git diff branch1..branch2

# Find who changed a line
git blame path/to/file
```

---

## ⚠️ Golden Rules

1. **Never force push to shared branches** (`main`, `develop`, `release/*`)
2. **Always pull before pushing** to avoid conflicts
3. **Commit often, push regularly** - smaller commits are easier to revert
4. **When in doubt, create a backup branch** before risky operations
5. **If you pushed secrets, rotate them immediately** - git history is permanent
