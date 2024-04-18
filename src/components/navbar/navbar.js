import navbarConfig from './navbar.config';
import createElement from '../../helpers/createElement';
import pubSub from '../../helpers/pubSub';
import '../../styles/navbar.css';

export default () => {
  const navbar = {
    init() {
      this.toggleMenu = this.toggleMenu.bind(this);
    },
    cacheDOM(element) {
      // this.menuBtn = element.querySelector('.btn_menu');
      this.navRight = element.querySelector('.nav_right');
    },
    bindEvents() {
      pubSub.subscribe('toggleMenu', this.toggleMenu);
      // this.menuBtn.addEventListener('click', this.toggleMenu);
    },
    render() {
      const { element, children } = navbarConfig;
      const nav = createElement(element);
      nav.setChildren(children);

      this.cacheDOM(nav);
      this.bindEvents();
      return nav;
    },
    toggleMenu(toggle) {
      console.log(`toggleMenu published from btn_menu.js`);
      // this.navRight.classList.add('')
      console.log(toggle);
      this.navRight.classList.remove(toggle ? 'inactive' : 'active');
      this.navRight.classList.add(toggle ? 'active' : 'inactive');
    },
  };

  navbar.init();
  return navbar.render();
};
