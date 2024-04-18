export default {
  element: 'button',
  attributes: {
    class: 'btn_menu',
    ['aria-pressed']: false,
  },
  children: [
    {
      element: 'div',
      attributes: {
        class: 'menu',
      },
      children: [
        // {
        //   element: 'span',
        //   attributes: {
        //     class: 'menu_line one',
        //   },
        // },
        // {
        //   element: 'span',
        //   attributes: {
        //     class: 'menu_line two',
        //   },
        // },
        // {
        //   element: 'span',
        //   attributes: {
        //     class: 'menu_line three',
        //   },
        // },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
      ],
    },
  ],
};
