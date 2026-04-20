'use client';
import { useState, useCallback, useRef } from 'react';
import { generateScript, detectType, PackageType, ScriptOptions } from './generateScript';

// ── Constantes de tema — evita repetição de hex strings
const C = {
  bg:      '#0a0c0a',
  panel:   '#0f120f',
  raised:  '#1a1f1a',
  green:   '#00e57a',
  bright:  '#00ff8a',
  muted:   '#00b85e',
  dark:    '#004d29',
  border:  '#1e2a1e',
  border2: '#2a3d2a',
  dim:     '#666666',
  error:   '#ff4d4d',
  errBg:   '#1a0000',
  errBrd:  '#4d0000',
};

const DEFAULT_OPTS: ScriptOptions = {
  proxyEnabled:    false,
  quad9Enabled:    false,
  checksumEnabled: false,
};

// ── Estilos inline reutilizáveis
const S = {
  // Wrapper raiz
  main: {
    minHeight: '100vh',
    background: C.bg,
    color: C.green,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    padding: '2rem 1.5rem',
    maxWidth: '720px',
    margin: '0 auto',
    boxSizing: 'border-box' as const,
  },
  // Cabeçalho
  header: {
    borderBottom: `1px solid ${C.border2}`,
    paddingBottom: '1rem',
    marginBottom: '1.5rem',
  },
  logo: {
    fontFamily: "'Syne', 'Inter', sans-serif",
    fontSize: '26px',
    fontWeight: 800,
    color: C.green,
    letterSpacing: '-0.5px',
    margin: 0,
  },
  logoAccent: { color: C.bright },
  badge: {
    display: 'inline-block',
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '4px',
    border: `1px solid ${C.muted}`,
    background: C.dark,
    color: C.green,
    marginLeft: '10px',
    verticalAlign: 'middle',
  },
  tagline: {
    fontSize: '12px',
    color: C.dim,
    marginTop: '6px',
    letterSpacing: '0.3px',
  },
  prompt: { color: C.muted },
  // Seção
  sectionLabel: {
    fontSize: '10px',
    color: C.dim,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  labelLine: {
    flex: 1,
    height: '1px',
    background: C.border,
  },
  // Drop zone
  dropZone: (dragging: boolean) => ({
    border: `1.5px dashed ${dragging ? C.green : C.border2}`,
    borderRadius: '8px',
    padding: '3rem 1rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    background: dragging ? '#001f0f' : C.panel,
    transition: 'all 0.2s',
    position: 'relative' as const,
  }),
  dropIcon: { fontSize: '36px', display: 'block', marginBottom: '12px' },
  dropText: { fontSize: '13px', color: C.dim, lineHeight: 1.6 },
  dropAccent: { color: C.bright, fontWeight: 600 },
  pill: {
    display: 'inline-block',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '3px',
    border: `1px solid ${C.border2}`,
    color: C.dim,
    margin: '0 2px',
  },
  // Status messages
  statusOk: {
    fontSize: '12px',
    padding: '10px 12px',
    borderRadius: '6px',
    border: `1px solid ${C.dark}`,
    background: '#001f0f',
    color: C.green,
    marginTop: '10px',
    wordBreak: 'break-all' as const,
  },
  statusErr: {
    fontSize: '12px',
    padding: '10px 12px',
    borderRadius: '6px',
    border: `1px solid ${C.errBrd}`,
    background: C.errBg,
    color: C.error,
    marginTop: '10px',
  },
  // Toggle row
  toggleRow: (active: boolean) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    border: `1px solid ${active ? C.muted : C.border}`,
    borderRadius: '8px',
    background: active ? '#001f0f' : C.panel,
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '8px',
  }),
  switchTrack: (active: boolean) => ({
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    border: `1px solid ${active ? C.muted : C.border2}`,
    background: active ? C.dark : C.raised,
    position: 'relative' as const,
    flexShrink: 0,
    marginTop: '2px',
    transition: 'all 0.2s',
  }),
  switchThumb: (active: boolean) => ({
    position: 'absolute' as const,
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    top: '2px',
    left: active ? '18px' : '2px',
    background: active ? C.green : '#555',
    transition: 'all 0.2s',
  }),
  toggleTitle: {
    fontSize: '13px',
    color: C.green,
    fontWeight: 500,
    marginBottom: '3px',
  },
  toggleDesc: { fontSize: '11px', color: C.dim, lineHeight: 1.5 },
  // Script box
  scriptBox: {
    background: '#050705',
    border: `1px solid ${C.border2}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  scriptHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: C.panel,
    borderBottom: `1px solid ${C.border}`,
  },
  scriptDots: { display: 'flex', gap: '5px', alignItems: 'center' },
  dot: (color: string) => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: color,
  }),
  scriptFilename: { fontSize: '11px', color: C.dim },
  scriptPre: {
    padding: '1rem',
    fontSize: '11px',
    lineHeight: 1.65,
    color: '#7a9e7a',
    whiteSpace: 'pre' as const,
    overflowX: 'auto' as const,
    maxHeight: '320px',
    overflowY: 'auto' as const,
    margin: 0,
  },
  // Comando final
  cmdBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#000',
    border: `1px solid ${C.border2}`,
    borderRadius: '8px',
    padding: '10px 14px',
    marginTop: '10px',
  },
  cmdText: {
    flex: 1,
    fontSize: '13px',
    color: C.green,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  // Botões
  btn: {
    background: 'transparent',
    border: `1px solid ${C.border2}`,
    color: C.dim,
    fontFamily: 'inherit',
    fontSize: '11px',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  btnPrimary: {
    background: 'transparent',
    border: `1px solid ${C.green}`,
    color: C.green,
    fontFamily: 'inherit',
    fontSize: '11px',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: '2rem',
    border: `1px dashed ${C.border}`,
    borderRadius: '8px',
    color: C.dim,
    fontSize: '12px',
  },
  // Footer
  footer: {
    borderTop: `1px solid ${C.border}`,
    marginTop: '3rem',
    paddingTop: '1rem',
    textAlign: 'center' as const,
    fontSize: '11px',
    color: C.dim,
  },
  section: { marginBottom: '1.25rem' },
};

export default function Home() {
  const [hostedUrl, setHostedUrl]   = useState('');
  const [fileType, setFileType]     = useState<PackageType>('tar.gz');
  const [opts, setOpts]             = useState<ScriptOptions>(DEFAULT_OPTS);
  const [script, setScript]         = useState('');
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [tab, setTab]               = useState<'upload' | 'manual'>('upload');
  const [manualUrl, setManualUrl]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const updateScript = useCallback(
    (url: string, type: PackageType, options: ScriptOptions) => {
      if (!url) return;
      setScript(generateScript(url, type, options));
    }, []
  );

  const toggleOpt = (key: keyof ScriptOptions) => {
    const next = { ...opts, [key]: !opts[key] };
    setOpts(next);
    if (hostedUrl) updateScript(hostedUrl, fileType, next);
  };

  const uploadFile = async (file: File) => {
    const type = detectType(file.name);
    setFileType(type);
    setUploading(true);
    setUploadMsg('⟳ Enviando para Litterbox…');
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('time', '1h');
    fd.append('fileToUpload', file, file.name);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Falha no upload');
      setHostedUrl(data.url);
      setUploadMsg(`✓ Hospedado: ${data.url}`);
      updateScript(data.url, type, opts);
    } catch (e: any) {
      setUploadMsg(`✗ Erro: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) uploadFile(f);
  };

  const handleManual = () => {
    if (!manualUrl.trim()) return;
    const type = detectType(manualUrl.split('/').pop() ?? 'pkg.tar.gz');
    setFileType(type);
    setHostedUrl(manualUrl.trim());
    updateScript(manualUrl.trim(), type, opts);
  };

  const copyCmd = () => {
    const cmd = `curl -fsSL ${hostedUrl} | bash`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const copyScript = () => navigator.clipboard.writeText(script);

  const tabStyle = (active: boolean) => ({
    background: 'transparent',
    border: `1px solid ${active ? C.green : C.border}`,
    color: active ? C.green : C.dim,
    fontFamily: 'inherit',
    fontSize: '11px',
    padding: '5px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    background2: active ? C.dark : 'transparent',
  });

  return (
    <>
      {/* Fonte externa via style tag — independente de next/font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0c0a; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a0c0a; }
        ::-webkit-scrollbar-thumb { background: #1e2a1e; border-radius: 3px; }
        ::selection { background: rgba(0,229,122,0.15); color: #00ff8a; }
      `}</style>

      <main style={S.main}>

        {/* ── Cabeçalho */}
        <header style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={S.logo}>
              Quick<span style={S.logoAccent}>Install</span>
            </h1>
            <span style={S.badge}>v1.0.0</span>
          </div>
          <p style={S.tagline}>
            <span style={S.prompt}>~$ </span>
            upload · host · install · sem sudo, sem drama
          </p>
        </header>

        {/* ── Tabs */}
        <div style={{ ...S.section, display: 'flex', gap: '6px' }}>
          {(['upload', 'manual'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'transparent',
              border: `1px solid ${tab === t ? C.green : C.border}`,
              color: tab === t ? C.green : C.dim,
              fontFamily: 'inherit',
              fontSize: '11px',
              padding: '5px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              {t === 'upload' ? 'upload arquivo' : 'url manual'}
            </button>
          ))}
        </div>

        {/* ── Upload */}
        {tab === 'upload' && (
          <div style={S.section}>
            <div
              style={S.dropZone(isDragging)}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file"
                accept=".deb,.tar.gz,.tgz,.tar.xz,.zip"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
              />
              <span style={S.dropIcon}>{uploading ? '⏳' : '📦'}</span>
              <p style={S.dropText}>
                {uploading
                  ? 'Enviando…'
                  : <><span style={S.dropAccent}>Arraste o pacote</span> ou clique para selecionar</>
                }
              </p>
              <p style={{ marginTop: '8px' }}>
                {['.deb', '.tar.gz', '.tar.xz', '.tgz', '.zip'].map(ext => (
                  <span key={ext} style={S.pill}>{ext}</span>
                ))}
              </p>
            </div>
            {uploadMsg && (
              <p style={uploadMsg.startsWith('✓') ? S.statusOk : S.statusErr}>
                {uploadMsg}
              </p>
            )}
          </div>
        )}

        {/* ── URL Manual */}
        {tab === 'manual' && (
          <div style={S.section}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManual()}
                placeholder="https://files.catbox.moe/abc123.deb"
                style={{
                  flex: 1,
                  background: C.panel,
                  border: `1px solid ${C.border2}`,
                  color: C.green,
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
              <button onClick={handleManual} style={S.btnPrimary}>
                gerar
              </button>
            </div>
          </div>
        )}

        {/* ── Opções Avançadas */}
        <div style={S.section}>
          <div style={S.sectionLabel}>
            opções avançadas <span style={S.labelLine} />
          </div>
          {([
            ['proxyEnabled',    '🔀 URL Unblocker',       'Roteia o download via proxy para contornar bloqueios de rede'],
            ['quad9Enabled',    '🔒 Privacidade Quad9',    'Resolve DNS via DoH 9.9.9.9 antes do download'],
            ['checksumEnabled', '✅ Verificar SHA256',     'Solicita e valida hash antes de extrair o pacote'],
          ] as const).map(([key, label, desc]) => (
            <div key={key} style={S.toggleRow(opts[key])} onClick={() => toggleOpt(key)}>
              <div style={S.switchTrack(opts[key])}>
                <span style={S.switchThumb(opts[key])} />
              </div>
              <div>
                <p style={S.toggleTitle}>{label}</p>
                <p style={S.toggleDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Script gerado */}
        <div style={S.section}>
          <div style={S.sectionLabel}>
            script gerado <span style={S.labelLine} />
          </div>

          {!script ? (
            <div style={S.emptyState}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px', opacity: 0.3 }}>⚡</span>
              faça upload ou cole uma URL para gerar o script de instalação
            </div>
          ) : (
            <>
              <div style={S.scriptBox}>
                <div style={S.scriptHeader}>
                  <div style={S.scriptDots}>
                    <span style={S.dot('#ff5f56')} />
                    <span style={S.dot('#ffbd2e')} />
                    <span style={S.dot('#27c93f')} />
                  </div>
                  <span style={S.scriptFilename}>install.sh</span>
                  <button style={S.btn} onClick={copyScript}>copiar script</button>
                </div>
                <pre style={S.scriptPre}>{script}</pre>
              </div>

              <div style={S.cmdBox}>
                <code style={S.cmdText}>curl -fsSL {hostedUrl} | bash</code>
                <button style={copied ? { ...S.btnPrimary, color: C.bright } : S.btnPrimary} onClick={copyCmd}>
                  {copied ? '✓ copiado' : 'copiar'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Footer */}
        <footer style={S.footer}>
          <span style={{ color: `${C.green}44` }}>~/</span> QuickInstall ·
          arquivos expiram em 1h ·{' '}
          <a href="https://litterbox.catbox.moe" target="_blank" rel="noopener noreferrer"
            style={{ color: C.dim, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            litterbox.moe
          </a>
        </footer>

      </main>
    </>
  );
}
