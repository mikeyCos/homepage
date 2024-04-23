import loadingConfig from './loading.config';
import createElement from '../../helpers/createElement';
import '../../styles/loading.css';

export default () => {
  const loading = {
    init() {},
    cacheDOM(element) {
      this.loadingContainer = element;
      this.loadingTextContainer = element.querySelector('.loading_text');
      this.loadingCharacters = [...this.loadingTextContainer.children];
    },
    bindEvents() {
      this.removeLoading = this.removeLoading.bind(this);
      window.addEventListener('load', this.removeLoading);
    },
    render() {
      const { element, attributes, children } = loadingConfig;
      const loadingContainer = createElement(element, attributes);
      loadingContainer.setChildren(children);
      this.cacheDOM(loadingContainer);
      this.bindEvents();
      document.body.appendChild(loadingContainer);
    },
    removeLoading() {
      this.loadingContainer.remove();
    },
  };

  loading.render();
};
