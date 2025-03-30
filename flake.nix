{
  inputs = {
    nixpkgs.url = "nixpkgs/release-24.11";
    utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    utils,
    rust-overlay,
  }:
    utils.lib.eachDefaultSystem (system: let
      overlays = [
        (import rust-overlay)
        (import ./overlay.nix)
      ];
      pkgs = import nixpkgs {
        inherit system overlays;
      };
    in rec {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          cargo-edit
          bacon
          wasm-pack
          nodejs_20
          node2nix
          wasm-bindgen-cli
          json-schema-to-typescript
        ];
      };

      packages = rec {
        inherit (pkgs) json-schema-to-typescript demo-inspector demo-inspector-wasm demo-inspector-node-modules;
        default = demo-inspector;
      };
    })
    // {
      overlays.default = import ./overlay.nix;
    };
}
