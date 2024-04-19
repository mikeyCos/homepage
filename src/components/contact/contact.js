import createElement from '../../helpers/createElement';
import contactConfig from './contact.config';
import '../../styles/contact.css';

export default () => {
  const contact = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const contactSection = createElement(contactConfig.element, contactConfig.attributes);
      contactSection.setChildren(contactConfig.children);
      return contactSection;
    },
  };

  return contact.render();
};
