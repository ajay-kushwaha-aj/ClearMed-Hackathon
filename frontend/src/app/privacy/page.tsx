import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — ClearMed',
  description: 'ClearMed Privacy Policy. How we collect, use, and protect your personal data under the Digital Personal Data Protection Act 2023.',
};

const LAST_UPDATED = '1 January 2025';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to ClearMed
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
            <p className="text-sm text-amber-800">
              <strong>DPDP Act 2023 Notice:</strong> This Privacy Policy is governed by India's Digital Personal Data Protection Act 2023. You have the right to access, correct, and erase your personal data. Contact us at <a href="mailto:privacy@clearmed.in" className="underline">privacy@clearmed.in</a> to exercise these rights.
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {[
              {
                title: '1. Who We Are',
                content: `ClearMed is a healthcare cost transparency platform operated in India. We help patients compare verified hospital costs, read patient reviews, and make informed healthcare decisions. Our registered address is available on request.\n\nData Controller: ClearMed Health Technologies Pvt. Ltd.\nContact: privacy@clearmed.in`,
              },
              {
                title: '2. What Data We Collect',
                content: `We collect the following categories of personal data:\n\n**Account Data:** Name, email address, phone number, and city when you register.\n\n**Bill Data:** Hospital bill documents you upload. We immediately apply automated PII removal (strips name, Aadhaar, PAN, phone, address) before storing any extracted data. Original documents are deleted within 24 hours of processing.\n\n**Usage Data:** IP address (hashed for analytics), device type, pages visited, search queries. We do not use persistent tracking cookies.\n\n**Review Data:** Text reviews, ratings, and treatment feedback you voluntarily submit.\n\n**Referral Data:** Referral codes used and referral relationships.`,
              },
              {
                title: '3. How We Use Your Data',
                content: `We use your data for:\n\n• Providing the ClearMed platform and services\n• Processing and anonymizing uploaded hospital bills\n• Sending transactional notifications (bill status, points earned)\n• Calculating aggregate cost statistics (your individual data is never shown)\n• Improving platform accuracy and ClearMed Score algorithm\n• Complying with legal obligations under the DPDP Act 2023\n\nWe do NOT use your data for targeted advertising. We do NOT sell your data to third parties. We do NOT share individually identifiable data with hospitals or insurers.`,
              },
              {
                title: '4. Data Retention',
                content: `We retain data for the following periods:\n\n• **Verified bill data (anonymized):** 5 years\n• **Patient reviews:** 3 years\n• **Account data:** Until deletion requested\n• **Symptom search queries:** 12 months\n• **Notification logs:** 90 days\n• **Audit logs:** 7 years (regulatory requirement)\n\nAfter retention periods expire, data is automatically purged during our weekly retention job.`,
              },
              {
                title: '5. Your Rights Under DPDP Act 2023',
                content: `As a data principal under India's DPDP Act 2023, you have the right to:\n\n• **Access:** Request a copy of all personal data we hold about you\n• **Correction:** Request correction of inaccurate data\n• **Erasure:** Request deletion of your personal data (processed within 30 days)\n• **Grievance Redressal:** Contact our Data Protection Officer\n• **Nominee:** Designate a nominee to exercise rights in the event of death or incapacity\n\nExercise your rights at: privacy@clearmed.in or via the Data Erasure Request form on our platform.`,
              },
              {
                title: '6. PII Removal from Bills',
                content: `When you upload a hospital bill, our automated system immediately applies multi-layer PII detection and removal before any data is stored:\n\n• Patient name detection (title-based NLP)\n• Phone number patterns (Indian formats)\n• Aadhaar number detection\n• PAN card numbers\n• Email addresses\n• Patient IDs and medical record numbers\n• Insurance policy numbers\n• Date of birth\n• Street addresses\n\nThe original uploaded file is used only for OCR processing and deleted within 24 hours. Only the anonymized, structured cost data is retained.`,
              },
              {
                title: '7. Security',
                content: `We implement security measures including:\n\n• HTTPS/TLS 1.3 encryption in transit\n• Encrypted database storage\n• Admin 2FA (TOTP) for all staff accounts\n• OWASP Top 10 security controls\n• Rate limiting and DDoS protection\n• File type validation and malware scanning\n• Role-based access control with audit logging\n• Regular security reviews`,
              },
              {
                title: '8. Cookies',
                content: `We use minimal, essential cookies only:\n\n• **Session cookie:** Keeps you logged in during a visit\n• **Preference cookie:** Remembers your selected city\n\nWe do NOT use advertising cookies, tracking pixels, or third-party analytics cookies that profile you across websites. You can disable cookies in your browser, though some features may not work.`,
              },
              {
                title: '9. Contact & Grievance',
                content: `Data Protection Officer: grievance@clearmed.in\nGeneral Privacy: privacy@clearmed.in\nResponse time: 72 hours acknowledgement, 30 days resolution\n\nIf unsatisfied with our response, you may file a complaint with India's Data Protection Board (once operational under DPDP Act 2023).`,
              },
            ].map(section => (
              <section key={section.title} className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {section.content.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('•') ? 'ml-3 mt-1' : line.startsWith('**') ? 'font-semibold mt-2' : 'mt-2'}>
                      {line.replace(/\*\*/g, '')}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <div className="card p-5 bg-brand-50 border-brand-200">
              <p className="text-sm text-brand-800">
                <strong>Request Data Deletion:</strong> To exercise your right to erasure under DPDP Act 2023,
                {' '}<Link href="/privacy/erasure" className="underline font-semibold">submit a deletion request here</Link>
                {' '}or email privacy@clearmed.in. We will confirm processing within 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
