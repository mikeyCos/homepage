import '@iconfu/svg-inject';
import './app.css';
import header from './components/header/header';
import main from './components/main/main';
import footer from './components/footer/footer';
import loading from './components/loading/loading';

(() => {
  const build = {
    header: header,
    main: main,
    footer: footer,
  };

  const app = {
    timer: null,
    init() {},
    cacheDOM() {},
    bindEvents() {
      this.stopTransitions = this.stopTransitions.bind(this);
      this.resizeObserver = new ResizeObserver(this.stopTransitions);
      this.resizeObserver.observe(document.body);
    },
    render() {
      for (const element in build) {
        document.body.appendChild(build[element]());
      }
      this.bindEvents();
    },
    stopTransitions(entries) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      } else {
        document.body.classList.add('stop_transitions');
      }

      this.timer = setTimeout(() => {
        document.body.classList.remove('stop_transitions');
        this.timer = null;
      }, 100);
    },
  };

  loading();
  app.render();
})();
