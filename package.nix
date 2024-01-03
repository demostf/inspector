{
  stdenv,
  nodejs_20,
  demo-inspector-node-modules,
}:
stdenv.mkDerivation rec {
  name = "demo-inspector";
  version = "0.1.0";

  src = ./www;

  nativeBuildInputs = [nodejs_20];
  buildPhase = ''
    cp -r ${demo-inspector-node-modules}/node_modules ./node_modules
    npm run build
  '';

  installPhase = ''
    cp -r dist $out
  '';
}
