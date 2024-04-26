import navbarConfig from './navbar.config';
import createElement from '../../helpers/createElement';
import pubSub from '../../helpers/pubSub';
import '../../styles/navbar.css';

export default () => {
  const navbar = {
    init() {
      this.toggleMenu = this.toggleMenu.bind(this);
      this.setCurrentNav = this.setCurrentNav.bind(this);
      this.getNavItem = this.getNavItem.bind(this);
    },
    cacheDOM(element) {
      this.navRight = element.querySelector('.nav_right');
      this.navItems = this.navRight.querySelectorAll('a');
    },
    bindEvents() {
      pubSub.subscribe('toggleMenu', this.toggleMenu);
      pubSub.subscribe('setCurrentNav', this.setCurrentNav);
      this.navItems.forEach((navItem) => navItem.addEventListener('click', this.clickMenuBtn));
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
      this.navRight.classList.toggle('active', toggle);
    },
    clickMenuBtn() {
      pubSub.publish('clickMenu');
    },
    setCurrentNav(query) {
      const prevNav = this.currentNav;
      this.currentNav = this.getNavItem(query);
      if (prevNav) prevNav.classList.remove('current');
      this.currentNav.classList.add('current');
    },
    getNavItem(query) {
      return [...this.navItems].find((navItem) => navItem.href.includes(query));
    },
  };

  navbar.init();
  return navbar.render();
};
