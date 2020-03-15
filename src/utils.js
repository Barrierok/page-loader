import path from 'path';
import url from 'url';

export const tags = {
  link: 'href',
  script: 'src',
  img: 'src',
};

export const getKebabName = (link) => {
  const { host, pathname } = url.parse(link);
  const name = `${host || ''}${pathname}`.replace(/[^A-z0-9]/g, '-');
  return name.split('-').filter((val) => val).join('-');
};

export const types = {
  htmlFile: 'htmlFile',
  resourceDir: 'sourceDir',
  resourceFile: 'sourceFile',
};

export const getNameFromURL = (link, type = types.resourceFile) => {
  const dispatcher = {
    [types.resourceDir]: (name) => `${name}_files`,
    [types.htmlFile]: (name) => `${name}.html`,
    [types.resourceFile]: (name) => {
      const withoutExtname = name.slice(0, name.lastIndexOf('-'));
      return `${withoutExtname}${path.extname(link)}`;
    },
  };
  return dispatcher[type](getKebabName(link));
};
