{
  rustPlatform,
  nodejs_20,
  pkg-config,
  openssl,
  fetchCrate,
  rust-bin,
  wasm-pack,
  binaryen,
  lib
}: let
  deps = (builtins.fromTOML (builtins.readFile ./wasm/Cargo.toml)).dependencies;
  wasm-bindgen-version = lib.strings.removePrefix "=" deps.wasm-bindgen.version;
  wasm-bindgen-cli = rustPlatform.buildRustPackage rec {
    pname = "wasm-bindgen-cli";
    version = wasm-bindgen-version;
    src = fetchCrate {
      inherit pname version;
      sha256 = "sha256-X8+DVX7dmKh7BgXqP7Fp0smhup5OO8eWEhn26ODYbkQ=";
    };

    cargoSha256 = "sha256-ckJxAR20GuVGstzXzIj1M0WBFj5eJjrO2/DRMUK5dwM=";
    nativeBuildInputs = [pkg-config];

    buildInputs = [openssl];

    checkInputs = [nodejs_20];

    dontCargoCheck = true;
  };
  rust-wasm = rust-bin.stable.latest.default.override {
    targets = ["wasm32-unknown-unknown"];
  };
in
  rustPlatform.buildRustPackage rec {
    name = "demo-inspector-wasm";
    version = "0.1.0";

    cargoLock = {
      lockFile = ./wasm/Cargo.lock;
      outputHashes = {
         "tf-demo-parser-0.5.0" = "sha256-bwQ4AqF+YMXBVLi7mxGSqZhj6+P086pNT1QR5ivTB8U=";
      };
    };

    src = ./wasm;

    WASM_PACK_CACHE = "/build/cache";
    nativeBuildInputs = [rust-wasm wasm-pack wasm-bindgen-cli binaryen];
    buildPhase = ''
      runHook preBuild
      (
      set -x
      wasm-pack build --mode no-install
      )
      runHook postBuild
    '';
    dontCargoBuild = true;
    dontCargoCheck = true;

    installPhase = ''
      cp -r pkg $out
    '';
  }
