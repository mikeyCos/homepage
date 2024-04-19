import createElement from '../../helpers/createElement';
import socialsConfig from './socials.config';
import '../../styles/socials.css';

export default () => {
  const socials = {
    init() {},
    cacheDOM(element) {},
    bindEvents() {},
    render() {
      const { element, attributes, children } = socialsConfig;
      const socials = createElement(element, attributes);
      socials.setChildren(children);
      return socials;
    },
  };

  return socials.render();
};
