import phoneIcon from '../../assets/icons/phone_classic.svg';
import emailIcon from '../../assets/icons/email.svg';
import contactSVG from '../../assets/icons/placeholder/undraw_personal_text_re_vqj3.svg';
import gitHubIcon from '../../assets/icons/github_mark/github-mark-white.svg';
import linkedinIcon from '../../assets/icons/linkedin_mark/linkedin_00.svg';
import xIcon from '../../assets/icons/x_mark/x_01.svg';

export default {
  element: 'section',
  attributes: {
    class: 'contact',
  },
  children: [
    {
      element: 'div',
      children: [
        {
          element: 'h2',
          attributes: {
            textContent: 'Contact me',
          },
        },
        {
          element: 'div',
          children: [
            {
              element: 'p',
              attributes: {
                textContent: 'Morbi tincidunt dolor ac sapien facilisis, nec laoreet mi consequat.',
              },
            },
          ],
        },
        {
          element: 'div',
          children: [
            {
              element: 'p',
              attributes: {
                textContent: '1234 Random Road',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent: 'Random Town, Tyria 12345',
              },
            },
          ],
        },
        {
          element: 'div',
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_contact',
                src: phoneIcon,
                onload: 'SVGInject(this)',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent: '555-555-5555',
              },
            },
          ],
        },
        {
          element: 'div',
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_contact',
                src: emailIcon,
                onload: 'SVGInject(this)',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent: 'placeholder_email@gmail.com',
              },
            },
          ],
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
                        class: 'icon icon_social',
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
                        class: 'icon icon_social',
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
                        class: 'icon icon_social',
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
    {
      element: 'div',
      children: [
        {
          element: 'img',
          attributes: {
            src: contactSVG,
            onload: 'SVGInject(this)',
          },
        },
      ],
    },
  ],
};
