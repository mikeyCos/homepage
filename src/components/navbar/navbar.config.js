import btn_menu from '../buttons/menu/btn_menu';
import logoSVG from '../../assets/icons/placeholder/undraw_male_avatar_g98d.svg';

export default {
  element: 'nav',
  children: [
    {
      element: 'ul',
      attributes: {
        class: 'nav_left',
      },
      children: [
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#',
              },
              children: [
                {
                  element: 'img',
                  attributes: {
                    class: 'logo',
                    src: logoSVG,
                    onload: 'SVGInject(this)',
                  },
                },
                {
                  element: 'h1',
                  attributes: {
                    textContent: 'John Doe',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      element: 'ul',
      attributes: {
        class: 'nav_right',
      },
      children: [
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#',
                textContent: 'placeholder',
              },
            },
          ],
        },
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#',
                textContent: 'placeholder',
              },
            },
          ],
        },
      ],
    },
    {
      element: 'div',
      attributes: {
        class: 'btn_wrapper',
      },
      children: [btn_menu()],
    },
  ],
};
