import '@iconfu/svg-inject';
import './app.css';
import header from './components/header/header';
import main from './components/main/main';
import footer from './components/footer/footer';

(() => {
  const build = {
    header: header,
    main: main,
    footer: footer,
  };

  const app = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      // Render loading screen while building app.js
      // Remove loading screen when building is complete
      document.body.appendChild(build.header());
      document.body.appendChild(build.main());
      document.body.appendChild(build.footer());
    },
  };

  app.render();
})();
