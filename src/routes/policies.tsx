import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, FlaskRound, Truck, HardHat, Siren } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Safety & Fleet Policies | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Written safety and fleet policies: Injury & Illness Prevention Program, Drug & Alcohol Policy, and Fleet Safety Policy.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Policies />
    </RequireAuth>
  ),
});

const COMPANY = "DunRite Construction Group LLC";

type Section = { title: string; body: string };
type Policy = {
  id: string;
  label: string;
  title: string;
  icon: typeof ShieldCheck;
  intro: string;
  sections: Section[];
  acknowledgment: string;
};

// Written policy documents. These pair with the handbook acknowledgment forms
// (Safety Program, Drug & Alcohol, Driver Agreement) on the Handbook Forms page:
// the employee signs the acknowledgment there; the program text lives here.
// Bracketed placeholders are meant to be filled in by the company.
const POLICIES: Policy[] = [
  {
    id: "iipp",
    label: "Safety Program",
    title: "Injury & Illness Prevention Program (Safety & Health Program)",
    icon: ShieldCheck,
    intro: `${COMPANY} is committed to providing a safe and healthful workplace for every employee. This written Injury & Illness Prevention Program (IIPP) describes how we identify, evaluate, and correct workplace hazards and how we train and hold employees accountable for safe work. It applies to all employees, jobsites, vehicles, and equipment.`,
    sections: [
      {
        title: "1. Policy & Responsibility",
        body: `Safety is a core operating value and takes priority over production. The designated Safety Coordinator [insert name/title and contact] has overall authority and responsibility for implementing this program. Supervisors are responsible for enforcing safe work practices in their areas, correcting hazards, and modeling safe behavior. Every employee is responsible for following safety rules, using required protective equipment, and reporting hazards, injuries, and near misses promptly.`,
      },
      {
        title: "2. Compliance",
        body: `All employees must comply with this program and all applicable OSHA and company safety rules. Compliance is recognized through performance reviews and may be reinforced through training, and where necessary, corrective/disciplinary action up to and including termination. Reporting an unsafe condition in good faith will never result in retaliation.`,
      },
      {
        title: "3. Hazard Identification & Inspection",
        body: `Workplace hazards are identified through scheduled and periodic jobsite inspections, pre-use equipment and vehicle inspections, review of new equipment, materials, or processes, and investigation of incidents and employee reports. Inspections are documented and any hazards found are tracked to correction.`,
      },
      {
        title: "4. Hazard Correction",
        body: `Identified hazards are corrected in a timely manner based on the severity of the exposure. When a hazard cannot be corrected immediately, interim protective measures are put in place and affected employees are informed until the hazard is abated.`,
      },
      {
        title: "5. Incident & Accident Investigation",
        body: `All injuries, illnesses, accidents, and near misses are reported and investigated using the company's Incident & Accident reporting process to determine root cause and prevent recurrence. Findings are used to update training, procedures, and hazard controls.`,
      },
      {
        title: "6. Training & Communication",
        body: `Employees are trained at hire, when given new assignments, when new hazards are introduced, and whenever the program is updated. Safety is communicated through orientations, toolbox/tailgate talks, postings, and this written program, which is readily available to all employees. Employees are encouraged to raise safety concerns without fear of reprisal.`,
      },
      {
        title: "7. Recordkeeping",
        body: `The company maintains records of inspections (including the hazards identified and their correction) and of safety training (who was trained, when, and on what). Records are retained in accordance with applicable regulations and made available to employees and regulators as required.`,
      },
      {
        title: "8. Program Review",
        body: `This program is reviewed periodically and updated as operations, equipment, regulations, or jobsite conditions change.`,
      },
    ],
    acknowledgment:
      "Employees acknowledge this program on the Safety Program acknowledgment form (see Handbook Forms).",
  },
  {
    id: "drug-alcohol",
    label: "Drug & Alcohol",
    title: "Drug & Alcohol Policy",
    icon: FlaskRound,
    intro: `${COMPANY} is committed to a drug- and alcohol-free workplace in the interest of the safety of our employees, the public, and our operations. This policy applies to all employees and, where applicable, to safety-sensitive and DOT-regulated drivers.`,
    sections: [
      {
        title: "1. Prohibited Conduct",
        body: `The use, possession, sale, distribution, or being under the influence of alcohol or unlawful drugs while on company time, on company property, on a jobsite, or while operating any company or personal vehicle or equipment for company business is strictly prohibited. The misuse of legal or prescription drugs in a way that impairs safe performance is also prohibited.`,
      },
      {
        title: "2. Covered Workers",
        body: `This policy covers all employees. Drivers who operate commercial motor vehicles requiring a CDL are additionally subject to the U.S. DOT/FMCSA drug and alcohol testing regulations (49 CFR Part 382 and Part 40), which control where they apply.`,
      },
      {
        title: "3. Testing",
        body: `Consistent with applicable law, the company may require drug and/or alcohol testing on a pre-employment, reasonable-suspicion, post-accident, random (for DOT-covered drivers), and return-to-duty/follow-up basis. Refusal to test, tampering, or a verified positive result is treated as a violation of this policy.`,
      },
      {
        title: "4. Prescription & Over-the-Counter Medication",
        body: `Employees taking prescription or OTC medication that may impair their ability to work safely must consult their physician about working safely and notify their supervisor of any work restrictions (without disclosing the underlying medical condition) before performing safety-sensitive work.`,
      },
      {
        title: "5. Consequences",
        body: `Violation of this policy may result in disciplinary action up to and including termination. DOT-covered drivers who violate the testing rules will be immediately removed from safety-sensitive functions and may not return until they complete the return-to-duty process under 49 CFR Part 40.`,
      },
      {
        title: "6. Confidentiality & Assistance",
        body: `Testing records and related medical information are kept confidential and disclosed only as permitted by law. Employees who believe they have a substance-abuse problem are encouraged to seek help; available assistance resources are [insert EAP / resource information].`,
      },
      {
        title: "7. Designated Employer Representative",
        body: `The company's Designated Employer Representative (DER) for drug and alcohol program administration is [insert name, title, and contact]. Direct questions about this policy or the testing process to the DER.`,
      },
    ],
    acknowledgment:
      "Employees acknowledge this policy on the Drug & Alcohol Policy acknowledgment form (see Handbook Forms).",
  },
  {
    id: "fleet",
    label: "Fleet Safety",
    title: "Fleet Safety Policy",
    icon: Truck,
    intro: `${COMPANY} operates vehicles, trailers, and equipment as part of its work. This Fleet Safety Policy sets the requirements for anyone who operates a company vehicle, trailer, or equipment, or who drives a personal vehicle on company business, to protect our employees and the public and to keep our fleet compliant and roadworthy.`,
    sections: [
      {
        title: "1. Driver Qualification & Licensing",
        body: `Drivers must hold a valid driver's license for the class of vehicle they operate, including the proper CDL class and endorsements where required, and must maintain a current DOT medical certificate when operating commercial motor vehicles. Drivers must report any license suspension, revocation, restriction, expired medical card, or disqualifying citation to their supervisor immediately.`,
      },
      {
        title: "2. Authorized Use",
        body: `Company vehicles and equipment are for authorized business use only and may be operated only by qualified, authorized employees. Unauthorized passengers and any use that violates the law or this policy are prohibited.`,
      },
      {
        title: "3. Pre-Use Inspection",
        body: `Operators must complete the required pre-use inspection at the start of each day or whenever a new operator takes a vehicle, trailer, or piece of equipment, using the company's Pre-Use Inspection and Trailer Inspection forms. Any defect that affects safe operation must be reported and the unit removed from service until repaired.`,
      },
      {
        title: "4. Safe Driving Rules",
        body: `All occupants must wear seat belts. Drivers must obey all traffic laws and posted limits, drive for conditions, maintain safe following distance, and properly secure all loads. Handheld phone use and texting while driving are prohibited; adjust route, navigation, and communications before driving or while safely parked. Driving while impaired by alcohol, drugs, illness, or fatigue is prohibited.`,
      },
      {
        title: "5. Fatigue & Hours",
        body: `Drivers must be fit for duty and adequately rested. CDL drivers subject to the FMCSA hours-of-service rules must comply with them. Any driver who is too fatigued to drive safely must stop and notify their supervisor.`,
      },
      {
        title: "6. Accident & Incident Procedures",
        body: `In the event of an accident, the driver must stop, check for injuries, call emergency services if needed, not admit fault, exchange information, document the scene, and notify their supervisor as soon as it is safe to do so. Every accident, incident, or near miss — including those involving non-owned vehicles or equipment — is documented using the company's Incident & Accident reporting process.`,
      },
      {
        title: "7. Maintenance & Defect Reporting",
        body: `Vehicles, trailers, and equipment are kept in safe operating condition. Defects identified during inspection or operation are reported promptly, repairs are tracked to completion, and any unit that is not roadworthy is taken out of service until repaired.`,
      },
      {
        title: "8. Motor Vehicle Record Review",
        body: `By agreement, the company may obtain and review drivers' motor vehicle records (MVRs) at hire and periodically thereafter to confirm continued driving eligibility. Drivers authorize this review on the Driver Agreement & MVR Authorization form (see Handbook Forms).`,
      },
      {
        title: "9. Accountability",
        body: `Violation of this policy may result in loss of driving privileges and disciplinary action up to and including termination. The Fleet Manager [insert name, title, and contact] administers this policy; direct questions there.`,
      },
    ],
    acknowledgment:
      "Drivers acknowledge the fleet rules on the Driver Agreement & MVR Authorization form (see Handbook Forms).",
  },
  {
    id: "fall-protection",
    label: "Fall Protection",
    title: "Fall Protection Program",
    icon: HardHat,
    intro: `Falls are a leading cause of serious injury in construction. ${COMPANY} maintains this Fall Protection Program to protect employees from fall hazards, consistent with OSHA's construction fall-protection requirements (29 CFR 1926 Subpart M). It applies to all work where employees are exposed to a fall, and a competent person oversees its implementation on each project.`,
    sections: [
      {
        title: "1. Policy & Trigger Heights",
        body: `Fall protection is provided and used whenever an employee is exposed to a fall to a lower level. As a general rule, protection is required at 6 feet or more in construction work; protection is also required, regardless of height, when working above dangerous equipment, near unprotected leading edges, holes, excavations, or other recognized fall hazards.`,
      },
      {
        title: "2. Competent Person",
        body: `A designated competent person [insert name/title] — someone capable of identifying fall hazards and authorized to take prompt corrective action — selects the appropriate fall-protection methods for each task, inspects systems and equipment, and oversees their use on site.`,
      },
      {
        title: "3. Hazard Assessment & Methods",
        body: `Before work begins, fall hazards are assessed and controlled using, in order of preference: guardrail systems, safety net systems, or personal fall arrest systems (PFAS). Covers, hole protection, warning lines, and controlled-access zones are used where applicable. The selected method is documented in the task plan.`,
      },
      {
        title: "4. Personal Fall Arrest Systems",
        body: `Where PFAS are used, employees wear a full-body harness connected by a lanyard or self-retracting lifeline to a suitable anchorage capable of supporting the required load. Components are compatible and used per the manufacturer's instructions. Systems are rigged so that an employee cannot free-fall more than the allowed distance or contact a lower level.`,
      },
      {
        title: "5. Inspection & Maintenance",
        body: `Employees inspect their harnesses, lanyards, connectors, and anchorages before each use; the competent person performs periodic inspections. Any equipment that is damaged, deformed, or has been subjected to a fall is removed from service immediately and destroyed or returned to the manufacturer.`,
      },
      {
        title: "6. Training",
        body: `Employees exposed to fall hazards are trained by a competent person to recognize fall hazards and to correctly use the fall-protection systems for their work, before they are assigned to such work. Retraining is provided when work conditions change, when equipment changes, or when an employee's understanding appears inadequate.`,
      },
      {
        title: "7. Rescue & Emergency Procedures",
        body: `A prompt rescue plan is in place for any employee who falls and is suspended in a harness, to address suspension trauma. Employees are trained to summon help and, where provided, to use self-rescue or assisted-rescue equipment. Emergency contacts and procedures are reviewed before work at height begins.`,
      },
      {
        title: "8. Accountability & Review",
        body: `Use of required fall protection is mandatory; failure to use it may result in disciplinary action up to and including termination. Fall incidents and near misses are investigated through the Incident & Accident process, and this program is reviewed periodically and updated as conditions, equipment, or regulations change.`,
      },
    ],
    acknowledgment:
      "Fall-protection training is recorded on the Training & Certifications log; the broader safety acknowledgment is on the Handbook Forms page.",
  },
  {
    id: "emergency-action",
    label: "Emergency Action",
    title: "Emergency Action Plan",
    icon: Siren,
    intro: `${COMPANY} maintains this Emergency Action Plan (EAP) so that every employee knows what to do in a fire, medical emergency, severe weather, or other event requiring evacuation or shelter. It is consistent with OSHA's emergency action plan requirements (29 CFR 1910.38, applied to construction under 1926.35) and is reviewed with employees and adapted to the specific conditions of each jobsite.`,
    sections: [
      {
        title: "1. Purpose & Scope",
        body: `This plan applies to all employees at every company facility and jobsite. Because jobsite conditions change, the competent person/supervisor on each project reviews the site-specific details — nearest exits, assembly point, and the route to the nearest hospital — with the crew before work begins and whenever conditions change.`,
      },
      {
        title: "2. Reporting an Emergency & Alarm",
        body: `Any employee who discovers a fire, injury, hazardous release, or other emergency must alert others nearby and call 911, then notify their supervisor. On jobsites without a fixed alarm, the means of alerting workers is [insert: air horn, radio call, verbal relay]. Give the dispatcher the site address, the nature of the emergency, and a callback number, and do not hang up until told to.`,
      },
      {
        title: "3. Evacuation Procedures & Routes",
        body: `When evacuation is ordered, stop work, shut down equipment if it is safe to do so, and leave by the nearest safe exit or established route. Do not use elevators/hoists during a fire. Walk — do not run — assist anyone who needs help, and move clear of the structure and emergency-vehicle access. Posted site maps show the primary and secondary routes for the current work area.`,
      },
      {
        title: "4. Assembly Point & Accounting for Employees",
        body: `After evacuating, all employees report to the designated assembly point [insert location for each site] so a head count can confirm everyone is out. Supervisors account for their crews and immediately report anyone missing to emergency responders and the site manager. No one re-enters the site until responders declare it safe.`,
      },
      {
        title: "5. Employees with Critical Operations",
        body: `Only specifically trained and assigned employees may remain to perform or shut down critical operations (such as isolating energy, securing equipment, or capping a line) before they evacuate. These duties are assigned in advance, and those employees evacuate as soon as the critical task is complete or conditions become unsafe.`,
      },
      {
        title: "6. Medical & Rescue Duties",
        body: `Employees are not expected to perform rescues beyond their training. Trained first-aid/CPR responders [insert names or "see Training & Certifications log"] render aid within their training until EMS arrives. First-aid kits and, where provided, AEDs and eyewash/emergency equipment are located at [insert locations]. For confined-space or at-height work, the separate rescue plan for that task applies.`,
      },
      {
        title: "7. Fire Prevention & Extinguishers",
        body: `Exits, electrical panels, and firefighting equipment are kept clear and accessible. Flammable and combustible materials are stored properly and hot-work areas are kept free of ignition hazards. Only employees who are trained and who judge it safe should attempt to use a portable fire extinguisher on a small, incipient fire; if there is any doubt, evacuate and let the fire department respond.`,
      },
      {
        title: "8. Severe Weather & Site-Specific Events",
        body: `For severe weather (high wind, lightning, flooding) and other site-specific hazards, employees stop exposed work and move to the designated shelter or safe area [insert location] until an all-clear is given. The supervisor monitors conditions and orders shelter or evacuation. Utility strikes, gas odors, and hazardous spills are treated as emergencies and reported immediately.`,
      },
      {
        title: "9. Emergency Contacts",
        body: `Emergency services: 911. Site manager [insert name/phone]. Safety Coordinator [insert name/phone]. Nearest hospital/urgent care [insert name, address, phone]. Utility emergency lines [insert]. A current contact list and the route to the nearest hospital are posted at the jobsite and reviewed during orientation.`,
      },
      {
        title: "10. Training & Review",
        body: `Employees are trained on this plan at hire and whenever their responsibilities or the plan change, and site-specific details are covered in jobsite orientation and toolbox talks. The plan is reviewed periodically and after any actual emergency or drill, and updated as facilities, jobsites, or staffing change.`,
      },
    ],
    acknowledgment:
      "Emergency Action Plan training is recorded on the Training & Certifications log and in toolbox-talk records; site-specific details are reviewed in jobsite orientation.",
  },
];

