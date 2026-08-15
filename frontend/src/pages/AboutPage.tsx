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
    summary: 'Internal state is kept protected (prefixed with _), preventing direct external tampering. State transitions and validation rules are strictly enforced through class methods.',
    file: 'Domain Model: SMS Distress Report',
    element: 'class SMSReport',
    description: 'The SMSReport class protects its internal _status and _verified_households attributes. Callers cannot mutate status directly; they must call mark_verified(), which validates input boundaries and controls the state lifecycle.',
    snippet: `class SMSReport:
    def __init__(self, phone: str, message: str):
        if not phone.startswith("+880"):
            raise ValueError("Invalid Bangladesh phone number format")
        self.phone = phone
        self.message = message
        self._status = "PENDING"          # Protected internal state
        self._verified_households = 0

    def mark_verified(self, households: int):
        if households <= 0:
            raise ValueError("Households count must be greater than zero")
        self._verified_households = households
        self._status = "VERIFIED"

    @property
    def status(self) -> str:
        return self._status`,
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
    summary: 'Subclasses inherit shared attributes and shelter methods from a parent Institution class, promoting code reuse while adding domain-specific fields and behaviors.',
    file: 'Domain Model: Shelter Hierarchy',
    element: 'class School(Institution) & College(Institution)',
    description: 'School and College inherit common attributes (name, upazila, capacity) and the open_as_shelter() method from the Institution base class using super().__init__(), while adding classroom conversion logic unique to schools.',
    snippet: `class Institution:
    def __init__(self, name: str, upazila: str, capacity: int):
        self.name = name
        self.upazila = upazila
        self.capacity = capacity

    def open_as_shelter(self):
        print(f"Opened {self.name} as shelter for {self.capacity} persons")

# Subclass inherits from Institution base
class School(Institution):
    def __init__(self, name: str, upazila: str, capacity: int, classrooms: int):
        super().__init__(name, upazila, capacity)  # Inherit parent attributes
        self.classrooms = classrooms

    def convert_classrooms(self):
        print(f"Converted {self.classrooms} classrooms into emergency beds")`,
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
    summary: 'Different classes implement the same method interface, allowing runtime dynamic dispatch over collections without conditional branching.',
    file: 'Domain Model: Dynamic Contact Protocol',
    element: 'inst.contact_team() Dynamic Dispatch',
    description: 'Both School and NGO classes implement their own contact_team() method. When iterating through a mixed list of institutions, Python dynamically executes the appropriate class implementation at runtime.',
    snippet: `class School(Institution):
    def contact_team(self):
        print(f"Calling Headmaster at {self.name}...")

class NGO(Institution):
    def contact_team(self):
        print(f"Calling Relief Dispatch Coordinator at {self.name}...")

# Dynamic runtime dispatch across heterogeneous objects
verification_points = [
    School("Sonagazi Model High", "Feni", 850, 14),
    NGO("BDRCS Sonagazi Unit", "Feni", 500)
]
for inst in verification_points:
    inst.contact_team()  # Polymorphic invocation without if/else`,
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
    summary: 'Abstract base classes enforce structural contracts and template methods, hiding complex internal cargo calculations and route validation from callers.',
    file: 'Domain Model: Relief Operations Pipeline',
    element: 'class ReliefOperation(ABC)',
    description: 'ReliefOperation is an Abstract Base Class (ABC) with an abstract calculate_cargo() method and a concrete dispatch() template method. Callers invoke dispatch() without needing to understand the underlying cargo math.',
    snippet: `from abc import ABC, abstractmethod

class ReliefOperation(ABC):
    def __init__(self, destination: str, target_households: int):
        self.destination = destination
        self.households = target_households

    @abstractmethod
    def calculate_cargo(self) -> dict:
        """Enforced interface: subclasses must compute cargo specs"""
        pass

    def dispatch(self):
        # Caller only invokes dispatch(); complex computation is abstracted
        cargo = self.calculate_cargo()
        print(f"Dispatched relief to {self.destination}: {cargo}")

class FloodReliefOperation(ReliefOperation):
    def calculate_cargo(self) -> dict:
        return {"food_packs": self.households * 2, "water_liters": self.households * 10}`,
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
    summary: 'Concurrent worker threads parse, validate, and ingest high-volume incoming distress SMS messages simultaneously without blocking the main event loop.',
    file: 'SMS Ingestion Engine: Parallel Worker Threads',
    element: 'ThreadPoolExecutor / Worker Threads',
    description: 'During a flood crisis, hundreds of SMS messages arrive per minute. ThreadPoolExecutor distributes the computationally heavy Bangla text normalization, regex location extraction, and urgency scoring across concurrent worker threads.',
    snippet: `import concurrent.futures
from backend.app.sms.parser import parse_sms_report

def process_sms_worker(sms: dict) -> dict:
    """Thread worker: parses text & extracts entities independently"""
    return parse_sms_report(sender=sms["phone"], raw_message=sms["text"])

# Concurrent batch SMS ingestion across worker threads
incoming_batch = [
    {"phone": "+8801711...", "text": "সোনাগাজী ৩ ফুট পানি খাবার দরকার"},
    {"phone": "+8801822...", "text": "ফুলগাজী জরুরি নৌকা ও স্যালাইন চাই"},
    {"phone": "+8801933...", "text": "পরশুরাম ২০ পরিবার পানিবন্দী"}
]

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(process_sms_worker, incoming_batch))`,
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
    summary: 'Custom domain exceptions prevent illegal dispatches, with try-catch-finally blocks ensuring audit trail integrity and automatic emergency fallback routing.',
    file: 'Error Safety: Custom Exceptions & Fallback Handling',
    element: 'Custom Exceptions & Try-Except-Finally',
    description: 'Custom exceptions (UnverifiedAreaException, RoadSubmergedException) protect critical business invariants. Catch blocks activate boat rerouting when roads are submerged, while finally blocks guarantee audit log writes.',
    snippet: `# Custom Domain Exceptions
class UnverifiedAreaException(Exception):
    """Raised when dispatch is attempted on an unverified report"""
    pass

class RoadSubmergedException(Exception):
    """Raised when primary transit highway is flooded"""
    pass

# Safe Execution with Fallback & Guaranteed Audit Logging
try:
    if not report.is_verified:
        raise UnverifiedAreaException("Ground verification required before dispatch")
    validate_road_transit(destination)
except RoadSubmergedException:
    print("Highway submerged: Rerouting convoy via Army Rescue Boats")
except UnverifiedAreaException as e:
    logger.error(f"Dispatch blocked: {e}")
finally:
    db.commit()  # Guaranteed audit trail logging`,
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
