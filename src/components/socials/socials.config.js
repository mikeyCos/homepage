import gitHubIcon from '../../assets/icons/github_mark/github-mark-white.svg';
import linkedinIcon from '../../assets/icons/linkedin_mark/linkedin_00.svg';
import xIcon from '../../assets/icons/x_mark/x_01.svg';

export default {
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
};
