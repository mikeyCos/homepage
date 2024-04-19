import socials from '../socials/socials';
import aboutPlaceholder_4951x3301 from '../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_4951_3301.jpg';
import aboutPlaceholder_2400x1600 from '../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_2400_1600.jpg';
import aboutPlaceholder_1920x1280 from '../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_1920_1280.jpg';
import aboutPlaceHolder_640x427 from '../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_640_427.jpg';

export default {
  element: 'section',
  attributes: {
    class: 'about',
  },
  children: [
    {
      element: 'div',
      attributes: {
        class: 'about_container',
      },
      children: [
        {
          element: 'div',
          attributes: {
            class: 'about_left',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'img_about',
                src: aboutPlaceholder_4951x3301,
                srcset: `${aboutPlaceHolder_640x427} 640w, ${aboutPlaceholder_1920x1280} 1920w, ${aboutPlaceholder_2400x1600} 2400w, ${aboutPlaceholder_4951x3301} 4951w`,
                sizes:
                  '(max-width: 700px) 640px, (max-width: 1920px) 1920px, (max-width: 2400px) 2400px, 4951px',
              },
            },
            {
              element: 'h2',
              attributes: {
                textContent: 'John Doe',
              },
            },
          ],
        },
        {
          element: 'div',
          attributes: {
            class: 'about_right',
          },
          children: [
            {
              element: 'h2',
              attributes: {
                textContent: 'About me',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent:
                  'Pellentesque convallis ornare libero id vehicula. Mauris quis leo a nisl pellentesque fringilla sit amet at risus. Nullam mauris orci, sodales eu fermentum sed, ornare ac nisl. Fusce quis libero vulputate, pellentesque sapien sed, mattis elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Fusce fringilla congue lectus, ut mollis mi tincidunt eu. Duis convallis sagittis risus quis sagittis. Duis eu convallis velit. Nunc lorem ex, sollicitudin a finibus rhoncus, rutrum eu lacus. Duis lorem enim, dictum ac odio rutrum, scelerisque rutrum tortor. Sed est magna, placerat eu dolor non, tincidunt rutrum sem. Sed ullamcorper, sapien vitae maximus volutpat, sem sem eleifend sem, at congue enim quam eget purus. Aenean imperdiet lorem nec massa lobortis dictum.',
              },
            },
            socials(),
          ],
        },
      ],
    },
  ],
};
