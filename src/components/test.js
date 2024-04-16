import Icon from '../assets/icons/sharp_home.svg';

export default {
  print() {
    console.log('print() running from test.js');
    console.log('testing...');
  },
  render() {
    const div = document.createElement('div');
    const paragraph = document.createElement('p');
    const foo = "test";

    const icon = new Image();
    icon.src = Icon;
    paragraph.textContent = 'Lorem ipsum something something...';

    div.appendChild(icon);
    div.appendChild(paragraph);
    return div;
  },
};
