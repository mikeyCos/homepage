import aboutImage from '../../assets/icons/placeholder/undraw_profile_details_re_ch9r.svg';
import gitHubIcon from '../../assets/icons/github_mark/github-mark-white.svg';
import linkedinIcon from '../../assets/icons/linkedin_mark/linkedin_00.svg';
import xIcon from '../../assets/icons/x_mark/x_01.svg';

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
                src: aboutImage,
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
            {
              element: 'ul',
              attributes: {
                class: 'socials',
              },
              children: [
                {
                  element: 'li',
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
                            src: gitHubIcon,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'li',
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
                            src: linkedinIcon,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'li',
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
                            src: xIcon,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
