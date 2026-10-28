function readPackage(pkg) {
  if (pkg.dependencies && pkg.dependencies['proxy-addr']) {
    pkg.dependencies['proxy-addr'] = '2.0.8';
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
