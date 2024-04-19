import createElement from '../../helpers/createElement';
import projectsConfig from './projects.config';
import '../../styles/projects.css';

export default () => {
  const projects = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const projectsSection = createElement(projectsConfig.element, projectsConfig.attributes);
      projectsSection.setChildren(projectsConfig.children);
      return projectsSection;
    },
  };

  return projects.render();
};
