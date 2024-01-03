{
  npmlock2nix,
  nodejs_20,
  demo-inspector-wasm,
}:
npmlock2nix.v2.node_modules {
  src = ./www;
  nodejs = nodejs_20;
  localPackages = {
    "demo-inspector" = demo-inspector-wasm;
  };
}
