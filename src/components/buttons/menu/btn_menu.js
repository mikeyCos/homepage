import createElement from '../../../helpers/createElement';
import btn_menuConfig from './btn_menu.config';
import pubSub from '../../../helpers/pubSub';
import '../../../styles/btn_menu.css';

export default () => {
  const menuButton = {
    init() {
      this.clickHandler = this.clickHandler.bind(this);
    },
    cacheDOM(element) {
      this.menuBtn = element;
      this.menuLines = element.querySelectorAll('.menu_line');
    },
    bindEvents() {
      this.menuBtn.addEventListener('click', this.clickHandler);
    },
    render() {
      const { element, attributes, children } = btn_menuConfig;
      const button = createElement(element, attributes);
      button.setChildren(children);

      this.cacheDOM(button);
      this.bindEvents();
      return button;
    },
    clickHandler(e) {
      console.log(`clickHandler firing from btn_menu.js`);
      const btn = e.currentTarget;
      const isPressed = btn.ariaPressed === 'true';
      const toggle = isPressed ? false : true;
      btn.ariaPressed = toggle;
      [...this.menuLines].forEach((menuLine) => {
        if (toggle) {
          // menuLine.classList.remove('inactive');
          menuLine.classList.add('active');
        } else {
          // menuLine.classList.add('inactive');
          menuLine.classList.remove('active');
        }
      });
      pubSub.publish('toggleMenu', toggle);
    },
  };

  menuButton.init();
  return menuButton.render();
};
