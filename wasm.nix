pkgs: let
  deps = (builtins.fromTOML (builtins.readFile ./wasm/Cargo.toml)).dependencies;
  wasm-bindgen-cli = pkgs.rustPlatform.buildRustPackage rec {
    pname = "wasm-bindgen-cli";
    version = deps.wasm-bindgen.version;
    src = pkgs.fetchCrate {
      inherit pname version;
      sha256 = "sha256-IPxP68xtNSpwJjV2yNMeepAS0anzGl02hYlSTvPocz8=";
    };

    cargoSha256 = "sha256-pBeQaG6i65uJrJptZQLuIaCb/WCQMhba1Z1OhYqA8Zc=";
    nativeBuildInputs = [ pkgs.pkg-config ];

    buildInputs = with pkgs; [ openssl ];

    checkInputs = [ pkgs.nodejs_20 ];

    dontCargoCheck = true;
  };
in pkgs.rustPlatform.buildRustPackage rec {
  name = "demo-inspector-wasm";
  version = "0.1.0";

  cargoLock = {
    lockFile = ./wasm/Cargo.lock;
  };

  src = ./wasm;

  WASM_PACK_CACHE = "/build/cache";
  nativeBuildInputs = [pkgs.rust-wasm pkgs.wasm-pack wasm-bindgen-cli pkgs.binaryen];
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
