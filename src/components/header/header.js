import createElement from '../../helpers/createElement';
import navbar from '../navbar/navbar';
import '../../styles/header.css';

export default () => {
  const header = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const header = createElement('header');
      header.id = 'header_primary';
      header.appendChild(navbar());

      return header;
    },
  };

  return header.render();
};
