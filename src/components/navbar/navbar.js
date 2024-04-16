import navbarConfig from './navbar.config';
import createElement from '../../helpers/createElement';

export default () => {
  const navbar = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const nav = createElement(navbarConfig.element);
      nav.setChildren(navbarConfig.children);
      return nav;
    },
  };

  return navbar.render();
};
