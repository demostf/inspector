prev: final: {
  demo-inspector-wasm = final.callPackage ./wasm.nix {};
  demo-inspector-node-modules = final.callPackage ./modules.nix {};
  demo-inspector = final.callPackage ./package.nix {};
  json-schema-to-typescript = final.callPackage ../pkgs/json-schema-to-typescript {};
}
