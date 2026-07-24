// Skip husky on CI/production installs (Vercel, Render, GitHub Actions),
// where git hooks are pointless and devDependencies may be pruned.
if (process.env.CI || process.env.VERCEL || process.env.NODE_ENV === 'production') {
  process.exit(0)
}

const { default: husky } = await import('husky')
console.log(husky())
