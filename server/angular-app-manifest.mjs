
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://Agneese-Saini.github.io/BakeSale/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/BakeSale"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1864, hash: '071c0dc59fba465c71abe24e4c9c6fdb22bb4ae3244646215cf1a5b40187ce86', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 986, hash: 'bf072ad8aef1c0adb341dfcf44406b97a44e6f7170dbe8475ca45d1da162b107', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 23142, hash: '9c0eaec014d1e1356e378e2b1e72fb5c5d04d9a5d35d39ecc0679c79363d5acd', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-N3GZVBPS.css': {size: 4544, hash: '77VuYXCVQuQ', text: () => import('./assets-chunks/styles-N3GZVBPS_css.mjs').then(m => m.default)}
  },
};
