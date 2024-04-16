import createElement from '../../helpers/createElement';
import navbar from '../navbar/navbar';

export default () => {
  const header = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const header = createElement('header');
      header.appendChild(navbar());

      return header;
    },
  };

  return header.render();
};
