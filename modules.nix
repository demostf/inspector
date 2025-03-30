{
  importNpmLock,
  demo-inspector-wasm,
  nodejs,
}: importNpmLock.buildNodeModules {
  npmRoot = ./www;
  derivationArgs = {
    npmDeps = importNpmLock {
      npmRoot = ./www;
      packageSourceOverrides = {
        "node_modules/demo-inspector" = demo-inspector-wasm;
      };
    };
  };
  inherit nodejs;
}
