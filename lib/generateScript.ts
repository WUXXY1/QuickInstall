// Toda a lógica de geração de script sem sudo vive aqui.
// Separar do componente facilita testes unitários.

export type PackageType = 'deb' | 'tar.gz' | 'tar.xz' | 'tar.bz2' | 'zip';

export interface ScriptOptions {
  proxyEnabled: boolean;   // prefixar URL com proxy para contornar bloqueios
  quad9Enabled: boolean;   // resolver DNS via Quad9 DoH antes do download
  checksumEnabled: boolean;// solicitar e verificar SHA256 antes de extrair
}

const PROXY_PREFIX = 'https://corsproxy.io/?';

export function detectType(filename: string): PackageType {
  if (filename.endsWith('.deb'))     return 'deb';
  if (filename.endsWith('.tar.xz')) return 'tar.xz';
  if (filename.endsWith('.tar.bz2'))return 'tar.bz2';
  if (filename.endsWith('.tgz') || filename.endsWith('.tar.gz')) return 'tar.gz';
  if (filename.endsWith('.zip'))     return 'zip';
  return 'tar.gz'; // fallback seguro
}

export function generateScript(
  url: string,
  type: PackageType,
  opts: ScriptOptions
): string {
  // Nome do binário derivado da URL (ex: "myapp" de "myapp-1.0.tar.gz")
  const binName = url.split('/').pop()!
    .replace(/\.(deb|tar\.gz|tgz|tar\.xz|tar\.bz2|zip)$/, '');

  const downloadUrl = opts.proxyEnabled
    ? `${PROXY_PREFIX}${encodeURIComponent(url)}`
    : url;

  const lines: string[] = [
    '#!/usr/bin/env bash',
    '# QuickInstall · gerado automaticamente',
    '# Instala sem root: binários em ~/.local/bin',
    '',
    'set -euo pipefail',
    '',
  ];

  // ── Bloco Quad9: resolve o hostname via DoH antes de qualquer conexão
  // Isso garante que o DNS corporativo ou do ISP não bloqueie a resolução
  if (opts.quad9Enabled) {
    lines.push(
      '# Quad9 DoH: evita vazamento de DNS resolvendo antes do curl',
      'resolve_via_quad9() {',
      '  local host="$1"',
      '  curl -sf "https://dns.quad9.net:5053/dns-query?name=${host}&type=A" \\',
      '    -H "Accept: application/dns-json" | grep -oP \'"data":"\\K[^"]+\' | head -1',
      '}',
      `FILE_HOST=$(echo "${url}" | grep -oP '(?<=://)([^/]+)')`,
      'FILE_IP=$(resolve_via_quad9 "$FILE_HOST")',
      '[ -z "$FILE_IP" ] && { echo "✗ DNS Quad9 falhou"; exit 1; }',
      'echo "✓ DNS: $FILE_HOST → $FILE_IP"',
      '',
    );
  }

  if (opts.checksumEnabled) {
    lines.push(
      '# Verificação de integridade opcional',
      'read -rp "SHA256 esperado (Enter para pular): " EXPECTED_HASH',
      '',
    );
  }

  // ── Diretórios de instalação local (sem sudo)
  lines.push(
    '# Diretórios locais — sem necessidade de root',
    'BIN_DIR="$HOME/.local/bin"',
    'LIB_DIR="$HOME/.local/lib"',
    'TMP_DIR="$(mktemp -d /tmp/quickinstall.XXXXXX)"',
    '',
    'mkdir -p "$BIN_DIR" "$LIB_DIR"',
    '',
    'echo "⟳ Baixando ${binName}..."',
    `PKG="$TMP_DIR/${binName}.${type}"`,
  );

  // ── Download com ou sem resolução Quad9 manual
  if (opts.quad9Enabled) {
    lines.push(
      'curl -fL --progress-bar \\',
      '  --resolve "$FILE_HOST:443:$FILE_IP" \\',
      `  "${downloadUrl}" -o "$PKG"`,
      '',
    );
  } else {
    lines.push(
      `curl -fL --progress-bar "${downloadUrl}" -o "$PKG"`,
      '',
    );
  }

  // ── Verificação de hash antes da extração (impede execução de pacote corrompido)
  if (opts.checksumEnabled) {
    lines.push(
      'if [ -n "$EXPECTED_HASH" ]; then',
      '  ACTUAL=$(sha256sum "$PKG" | awk \'{print $1}\')',
      '  [ "$ACTUAL" != "$EXPECTED_HASH" ] && {',
      '    echo "✗ Hash inválido! Abortando."; rm -rf "$TMP_DIR"; exit 1; }',
      '  echo "✓ Hash SHA256 verificado"',
      'fi',
      '',
    );
  }

  // ── Extração sem sudo: cada formato tem sua estratégia
  lines.push('echo "⟳ Extraindo..."', 'mkdir -p "$TMP_DIR/extracted"', '');

  switch (type) {
    case 'deb':
      // dpkg-deb -x extrai o conteúdo sem instalar no sistema
      // Mantém a hierarquia (usr/bin, usr/lib) dentro do TMP_DIR
      lines.push(
        '# dpkg-deb -x extrai sem precisar de root nem do daemon dpkg',
        'dpkg-deb -x "$PKG" "$TMP_DIR/extracted"',
        '',
        '# Copia binários de qualquer subpasta */bin para ~/.local/bin',
        'for d in usr/bin usr/local/bin bin; do',
        '  src="$TMP_DIR/extracted/$d"',
        '  [ -d "$src" ] && cp -r "$src"/. "$BIN_DIR/" && chmod +x "$BIN_DIR"/* 2>/dev/null || true',
        'done',
        '',
        '# Copia bibliotecas preservando estrutura',
        'for d in usr/lib lib; do',
        '  src="$TMP_DIR/extracted/$d"',
        '  [ -d "$src" ] && cp -r "$src"/. "$LIB_DIR/" || true',
        'done',
      );
      break;

    case 'tar.gz':
    case 'tgz':
      // --strip-components=1 remove o diretório raiz do tarball (ex: myapp-1.0/)
      lines.push(
        '# tar zxf: descomprime gzip e extrai; strip-components remove prefixo raiz',
        'tar -xzf "$PKG" -C "$TMP_DIR/extracted" --strip-components=1 2>/dev/null \\',
        '  || tar -xzf "$PKG" -C "$TMP_DIR/extracted"',
        '',
        '# Localiza executáveis e copia para ~/.local/bin',
        'find "$TMP_DIR/extracted" -maxdepth 3 -type f -executable \\',
        '  ! -path "*/lib/*" -exec cp {} "$BIN_DIR/" \\;',
        `chmod +x "$BIN_DIR/${binName}" 2>/dev/null || true`,
      );
      break;

    case 'tar.xz':
      lines.push(
        'tar -xJf "$PKG" -C "$TMP_DIR/extracted" --strip-components=1 2>/dev/null \\',
        '  || tar -xJf "$PKG" -C "$TMP_DIR/extracted"',
        'find "$TMP_DIR/extracted" -maxdepth 3 -type f -executable \\',
        '  ! -path "*/lib/*" -exec cp {} "$BIN_DIR/" \\;',
      );
      break;

    case 'zip':
      lines.push(
        'unzip -q "$PKG" -d "$TMP_DIR/extracted"',
        'find "$TMP_DIR/extracted" -maxdepth 3 -type f -executable \\',
        '  -exec cp {} "$BIN_DIR/" \\;',
        'chmod +x "$BIN_DIR"/* 2>/dev/null || true',
      );
      break;
  }

  // ── Adiciona PATH de forma idempotente (não duplica se já existir)
  lines.push(
    '',
    '# Adiciona ~/.local/bin ao PATH nos shell configs (idempotente)',
    'add_to_path() {',
    '  local rc="$1"',
    "  local line='export PATH=\"$HOME/.local/bin:$PATH\"'",
    '  [ -f "$rc" ] || return',
    '  grep -qF "$HOME/.local/bin" "$rc" && return',
    '  { echo ""; echo "# QuickInstall"; echo "$line"; } >> "$rc"',
    '  echo "  ✓ PATH adicionado em $rc"',
    '}',
    '',
    '[ -f "$HOME/.bashrc" ]  && add_to_path "$HOME/.bashrc"',
    '[ -f "$HOME/.zshrc" ]   && add_to_path "$HOME/.zshrc"',
    '[ -f "$HOME/.profile" ] && add_to_path "$HOME/.profile"',
    '',
    '# Limpa arquivos temporários',
    'rm -rf "$TMP_DIR"',
    '',
    'echo ""',
    `echo "✓ ${binName} instalado em $BIN_DIR"`,
    'echo "  Rode: source ~/.bashrc  (ou abra um novo terminal)"',
  );

  return lines.join('\n');
}
