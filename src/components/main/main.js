import createElement from '../../helpers/createElement';
import about from '../about/about';
import projects from '../projects/projects';
import contact from '../contact/contact';
import '../../styles/main.css';

export default () => {
  const build = {
    about: about,
    projects: projects,
    contact: contact,
  };

  const main = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const main = createElement('main');
      main.appendChild(build.about());
      main.appendChild(build.projects());
      main.appendChild(build.contact());
      return main;
    },
  };

  return main.render();
};
