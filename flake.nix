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
      url = "github:nix-community/npmlock2nix";
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
          node_modules = let
            without-local-deps =
              prev.stdenv.mkDerivation {
                name = "demo-inspector-without-local-deps";
                src = ./www;
                buildInputs = [ prev.jq ];
                installPhase = ''
                  mkdir $out
                  cat $src/package.json \
                        | jq 'del( .dependencies."demo-inspector" )' \
                        > $out/package.json
                  cat $src/package-lock.json \
                        | jq 'del( .packages."".dependencies."demo-inspector" )' \
                        | jq 'del( .dependencies."demo-inspector" )' \
                        | jq 'del( .packages."demo-inspector" )' \
                        | jq 'del( .packages."../wasm/pkg" )' \
                        | jq 'del( .packages."node_modules/demo-inspector" )' \
                        > $out/package-lock.json
                '';
              };

            npmlock2nix-d =
              final.npmlock2nix.v2.node_modules {
                src = without-local-deps;
                nodejs = final.nodejs;
              };

            with-local-deps =
              pkgs.runCommand "demo-inspector-with-local-deps" {} ''
                mkdir $out
                cp -r -- ${npmlock2nix-d}/node_modules $out
                chmod +w -R $out/node_modules
                cp -r -- ${final.demo-inspector-wasm} $out/node_modules/demo-inspector
              '';

            in with-local-deps;
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
