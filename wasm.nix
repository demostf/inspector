{
  rustPlatform,
  nodejs_20,
  pkg-config,
  openssl,
  fetchCrate,
  rust-bin,
  wasm-pack,
  binaryen,
}: let
  deps = (builtins.fromTOML (builtins.readFile ./wasm/Cargo.toml)).dependencies;
  wasm-bindgen-cli = rustPlatform.buildRustPackage rec {
    pname = "wasm-bindgen-cli";
    version = deps.wasm-bindgen.version;
    src = fetchCrate {
      inherit pname version;
      sha256 = "sha256-IPxP68xtNSpwJjV2yNMeepAS0anzGl02hYlSTvPocz8=";
    };

    cargoSha256 = "sha256-pBeQaG6i65uJrJptZQLuIaCb/WCQMhba1Z1OhYqA8Zc=";
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
