import { LegalScreen, type LegalSection } from '@/components/customer/legal-screen';

const sections: LegalSection[] = [
  {
    title: 'Acceptance of Terms',
    paragraphs: ['By accessing or using the Marlon Moving Services website (www.marlonmovingservices.com) and our services, including our AI voice assistant, you agree to be bound by these Terms of Service.'],
  },
  {
    title: 'AI Interaction Acknowledgment',
    paragraphs: ['When using our voice assistant, you are interacting with an artificial intelligence (AI) system, not a human representative. Our AI assistant "Sam" is powered by advanced AI technology and is not a human employee.'],
  },
  {
    title: 'Voice Recording Consent',
    paragraphs: ['Your voice interactions will be recorded for service improvement and quality assurance. Recordings may be transcribed and stored securely. Conversation data may be used to improve our AI system. You have the option to decline voice interaction and use text-based alternatives. Consent is obtained through our Voice Consent Modal before any recording begins.'],
  },
  {
    title: 'Limitations of AI Assistance',
    bullets: [
      'Preliminary Estimates Only: Any pricing or estimates provided by our AI assistant are preliminary and for informational purposes only. They do not constitute a binding quote or contract.',
      "Final Pricing: Actual pricing will be determined after an assessment by Marlon's team, either over the phone or during an on-site visit.",
      'No Binding Commitments: Our AI assistant cannot make binding commitments, guarantees, or contractual obligations on behalf of Marlon Moving Services.',
      'Information Accuracy: While we strive for accuracy, AI-generated information may occasionally contain errors or outdated information.',
    ],
  },
  {
    title: 'Moving Services',
    paragraphs: [
      '5.1 Service Agreement — All moving services are subject to a separate service agreement that will be provided before your move.',
      '5.2 Pricing Structure — Truck flat fees (one-time, based on truck size), hourly labor rates (based on crew size, minimum 3 hours), travel fees (based on distance from Sterling, VA), packing material kits (Apartment $99, Townhouse $149, Single Family $249).',
      '5.3 Payment — Payment is due upon completion of services. We accept cash, Zelle, Venmo, and credit/debit cards.',
    ],
  },
  {
    title: 'Disclaimer of Warranties',
    paragraphs: ['THE WEBSITE AND AI ASSISTANT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.'],
  },
  {
    title: 'Limitation of Liability',
    paragraphs: ['TO THE MAXIMUM EXTENT PERMITTED BY LAW, MARLON MOVING SERVICES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM: your use of or reliance on information provided by our AI assistant; any errors or inaccuracies in AI-generated content; any interruption or cessation of the AI service; decisions made based on preliminary estimates.'],
  },
  {
    title: 'User Responsibilities',
    paragraphs: ['You agree to: provide accurate and complete information; not use the AI assistant for any unlawful purpose; not attempt to manipulate, abuse, or exploit the AI system; not record or redistribute AI conversations without consent; treat all staff and AI systems with respect.'],
  },
  {
    title: 'Intellectual Property',
    paragraphs: ['All content on this website, including text, graphics, logos, and software, is the property of Marlon Moving Services and is protected by copyright and trademark laws.'],
  },
  {
    title: 'Governing Law',
    paragraphs: ['These Terms of Service shall be governed by and construed in accordance with the laws of the Commonwealth of Virginia, without regard to its conflict of law provisions.'],
  },
  {
    title: 'Modifications',
    paragraphs: ['We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to this page.'],
  },
  {
    title: 'Contact Us',
    paragraphs: ['Marlon Moving Services\nEmail: marlonmovingservices@gmail.com\nPhone: 571-525-6129\nLocation: Sterling, VA\nUSDOT# 3470374'],
  },
];

export default function TermsOfServiceScreen() {
  return <LegalScreen title="Terms of Service" subtitle="Terms governing use of Marlon Moving Services and our digital services." sections={sections} />;
}
