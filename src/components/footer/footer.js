import createElement from '../../helpers/createElement';

export default () => {
  const footer = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const footer = createElement('footer');
      return footer;
    },
  };

  return footer.render();
};
