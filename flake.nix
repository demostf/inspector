{
  inputs = {
    nixpkgs.url = "nixpkgs/release-23.05";
    utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "utils";
    };
    npmlock2nix = {
      url = "github:icewind1991/npmlock2nix/local-packages";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    utils,
    rust-overlay,
    npmlock2nix,
  }:
    utils.lib.eachDefaultSystem (system: let
      overlays = [
        (import rust-overlay)
        (final: prev: {
          npmlock2nix = import npmlock2nix {pkgs = final;};
        })
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
        ];
      };

      packages = rec {
        wasm = pkgs.demo-inspector-wasm;
        node_modules = pkgs.demo-inspector-node-modules;
        demo-inspector = pkgs.demo-inspector;
        default = demo-inspector;
      };
    })
    // {
      overlays.default = import ./overlay.nix;
    };
}
