module.exports = {
  hooks: {
    readPackage(pkg) {
      // 这会将所有依赖移到 dependencies 中，帮助 vsce 正确识别
      if (pkg.devDependencies) {
        pkg.dependencies = pkg.dependencies || {};
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          pkg.dependencies[name] = version;
        }
      }
      return pkg;
    }
  }
};
