import createElement from '../../helpers/createElement';
import aboutConfig from './about.config';

export default () => {
  const about = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const aboutSection = createElement(aboutConfig.element, aboutConfig.attributes);
      aboutSection.setChildren(aboutConfig.children);
      return aboutSection;
    },
  };

  return about.render();
};
