# Readme
---
## Live preview: [Project Name](https://mikeycos.github.io/)
---
### Ideas
1. Placeholder
---
### Notes
* Use this as a template repository.
* This is a starter package for initializing vanilla JS/CSS projects.
* This includes webpack ESLint and Prettier.
* ESLint `env` set as folllows:
    ```
    "browser": true,
    "commonjs": true,
    "es2021": true
    ```
* Commands `npm run build`, `npm run start`, and `npm run server` will work.
---
### Instructions
1. Use this as a template from GitHub as a...
    * New GitHub repository:
        1. Go to [module-webpack-starter](https://github.com/mikeyCos/module-webpack-starter).
        2. Click on the button `Use this template`.
        3. Click on `Create a new repository`.
    * Subfolder in an existing GitHub repository:
        1. In the CLI, run `git subtree add -P <prefix> <repo> <rev>` (e.g. `git subtree add -P new/repo/name_this git@github.com:username/reponame.git HEAD`).
        * For example, the existing repository is `theOdinProject/javaScript/projects/`, navigate to `theOdinProject/`, then, in the CLI, run `git subtree add -P javaScript/projects/merge-sort git@github.com:mikeyCos/module-webpack-starter.git main`.
2. Use `npm install` in terminal.
3. Update `live preview` section in `README.md` as needed.
4. Update plugin title in `webpack.config.js` as needed.
5. Update `.prettier.json` as needed; [Prettier Options](https://prettier.io/docs/en/options.html).
6. Update `.eslintrc.json` as needed; [ESLint Options](https://eslint.org/docs/latest/rules/).
7. Set VSCode's `Editor: Default Formatter` to `Prettier - Code formatter`.
8. Uninstall `webpack-dev-server` as needed with `npm uninstall webpack-dev-server`.
    * Remove `devServer` from `webpack.config.js`.
    * Remove `"start"` script from `package.json`.
    * Remove `server.js`.
9. Deploying to GitHub Pages
    * Initial setup: `git push origin && git subtree push --prefix dist origin gh-pages`
    * Update: `git push origin :gh-pages && git subtree push --prefix dist origin gh-pages`