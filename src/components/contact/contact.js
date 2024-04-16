import createElement from '../../helpers/createElement';
import contactConfig from './contact.config';

export default () => {
  const contact = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const contactSection = createElement(contactConfig.element, contactConfig.attributes);
      return contactSection;
    },
  };

  return contact.render();
};