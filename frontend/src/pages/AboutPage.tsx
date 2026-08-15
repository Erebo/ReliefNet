import React from 'react';
import {
  Shield, GitBranch, Layers, Lock, Cpu, AlertCircle,
  Code2, Server, Database, BookOpen, Zap, Map
} from 'lucide-react';

interface Concept {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
  summary: string;
  file: string;
  element: string;
  description: string;
  snippet: string;
}

const CONCEPTS: Concept[] = [
  {
    id: 'encapsulation',
    label: 'Encapsulation',
    subtitle: 'OOP Pillar I',
    icon: Lock,
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    summary: 'Data and behaviour are bundled together inside a class. Internal state is hidden and only accessible through a controlled interface.',
    file: 'backend/app/models/report.py',
    element: 'class CommunityReport',
    description: 'All report fields are declared as SQLAlchemy Column descriptors — the ORM acts as the encapsulation boundary. External code cannot directly mutate the status field; changes must go through API endpoints that enforce the UNVERIFIED → VERIFIED → RELIEF_ASSIGNED lifecycle.',
    snippet: 'class CommunityReport(Base):\n    __tablename__ = "community_reports"\n\n    status  = Column(Enum(ReportStatus),\n                     default=ReportStatus.UNVERIFIED,\n                     nullable=False, index=True)\n    severity = Column(Enum(SeverityLevel),\n                      default=SeverityLevel.MODERATE)\n    # Only writable via API validation layer',
  },
  {
    id: 'inheritance',
    label: 'Inheritance',
    subtitle: 'OOP Pillar II',
    icon: GitBranch,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    summary: 'All database model classes inherit from a shared SQLAlchemy declarative base, acquiring connection management, query building, and relationship tracking without reimplementing them.',
    file: 'backend/app/models/institution.py',
    element: 'class Institution(Base)',
    description: 'Institution, CommunityReport, ReliefAssignment, and every other model extend SQLAlchemy\'s Base class. Base provides __init__, __repr__, session binding, metadata registration, and the full ORM query interface — inherited transparently by all models.',
    snippet: 'from backend.app.core.database import Base\n\nclass Institution(Base):\n    __tablename__ = "institutions"\n    id       = Column(Integer, primary_key=True)\n    name     = Column(String(255), nullable=False)\n    type     = Column(Enum(InstitutionType))\n    # Inherits: session, query(), metadata, relationships',
  },
  {
    id: 'polymorphism',
    label: 'Polymorphism',
    subtitle: 'OOP Pillar III',
    icon: Layers,
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
    summary: 'The same Enum type is used across multiple model columns — each column shares validation and serialisation behaviour while holding a different concrete member value at runtime.',
    file: 'backend/app/models/enums.py',
    element: 'InstitutionType, ReportStatus, SeverityLevel',
    description: 'A single set of Enum subclasses is used as a polymorphic type across Institution.type, CommunityReport.status, CommunityReport.severity, and ReliefAssignment columns. FastAPI\'s serialiser calls .value on whichever enum member is present at runtime — no branching required.',
    snippet: 'class InstitutionType(str, Enum):\n    SCHOOL = "school"\n    COLLEGE = "college"\n    NGO = "ngo"\n\nclass SeverityLevel(str, Enum):\n    MODERATE = "MODERATE"\n    SEVERE   = "SEVERE"\n    CRITICAL = "CRITICAL"',
  },
  {
    id: 'abstraction',
    label: 'Abstraction',
    subtitle: 'OOP Pillar IV',
    icon: Shield,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    summary: 'Complex implementation details are hidden behind a simple interface — callers work with a clean method or component without knowing the internal logic.',
    file: 'backend/app/services/gap_service.py',
    element: 'GapDetectionService',
    description: 'The entire gap detection algorithm — PostGIS spatial queries, cross-referencing verified reports against active assignments, severity weighting, and coverage scoring — is hidden inside a service class. API route handlers call a single method and receive structured results with no SQL knowledge required.',
    snippet: '# In the API route handler:\ngaps = gap_service.detect_coverage_gaps(\n    db=db,\n    district="Feni",\n    radius_km=10\n)\n# All PostGIS queries, joins, and scoring happen internally',
  },
  {
    id: 'multithreading',
    label: 'Multithreading',
    subtitle: 'Concurrent Processing',
    icon: Cpu,
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
    badgeColor: 'bg-sky-100 text-sky-700 border-sky-200',
    summary: 'The server handles multiple simultaneous requests without blocking, using Python\'s async/await cooperative concurrency model on Uvicorn\'s ASGI event loop.',
    file: 'backend/app/main.py',
    element: 'async def add_process_time_header()',
    description: 'Every incoming HTTP request is handled as an async coroutine. FastAPI delegates to Uvicorn which runs an event loop — multiple requests from different field operators are processed concurrently without one blocking another. The middleware measures each request\'s wall-clock time independently.',
    snippet: '@app.middleware("http")\nasync def add_process_time_header(request: Request, call_next):\n    start_time = time.time()\n    response = await call_next(request)  # non-blocking\n    ms = (time.time() - start_time) * 1000\n    response.headers["X-Process-Time-Ms"] = f"{ms:.2f}"\n    return response',
  },
  {
    id: 'exceptions',
    label: 'Exception Handling',
    subtitle: 'Error Safety',
    icon: AlertCircle,
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    summary: 'Exceptions are caught at multiple layers — startup, per-request middleware, and inside parsers — so a single failure never brings down the whole system.',
    file: 'backend/app/main.py',
    element: 'lifespan() + global HTTP middleware',
    description: 'The startup lifespan uses try/except/finally: seeding failures are logged but do not prevent the server from starting, and the finally block always closes the DB session. The HTTP middleware wraps every request in try/except — unhandled exceptions are logged with full traceback and the client receives a clean 500 JSON instead of a raw crash.',
    snippet: '# Startup: try/except/finally\ntry:\n    seed_geographic_data_if_empty(db, data_dir="data")\nexcept Exception as e:\n    logger.error(f"Seeding failed: {e}", exc_info=True)\nfinally:\n    db.close()   # always runs\n\n# Per-request: catch-all middleware\nexcept Exception as exc:\n    logger.error(str(exc), exc_info=True)\n    return JSONResponse(status_code=500, ...)',
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

const StackChip: React.FC<{ icon: React.ElementType; label: string; sub: string; iconBg: string }> = ({ icon: Icon, label, sub, iconBg }) => (
  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
    <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <div className="text-xs font-bold text-slate-900">{label}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  </div>
);

const ConceptCard: React.FC<{ concept: Concept }> = ({ concept }) => {
  const Icon = concept.icon;
  return (
    <div className={`rounded-2xl border ${concept.borderColor} bg-white shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${concept.bgColor} px-5 py-4 flex items-start gap-3`}>
        <div className={`p-2.5 rounded-xl border ${concept.borderColor} bg-white/60 flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${concept.textColor}`} />
        </div>
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${concept.badgeColor}`}>
            {concept.subtitle}
          </span>
          <h3 className="text-base font-black text-slate-900 mt-1">{concept.label}</h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">{concept.summary}</p>
        </div>
      </div>

      {/* Example */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Code2 className="w-3.5 h-3.5 text-slate-400" />
          <code className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            {concept.file}
          </code>
          <span className={`text-[11px] font-bold ${concept.textColor}`}>{concept.element}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{concept.description}</p>
        <pre className="text-[11px] font-mono bg-slate-900 text-emerald-300 rounded-xl px-4 py-3 overflow-x-auto border border-slate-800 leading-relaxed">
{concept.snippet}
        </pre>
      </div>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────
export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

      {/* Stack */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Technology Stack</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StackChip icon={Server}   label="FastAPI / Python 3.11" sub="REST API Backend"    iconBg="bg-emerald-600" />
          <StackChip icon={Map}      label="React + MapLibre GL"   sub="Geospatial Frontend" iconBg="bg-sky-500" />
          <StackChip icon={Database} label="PostgreSQL + PostGIS"  sub="Spatial Database"    iconBg="bg-indigo-600" />
          <StackChip icon={Code2}    label="Docker Compose"        sub="Containerised Stack" iconBg="bg-slate-600" />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <div className="flex items-center gap-2 px-3">
          <Zap className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Concept Breakdown</span>
        </div>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {CONCEPTS.map(concept => (
          <ConceptCard key={concept.id} concept={concept} />
        ))}
      </div>

      <div className="text-center pb-4">
        <p className="text-[11px] text-slate-400">
          ReliefNet · Bangladesh Flood Relief Coordination · v1.0.0
        </p>
      </div>

    </div>
  );
};
