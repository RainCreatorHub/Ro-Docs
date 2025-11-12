import { createMDXSource } from 'fumadocs-mdx';
import { map } from '@/.map';

export const { getPage, getPages, pageTree } = createMDXSource(map, {
  rootDir: 'src/pages',
});
