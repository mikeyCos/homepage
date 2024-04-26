import phoneIcon from '../../assets/icons/phone_classic.svg';
import emailIcon from '../../assets/icons/email.svg';
import contactSVG from '../../assets/icons/placeholder/undraw_personal_text_re_vqj3.svg';
import socials from '../socials/socials';

export default {
  element: 'section',
  attributes: {
    id: 'contact',
  },
  children: [
    {
      element: 'div',
      attributes: {
        class: 'contact_left slide_in from_left',
      },
      children: [
        {
          element: 'h2',
          attributes: {
            class: 'contact heading',
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
          attributes: {
            class: 'address',
          },
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
          attributes: {
            class: 'phone',
          },
          children: [
            {
              element: 'img',
              attributes: {
                loading: 'lazy',
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
          attributes: {
            class: 'email',
          },
          children: [
            {
              element: 'img',
              attributes: {
                loading: 'lazy',
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
        socials(),
      ],
    },
    {
      element: 'div',
      attributes: {
        class: 'contact_right slide_in from_right',
      },
      children: [
        {
          element: 'img',
          attributes: {
            loading: 'lazy',
            class: 'img_contact',
            src: contactSVG,
            onload: 'SVGInject(this)',
          },
        },
      ],
    },
  ],
};
