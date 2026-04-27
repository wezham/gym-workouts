# gym-workouts

Static workout plan HTML for deployment on Vercel.

## Deploy on Vercel

This repo is configured so Vercel can serve the site directly:

- `workout-plan.html` is the main file.
- `index.html` provides a root entry point.
- `vercel.json` rewrites `/` to `workout-plan.html`.

To deploy:

1. Push this repo to GitHub.
2. Import it into Vercel as a new project.
3. Leave the framework preset as `Other`.
4. Leave the build command empty.
5. Leave the output directory empty.

## Regenerate the HTML

Place your CSV at `workout-plan.csv`, then run:

```bash
node generate-workout-html.mjs
```

Or specify paths explicitly:

```bash
node generate-workout-html.mjs --input /path/to/file.csv --output ./workout-plan.html
```
