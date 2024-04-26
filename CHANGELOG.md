# Changelog
---
### 26 APR 2024
- Changed the `rootMargin` property value of `sectionOnScrollOptions` from `rootMargin: '-200px 0px -60px 0px'` to `rootMargin: '-400px 0px -250px 0px'`.
- Added `@media (hover: none)` for the about image's hover effect.
- Updated README.md.
- Added `devServer` property to `webpack.config` and removed `publicPath` from `output`.
- Removed `server.js` file.
---
### 25 APR 2024
- Locally saved a variable font, `Caveat`.
- Navigation bar items are stylized based on what section is scrolled into view; the Intersection Observer's options could use tweaking.
- Installed `postcss` and `autoprefixer` dependencies.
- Added `loading: 'lazy'` to `img` elements.
---
### 24 APR 2024
- Made use of `classList.toggle`, instead of removing an element's class based on it's `classList` contains a string.
- If `.nav_right` is active and a `.nav_item` is clicked the `.nav_right` is closed; the `.btn_menu` is clicked but only closes `.nav_right` if the button's computed display style is 'block'.
- The contact section, 'on scroll view', will slide it's content from left and right once.
---
### 23 APR 2024
- Created a two media query breakpoints, `min-width: 481px` and `min-width: 1025px`.
- Applied `scroll-behavior: smooth` to all elements.
- Continued applying CSS styles to elements.
- Attempted to wrap about text around the about image.
---
### 22 APR 2024
- Created a `ResizeObserver` in the `app` module; this will observe `document.body` and add/remove a class 'stop_transitions' to the body.
- Created `loading.config` consisting of `span` elements spelling out `loading...`.
- The `loading` module will display a loading screen and remove it's self once the `window` is loaded.
- Created `wave` animation for the loading text.
---
### 19 APR 2024
- Added a variety of CSS styles throughout sections, including but not limited to padding, margin, transform, transition, et cetera.
- Applied a `position: sticky` to the `header` element containing the `nav` element.
- Fixed the unordered list of class `.nav_right` appearing in the background by applying a `z-index: 1` to `header id="header_primary"`.
- Added `fill="currentColor"` to SVG files in use.
- Added the following style sheets: `footer`/`main`/`socials`.
---
### 18 APR 2024
- Defined `sizes` and `srcset` for the about section's `img` element.
- Created `socials` module that renders an unordered list of common social media icons inside anchor elements.
- The heading and anchor tags in article elements are wrapped in a `header` element.
- Created `about`/`contact`/`projects` style sheets.
- Added basic CSS styles to the projects section.
- Created `images` subdirectory.
---
### 17 APR 2024
- Hamburger menu implemented; toggles the unordered list of class `.nav_right` for mobile/tablets.
- Added a case for `instanceof HTMLElement` in the `setChildren` method.
- Created a `buttons` subdirectory and a `btn_menu` module.
- Filled sections with placeholder content.
---
### 16 APR 2024
- Added GitHub Pages deployment to instructions in `README.md`.
- Used `module-webpack-starter` repository as a template to create `homepage` repository.
- Updated `devDependencies` to `wanted` versions.
- Removed `devServer` from `webpack.config.js`, `server.js`, and `testing` subdirectory.
- Initialized a variety of components.
- Created `createElement` and `pubSub` helpers.
- Downloaded a handful of icons.
---
### 15 FEB 2024
- Installed npm packages: `jest`, `babel/core`, `babel/preset-env`, and `babel-jest`.
- Added `babel.config.js` file to target current version of Node.
- Changed test script to `jest --testPathPattern=src/testing`.
- Created `containers` and `testing` sub-directories inside `src` directory.
- Starting files `sum` and `sum.test` generated for temporary testing.
- Fixed repeated text in `CHANGELOG.md`.
---
### 14 JAN 2024
- Reformatted `CHANGELOG.md`.
- Updated instructions in `README.md`.
---
### 27 OCT 2023
- Initial `module-webpack-starter` structure created.
- ESLint and Prettier enabled for the module.
- Configuration files for ESLint and Prettier created.
- `README.md` included with instructions and notes.
- Placeholder directories created in components.
- Added `.eslintrc.json` to `.prettierignore`.  
---