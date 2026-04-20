'use client';
// Depois (import relativo, funciona sempre):
import { generateScript, detectType, PackageType, ScriptOptions } from './generateScript';

const DEFAULT_OPTS: ScriptOptions = {
  proxyEnabled: false,
  quad9Enabled: false,
  checksumEnabled: false,
};

export default function Home() {
  const [hostedUrl, setHostedUrl]   = useState('');
  const [fileType, setFileType]     = useState<PackageType>('tar.gz');
  const [opts, setOpts]             = useState<ScriptOptions>(DEFAULT_OPTS);
  const [script, setScript]         = useState('');
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quando URL ou opções mudam, regenera o script automaticamente
  const updateScript = useCallback(
    (url: string, type: PackageType, options: ScriptOptions) => {
      if (!url) return;
      setScript(generateScript(url, type, options));
    },
    []
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
    setUploadMsg('Enviando para Litterbox…');

    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('time', '1h');          // expira em 1 hora
    fd.append('fileToUpload', file, file.name);

    try {
      // Chama nossa rota de proxy para evitar CORS
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

  const installCmd = hostedUrl
    ? `curl -fsSL ${hostedUrl} | bash`
    : '';

  return (
    <main className="min-h-screen bg-[#0a0c0a] text-[#00e57a] font-mono p-6 max-w-2xl mx-auto">
      {/* Área de drag-and-drop */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-[#00e57a] bg-[#001f0f]'
            : 'border-[#1e2a1e] hover:border-[#2a3d2a]'}`}
      >
        <input ref={inputRef} type="file"
          accept=".deb,.tar.gz,.tgz,.tar.xz,.zip"
          className="hidden"
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
        />
        <p className="text-2xl mb-2">📦</p>
        <p>Arraste o pacote ou <strong className="text-[#00ff8a]">clique</strong></p>
        <p className="text-sm text-gray-500 mt-1">.deb · .tar.gz · .tar.xz · .zip</p>
      </div>

      {uploadMsg && (
        <p className={`mt-3 text-sm p-3 rounded border ${
          uploadMsg.startsWith('✓')
            ? 'border-[#004d29] bg-[#001f0f]'
            : 'border-red-900 bg-red-950 text-red-400'
        }`}>{uploadMsg}</p>
      )}

      {/* Toggles de opções avançadas */}
      <section className="mt-6 space-y-2">
        {([
          ['proxyEnabled',   '🔀 URL Unblocker', 'Roteia via proxy para contornar bloqueios de rede'],
          ['quad9Enabled',   '🔒 Privacidade Quad9', 'Resolve DNS via DoH 9.9.9.9 antes do download'],
          ['checksumEnabled','✅ Verificar SHA256', 'Solicita e valida hash antes de extrair'],
        ] as const).map(([key, label, desc]) => (
          <div key={key}
            onClick={() => toggleOpt(key)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${opts[key] ? 'border-[#00b85e] bg-[#001f0f]' : 'border-[#1e2a1e] hover:border-[#2a3d2a]'}`}>
            <div className={`w-9 h-5 rounded-full relative transition-colors
              ${opts[key] ? 'bg-[#004d29]' : 'bg-[#1a1f1a]'}`}>
              <span className={`absolute w-3.5 h-3.5 rounded-full top-[3px] transition-all
                ${opts[key] ? 'left-[18px] bg-[#00e57a]' : 'left-[3px] bg-gray-600'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Script gerado */}
      {script && (
        <section className="mt-6">
          <pre className="bg-[#0f120f] border border-[#1e2a1e] rounded-lg p-4 text-xs
            overflow-auto max-h-72 text-gray-400 leading-relaxed">{script}</pre>

          <div className="mt-3 flex items-center gap-2 bg-black border border-[#1e2a1e]
            rounded-lg p-3 font-mono">
            <code className="flex-1 text-sm text-[#00e57a] truncate">{installCmd}</code>
            <button
              onClick={() => navigator.clipboard.writeText(installCmd)}
              className="text-xs border border-[#1e2a1e] hover:border-[#00e57a]
                px-3 py-1.5 rounded transition-colors">
              copiar
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
