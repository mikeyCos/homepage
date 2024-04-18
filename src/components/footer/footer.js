import createElement from '../../helpers/createElement';

export default () => {
  const footer = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const footer = createElement('footer');
      const footerWrapper = createElement('div', { textContent: 'Placeholder' });
      footer.appendChild(footerWrapper);
      return footer;
    },
  };

  return footer.render();
};
