import { root } from 'postcss';
import pubSub from '../helpers/pubSub';

export default () => {
  const scrollController = {
    init() {
      this.cacheDOM();
      window.onload = () => {
        this.bindEvents();
      };
    },
    cacheDOM() {
      this.sliders = document.querySelectorAll('.slide_in');
      this.sections = document.querySelectorAll('section');
    },
    bindEvents() {
      this.appearOnScroll = this.appearOnScroll.bind(this);
      this.setCurrentNavOnScroll = this.setCurrentNavOnScroll.bind(this);
      const slideOnScrollOptions = {
        threshold: 0,
        rootMargin: '0px 0px -300px 0px',
      };

      const sectionOnScrollOptions = {
        // Somewhat of a sweet spot
        // threshold: 0.05,
        // rootMargin: '-100px',
        // Another somewhat of a sweet spot?
        // threshold: 0.05,
        // rootMargin: '-30px',
        threshold: 0,
        // rootMargin: '-200px 0px -60px 0px',
        rootMargin: '-400px 0px -250px 0px',
      };

      this.slideOnScroll = new IntersectionObserver(this.appearOnScroll, slideOnScrollOptions);
      this.sectionOnScroll = new IntersectionObserver(
        this.setCurrentNavOnScroll,
        sectionOnScrollOptions,
      );

      this.sliders.forEach((slider) => {
        this.slideOnScroll.observe(slider);
      });

      this.sections.forEach((section) => {
        this.sectionOnScroll.observe(section);
      });
    },
    appearOnScroll(entries, appearOnScroll) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('appear');
        appearOnScroll.unobserve(entry.target);
      });
    },
    setCurrentNavOnScroll(entries) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const query = entry.target.id;
        console.log(entry.target);
        pubSub.publish('setCurrentNav', query);
      });
    },
  };
  scrollController.init();
};
