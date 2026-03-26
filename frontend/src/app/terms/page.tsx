import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — ClearMed',
  description: 'ClearMed Terms of Service. Medical disclaimer, data use rights, liability limits.',
};

export default function TermsPage() {
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
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
                <p className="text-sm text-gray-500">Last updated: 1 January 2026</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          {/* Medical disclaimer — prominent */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <h2 className="text-base font-bold text-red-800 mb-2">⚕️ IMPORTANT MEDICAL DISCLAIMER</h2>
            <p className="text-sm text-red-700 leading-relaxed">
              ClearMed is a <strong>cost transparency and information platform only</strong>. We do NOT provide medical diagnosis, medical advice, or treatment recommendations. Cost data is based on user-submitted bills and may not reflect current hospital pricing. Always consult a qualified, registered medical practitioner before making any healthcare decisions. ClearMed accepts no liability for decisions made based on data displayed on this platform.
            </p>
          </div>

          {[
            {
              title: '1. Acceptance of Terms',
              content: 'By using ClearMed, you agree to these Terms of Service. If you do not agree, please do not use our platform. We may update these terms; continued use constitutes acceptance.',
            },
            {
              title: '2. Platform Description',
              content: 'ClearMed is an information aggregation platform that displays user-submitted hospital cost data, patient reviews, and AI-generated cost intelligence. We are not a healthcare provider, insurer, or medical advisory service. We do not verify the medical accuracy of any content.',
            },
            {
              title: '3. User Responsibilities',
              content: 'You agree to:\n• Submit accurate bill data to the best of your knowledge\n• Not submit another person\'s data without their consent\n• Not use the platform for commercial data scraping\n• Not submit false or misleading reviews\n• Not attempt to manipulate ClearMed Scores\n• Comply with all applicable Indian laws',
            },
            {
              title: '4. Data You Submit',
              content: 'By uploading a hospital bill or review, you grant ClearMed a perpetual, royalty-free license to use the anonymized, extracted cost data for platform operation, research, and display. You retain ownership of your original documents. We anonymize all data before storage — see our Privacy Policy for details.',
            },
            {
              title: '5. Accuracy & Liability',
              content: 'Cost data displayed on ClearMed is sourced from user submissions and may be: outdated, incomplete, for a different treatment variant, or hospital-specific. ClearMed makes no warranty of accuracy. We provide data "as is" for general information purposes only.\n\nTo the maximum extent permitted by Indian law, ClearMed\'s aggregate liability for any claim arising from platform use shall not exceed ₹1,000.',
            },
            {
              title: '6. Intellectual Property',
              content: 'The ClearMed platform, algorithms, ClearMed Score methodology, and all original content are owned by ClearMed Health Technologies Pvt. Ltd. You may not reproduce, scrape, or resell platform data without written permission.',
            },
            {
              title: '7. Termination',
              content: 'We may suspend or terminate accounts that violate these terms, submit false data, or engage in abusive behaviour, without notice.',
            },
            {
              title: '8. Governing Law',
              content: 'These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in New Delhi, India.',
            },
          ].map(s => (
            <div key={s.title} className="card p-6">
              <h2 className="text-base font-bold text-gray-900 mb-2">{s.title}</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                {s.content.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('•') ? 'ml-3 mt-1' : 'mt-1.5 first:mt-0'}>{line}</p>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-center text-gray-400">
            Questions? Contact legal@clearmed.online ·{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
