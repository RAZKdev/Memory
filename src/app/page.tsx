import Link from "next/link";
import {
  Archive,
  Database,
  ShieldCheck,
  GitBranch,
  Layers,
  Search,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const coreEntities = [
    {
      name: "ProjectScope",
      desc: "Mendefinisikan batasan privat dan kebijakan berbagi lintas proyek secara eksplisit.",
      icon: Layers,
    },
    {
      name: "Memory & MemoryVersion",
      desc: "Unit kanonikal konteks teknis dengan riwayat snapshot versi audit yang kekal.",
      icon: Archive,
    },
    {
      name: "Source & Provenance",
      desc: "Sitasi rujukan tingkat pertama untuk PR, RFC, dan dokumen spesifikasi.",
      icon: BookOpen,
    },
    {
      name: "Derived Embeddings",
      desc: "Representasi vektor yang diperlakukan murni sebagai data turunan non-kanonikal.",
      icon: Database,
    },
    {
      name: "Decisions & ADRs",
      desc: "Catatan keputusan arsitektural yang tertaut secara deterministik ke memori.",
      icon: GitBranch,
    },
    {
      name: "Access Policies",
      desc: "Model akses privat default dengan penegakan batasan isolasi eksplisit.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-archive-border bg-archive-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-archive-accent/40 bg-archive-subtle flex items-center justify-center text-archive-accent">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-archive-primary tracking-wide text-sm font-mono">
                MemoryVault
              </span>
              <span className="ml-2 text-xs font-mono text-archive-muted px-1.5 py-0.5 rounded bg-archive-subtle border border-archive-border">
                v0.1.0-alpha
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2" aria-label="Main Navigation">
            <Link
              href="/memories"
              className="text-xs font-semibold text-archive-accent hover:text-archive-accentHover px-2.5 py-1.5 rounded transition-colors"
            >
              Memori
            </Link>
            <Link
              href="/decisions"
              className="text-xs font-semibold text-archive-accent hover:text-archive-accentHover px-2.5 py-1.5 rounded transition-colors"
            >
              Keputusan (ADR)
            </Link>
            <Link
              href="/collections"
              className="text-xs font-semibold text-archive-accent hover:text-archive-accentHover px-2.5 py-1.5 rounded transition-colors"
            >
              Koleksi & Ekspor AI
            </Link>
            <Link
              href="/projects"
              className="text-xs font-semibold text-archive-accent hover:text-archive-accentHover px-2.5 py-1.5 rounded transition-colors"
            >
              Proyek & Tata Kelola
            </Link>
            <Link
              href="#domain"
              className="text-xs font-medium text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Model Domain
            </Link>
            <Link
              href="#specs"
              className="text-xs font-medium text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Spesifikasi
            </Link>
            <div className="h-4 w-px bg-archive-border mx-1" />
            <Link
              href="/memories"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-archive-primary bg-archive-subtle hover:bg-archive-border/60 border border-archive-border px-3 py-1.5 rounded transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 text-archive-accent" />
              <span>Buka Arsip</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-12 md:py-16 w-full flex-1">
        <section className="mb-14">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono text-archive-accent bg-archive-subtle border border-archive-border mb-6">
            <span className="w-2 h-2 rounded-full bg-archive-accent animate-pulse" />
            Arsip Teknis Privat
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-archive-primary max-w-3xl leading-tight">
            Sistem memori dan konteks teknis lintas proyek yang deterministik.
          </h1>
          <p className="mt-4 text-base md:text-lg text-archive-secondary max-w-2xl leading-relaxed">
            Mendokumentasikan keputusan proyek, catatan teknis, dan verifikasi sumber
            rujukan untuk rekayasa berbasis AI tanpa halusinasi.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/memories"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-archive-accent hover:bg-archive-accentHover text-archive-bg font-semibold text-xs font-mono transition-colors shadow-sm"
            >
              <span>Jelajahi Memori</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/decisions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-archive-subtle hover:bg-archive-border text-archive-primary border border-archive-border text-xs font-mono transition-colors"
            >
              <span>Telusuri ADR</span>
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-archive-subtle hover:bg-archive-border text-archive-accent border border-archive-border text-xs font-mono transition-colors"
            >
              <span>Paket Konteks AI</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-archive-subtle hover:bg-archive-border text-archive-secondary hover:text-archive-primary border border-archive-border text-xs font-mono transition-colors"
            >
              <span>Scope & Kebijakan</span>
            </Link>
          </div>
        </section>

        {/* Core Entities Grid */}
        <section id="domain" className="mb-16">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-archive-border">
            <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted">
              Entitas Model Domain
            </h2>
            <span className="text-xs font-mono text-archive-emerald">
              Ditegakkan dengan TypeScript Murni
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreEntities.map((entity) => {
              const Icon = entity.icon;
              return (
                <div
                  key={entity.name}
                  className="p-5 rounded-lg border border-archive-border bg-archive-card hover:border-archive-borderHover transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 rounded border border-archive-border bg-archive-subtle flex items-center justify-center text-archive-secondary group-hover:text-archive-accent group-hover:border-archive-accent/30 transition-colors mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-archive-primary font-mono mb-1.5">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-archive-secondary leading-relaxed">
                      {entity.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Specifications Checklist */}
        <section id="specs" className="p-6 rounded-lg border border-archive-border bg-archive-card/50">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-archive-emerald" />
            <h2 className="text-sm font-semibold text-archive-primary font-mono">
              Jaminan Berbasis Repositori
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-archive-secondary">
            <li className="flex items-start gap-2">
              <span className="text-archive-emerald font-bold">✓</span>
              <span>Isolasi privat default antar scope proyek</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-archive-emerald font-bold">✓</span>
              <span>Riwayat versi kekal (immutable) pada setiap revisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-archive-emerald font-bold">✓</span>
              <span>Embedding murni sebagai data turunan, bukan kebenaran mutlak</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-archive-emerald font-bold">✓</span>
              <span>Invarian bisnis deterministik yang teruji secara ketat</span>
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-archive-border bg-archive-bg/80 py-6 text-center text-xs text-archive-muted">
        <p>Fondasi Arsitektur MemoryVault — Next.js App Router + TypeScript + Tailwind</p>
      </footer>
    </div>
  );
}
