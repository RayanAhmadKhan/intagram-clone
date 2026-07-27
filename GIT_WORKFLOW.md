# Git Workflow

Never commit directly to `main`. One feature branch per step of the roadmap.

```bash
git checkout main
git pull origin main

git checkout -b feature/auth
# ... write code ...
git add .
git commit -m "feat(auth): implement JWT authentication"
git push origin feature/auth
# Open a PR on GitHub: feature/auth -> main, review, merge, delete branch
```

## Conventional Commits used in this project

- `chore:` tooling/setup, no feature code (e.g. `chore: initialize backend project`)
- `feat(scope):` a new feature (e.g. `feat(auth): implement JWT authentication`)
- `fix(scope):` a bug fix
- `refactor(scope):` code change that isn't a fix or a feature
- `docs:` documentation only
- `style:` formatting/UI-only changes, no logic change

## Branch plan (matches README progress checklist)

```
main
├── feature/setup
├── feature/auth          <- done in this pass
├── feature/profile
├── feature/follow
├── feature/media
├── feature/posts
├── feature/likes
├── feature/comments
├── feature/stories
├── feature/feed
├── feature/socket
├── feature/frontend-polish
└── feature/deployment
```
