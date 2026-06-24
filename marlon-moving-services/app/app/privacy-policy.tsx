import { LegalScreen, type LegalSection } from '@/components/customer/legal-screen';

const sections: LegalSection[] = [
  {
    title: 'Introduction',
    paragraphs: ['Marlon Moving Services ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.marlonmovingservices.com or use our services, including our AI-powered voice assistant.'],
  },
  {
    title: 'Information We Collect',
    paragraphs: [
      '2.1 Personal Information — Name, email address, phone number, moving origin and destination addresses, service preferences, payment information (processed securely through third-party providers).',
      '2.2 Voice and Audio Data — When you interact with our AI voice assistant ("Sam"), we collect voice recordings of your spoken interactions, transcriptions of your voice inputs, and conversation history and context from your session. Voice interactions are only recorded after you provide explicit consent through our Voice Consent Modal. You may choose to use our text-based contact form as an alternative.',
      '2.3 Automatically Collected Information — IP address and browser type, device information and operating system, pages visited and time spent, referring website addresses.',
    ],
  },
  {
    title: 'How We Use Your Information',
    paragraphs: ["Provide and improve our moving services, process service requests and estimates, communicate with you about your move, improve our AI voice assistant's accuracy and helpfulness, analyze website usage and enhance user experience, comply with legal obligations."],
  },
  {
    title: 'Third-Party Service Providers',
    bullets: [
      'ElevenLabs: Provides AI voice technology for our voice assistant. Voice data is processed according to their privacy policy.',
      'Supabase: Securely stores customer data and handles database operations.',
      'Google Analytics: Analyzes website traffic and user behavior (anonymized data).',
    ],
  },
  {
    title: 'Data Retention',
    paragraphs: [
      'Voice recordings: Retained for up to 90 days, then automatically deleted.',
      'Customer contact information: Retained as long as necessary for business purposes or as required by law.',
      "Website analytics: Retained according to Google Analytics' data retention policies.",
    ],
  },
  {
    title: 'Your Rights',
    bullets: [
      'Opt-out: Choose not to use our voice assistant and use text-based alternatives.',
      'Access: Request a copy of the personal data we hold about you.',
      'Deletion: Request deletion of your personal data.',
      'Withdraw consent: Withdraw your consent for voice recording at any time.',
      'Correction: Request correction of inaccurate personal data.',
    ],
    paragraphs: ['To exercise any of these rights, contact us at marlonmovingservices@gmail.com.'],
  },
  {
    title: 'Cookies',
    paragraphs: ['We use cookies and similar tracking technologies to enhance your browsing experience. You can control cookie preferences through your browser settings.'],
  },
  {
    title: 'Data Security',
    paragraphs: ['We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.'],
  },
  {
    title: "Children's Privacy",
    paragraphs: ['Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.'],
  },
  {
    title: 'Changes to This Policy',
    paragraphs: ['We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date.'],
  },
  {
    title: 'Contact Us',
    paragraphs: ['Marlon Moving Services\nEmail: marlonmovingservices@gmail.com\nPhone: 571-525-6129\nLocation: Sterling, VA'],
  },
];

export default function PrivacyPolicyScreen() {
  return <LegalScreen title="Privacy Policy" subtitle="How Marlon Moving Services collects, uses, and protects your information." sections={sections} />;
}
