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
          npmlock2nix = import npmlock2nix { pkgs = final; };
          rust-wasm = (final.rust-bin.stable.latest.default.override {
            targets = [ "wasm32-unknown-unknown" ];
          });
          demo-inspector-wasm = import ./wasm.nix final;
          nodejs = final.nodejs_20;

          node_modules = final.npmlock2nix.v2.node_modules {
            src = ./www;
            nodejs = final.nodejs;
            localPackages = {
              "demo-inspector" = final.demo-inspector-wasm;
            };
          };
        })
      ];
      pkgs = import nixpkgs {
        inherit system overlays;
      };
    in rec {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          rust-wasm
          cargo-edit
          bacon
          wasm-pack
          nodejs_20
          node2nix
          wasm-bindgen-cli
        ];
      };

      packages.demo-inspector-wasm = pkgs.demo-inspector-wasm;

      packages.node_modules = pkgs.node_modules;

      packages.demo-inspector = pkgs.stdenv.mkDerivation rec {
        name = "demo-inspector";
        version = "0.1.0";

        src = ./www;

        nativeBuildInputs = with pkgs; [nodejs_20];
        buildPhase = with pkgs; ''
          cp -r ${node_modules}/node_modules ./node_modules
          npm run build
        '';

        installPhase = ''
          cp -r dist $out
        '';
      };
      defaultPackage = packages.demo-inspector;
    });
}
