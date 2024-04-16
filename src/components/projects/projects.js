import createElement from '../../helpers/createElement';
import projectsConfig from './projects.config';

export default () => {
  const projects = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const projectsSection = createElement(projectsConfig.element, projectsConfig.attributes);
      return projectsSection;
    },
  };

  return projects.render();
};