function Policies() {
  const [active, setActive] = useState<string>(POLICIES[0].id);

  // Honor a #policy-id in the URL on mount, so a shared/emailed link (which
  // carries the hash) opens the policy the sender was viewing rather than the
  // default first one. Client-only to avoid an SSR hydration mismatch.
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (POLICIES.some((p) => p.id === id)) setActive(id);
  }, []);

  const select = (id: string) => {
    setActive(id);
    // Reflect the selection in the URL without a navigation or history entry,
    // so SectionActions' "Email this section" link points to this policy.
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <Layout>
      <PageHeader
        title="Safety & Fleet Policies"
        description="Written safety and fleet policies. These pair with the signed acknowledgment forms on the Handbook Forms page."
        actions={<SectionActions label="Safety & Fleet Policies" />}
      />

      {/* Policy switcher — hidden in print so the printed copy shows the selected policy only */}
      <div className="mb-6 flex flex-wrap gap-2 no-print">
        {POLICIES.map((p) => {
          const Icon = p.icon;
          const isActive = p.id === active;
          return (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Render every policy: the active one on screen, all of them when printing. */}
      {POLICIES.map((p) => {
        const Icon = p.icon;
        return (
          <div
            key={p.id}
            className={`mb-8 space-y-4 rounded-xl border bg-card p-5 shadow-sm print-section ${
              p.id === active ? "" : "hidden print:block"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Icon className="h-4 w-4" /> {p.title}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.intro}</p>
            {p.sections.map((s) => (
              <div key={s.title}>
                <h3 className="font-display text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
            <p className="border-t pt-3 text-xs text-muted-foreground">{p.acknowledgment}</p>
          </div>
        );
      })}
    </Layout>
  );
}
