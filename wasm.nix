pkgs: let
  deps = (builtins.fromTOML (builtins.readFile ./wasm/Cargo.toml)).dependencies;
  wasm-bindgen-cli = pkgs.rustPlatform.buildRustPackage rec {
    pname = "wasm-bindgen-cli";
    version = deps.wasm-bindgen.version;
    src = pkgs.fetchCrate {
      inherit pname version;
      sha256 = "sha256-+PWxeRL5MkIfJtfN3/DjaDlqRgBgWZMa6dBt1Q+lpd0=";
    };

    cargoSha256 = "sha256-GwLeA6xLt7I+NzRaqjwVpt1pzRex1/snq30DPv4FR+g=";
    nativeBuildInputs = [ pkgs.pkg-config ];

    buildInputs = with pkgs; [ openssl ];

    checkInputs = [ pkgs.nodejs ];

    # other tests require it to be ran in the wasm-bindgen monorepo
    cargoTestFlags = [ "--test=interface-types" ];
  };
in pkgs.rustPlatform.buildRustPackage rec {
  name = "demo-inspector-wasm";
  version = "0.1.0";

  cargoSha256 = "sha256-WjYIwkvMi82Wq4eCTve44sAL6DHtQBK2x7Ng5uw3fqQ=";

  src = ./wasm;

  nativeBuildInputs = [pkgs.rust-wasm pkgs.wasm-pack wasm-bindgen-cli];
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
