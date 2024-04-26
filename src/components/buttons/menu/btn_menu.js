import createElement from '../../../helpers/createElement';
import btn_menuConfig from './btn_menu.config';
import pubSub from '../../../helpers/pubSub';
import '../../../styles/btn_menu.css';

export default () => {
  const menuButton = {
    init() {
      this.clickHandler = this.clickHandler.bind(this);
      this.clickMenu = this.clickMenu.bind(this);
    },
    cacheDOM(element) {
      this.menuBtn = element;
      this.menuLines = element.querySelectorAll('.menu_line');
    },
    bindEvents() {
      this.menuBtn.addEventListener('click', this.clickHandler);
      pubSub.subscribe('clickMenu', this.clickMenu);
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
      const btn = e.currentTarget;
      const isPressed = btn.ariaPressed === 'true';
      const toggle = isPressed ? false : true;
      btn.ariaPressed = toggle;
      [...this.menuLines].forEach((menuLine) => {
        menuLine.classList.toggle('active', toggle);
      });
      pubSub.publish('toggleMenu', toggle);
    },
    clickMenu() {
      const display = window.getComputedStyle(this.menuBtn).display;
      if (display === 'block') this.menuBtn.click();
    },
  };

  menuButton.init();
  return menuButton.render();
};
