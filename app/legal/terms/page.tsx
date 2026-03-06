'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';
import AppShell from '@/components/AppShell';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function TermsOfService() {
  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections = language === 'de' ? [
    {
      id: 'acceptance',
      title: 'Annahme der Bedingungen',
      content: `Durch den Zugriff auf und die Nutzung von SmartBudget erklären Sie sich damit einverstanden, dass Sie diese Nutzungsbedingungen einhalten. Wenn Sie nicht damit einverstanden sind, nutzen Sie die Anwendung bitte nicht. Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern.`
    },
    {
      id: 'license',
      title: 'Lizenz und Nutzungsrechte',
      content: `SmartBudget gewährt Ihnen eine persönliche, nicht exklusive, nicht übertragbare Lizenz zur Nutzung der Anwendung für persönliche Finanzplanung.

**Sie dürfen nicht:**
- Die Anwendung kommerziell nutzen
- Code dekompilieren oder versuchen, die Quelle zu extrahieren
- Unerlaubte Kopien erstellen
- Anderen den Zugriff auf Ihr Konto gewähren
- Die Anwendung zum Scraping oder automatischen Abruf verwenden
- Das Urheberrecht oder andere Marken verletzen`
    },
    {
      id: 'user-accounts',
      title: 'Benutzerkonten',
      content: `Wenn Sie ein Konto registrieren:

- Sie sind für die Vertraulichkeit Ihrer Anmeldedaten verantwortlich
- Sie sind für alle Aktivitäten unter Ihrem Konto verantwortlich
- Sie müssen genaue und aktuelle Informationen bereitstellen
- Sie müssen SmartBudget sofort benachrichtigen, wenn Ihr Konto kompromittiert ist
- Die Anwendung verwendet Google OAuth - Ihre Google-Sicherheitsrichtlinien gelten`
    },
    {
      id: 'financial-data',
      title: 'Finanzielle Daten und Haftungsausschluss',
      content: `**Wichtig:**
- SmartBudget bietet Finanzinformationen zu Bildungszwecken
- Die Steuerschätzungen sind Anhaltspunkte, keine Rechtsberatung
- Sie sollten einen Steuerberater konsultieren, bevor Sie auf Basis dieser Daten Entscheidungen treffen
- SmartBudget haftet nicht für finanzielle oder steuerliche Verluste
- Alle Berechnungen werden nach bestem Wissen durchgeführt, es gibt aber keine Garantien`
    },
    {
      id: 'limitations',
      title: 'Haftungsbeschränkung',
      content: `Soweit gesetzlich zulässig, haften SmartBudget und seine Betreiber nicht für:

- Indirekte, zufällige oder Folgeschäden
- Entgangene Gewinne oder Datenverlusten
- Fehler oder Ausfallzeiten der Anwendung
- Nicht autorisierte Zugriffe auf Ihre Daten (sofern nicht durch unsere Fahrlässigkeit verursacht)
- Verwendung von Finanzinformationen oder Ratschlägen aus der Anwendung

**Ihre Haftung ist auf die Summe beschränkt, die Sie tatsächlich an SmartBudget gezahlt haben.**`
    },
    {
      id: 'service-modification',
      title: 'Änderung des Services',
      content: `SmartBudget kann:

- Features jederzeit hinzufügen, entfernen oder ändern
- Die Anwendung für Wartung offline nehmen
- Benutzerkonten suspendieren oder löschen, die gegen diese Bedingungen verstoßen
- Den Service mit Ankündigung einstellen

Wir werden versuchen, Sie vor Änderungen zu benachrichtigen, garantieren dies aber nicht.`
    },
    {
      id: 'prohibited',
      title: 'Verbotene Aktivitäten',
      content: `Sie dürfen die Anwendung nicht verwenden für:

- Illegale Aktivitäten
- Betrügereien oder Geldwäsche
- Verbreitung von Malware oder Viren
- Belästigung oder Bedrohung anderer Benutzer
- Unbefugter Zugriff auf Systeme
- Verstöße gegen Datenschutzgesetze
- Missbrauch der Plattform oder ihrer Ressourcen`
    },
    {
      id: 'termination',
      title: 'Beendigung',
      content: `Wir können Ihr Konto sofort beenden oder aussetzen, wenn:

- Sie diese Bedingungen verletzen
- Sie illegale Aktivitäten durchführen
- Ein berechtigter Grund zur Sicherheitsbedenken besteht

Beim Löschen Ihres Kontos können Sie eine Datensicherung anfordern.`
    },
    {
      id: 'governing-law',
      title: 'Anwendbares Recht',
      content: `Diese Bedingungen werden nach deutschem Recht und gegebenenfalls EU-Recht ausgelegt.

**Gerichtsstand:** Gerichte in Deutschland
**Sprache:** Die verbindliche Version ist die deutsche Version`
    },
    {
      id: 'contact',
      title: 'Kontakt',
      content: `Wenn Sie Fragen zu diesen Bedingungen haben:

**Email**: legal@smartbudget.de
**Adresse**: SmartBudget, Deutschland

Letzte Aktualisierung: März 2026`
    }
  ] : [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: `By accessing and using SmartBudget, you agree to comply with these Terms of Service. If you do not agree, please do not use the application. We reserve the right to modify these terms at any time.`
    },
    {
      id: 'license',
      title: 'License and Usage Rights',
      content: `SmartBudget grants you a personal, non-exclusive, non-transferable license to use the application for personal financial planning.

**You may not:**
- Use the application for commercial purposes
- Decompile code or attempt to extract source
- Create unauthorized copies
- Grant access to your account to others
- Use the application for scraping or automated retrieval
- Violate copyright or trademark rights`
    },
    {
      id: 'user-accounts',
      title: 'User Accounts',
      content: `When you register an account:

- You are responsible for the confidentiality of your login credentials
- You are responsible for all activities under your account
- You must provide accurate and current information
- You must notify SmartBudget immediately if your account is compromised
- The application uses Google OAuth - Google's security policies apply`
    },
    {
      id: 'financial-data',
      title: 'Financial Data and Disclaimers',
      content: `**Important:**
- SmartBudget provides financial information for educational purposes only
- Tax estimates are approximations, not legal advice
- You should consult a tax professional before making decisions based on this data
- SmartBudget is not liable for financial or tax losses
- All calculations are made in good faith, but no guarantees are provided`
    },
    {
      id: 'limitations',
      title: 'Limitation of Liability',
      content: `To the extent permitted by law, SmartBudget and its operators are not liable for:

- Indirect, incidental, or consequential damages
- Lost profits or data loss
- Errors or downtime of the application
- Unauthorized access to your data (unless caused by our negligence)
- Use of financial information or advice from the application

**Your liability is limited to the amount you actually paid to SmartBudget.**`
    },
    {
      id: 'service-modification',
      title: 'Service Modification',
      content: `SmartBudget may:

- Add, remove, or modify features at any time
- Take the application offline for maintenance
- Suspend or delete user accounts that violate these terms
- Discontinue the service with notice

We will try to notify you of changes, but cannot guarantee this.`
    },
    {
      id: 'prohibited',
      title: 'Prohibited Activities',
      content: `You may not use the application for:

- Illegal activities
- Fraud or money laundering
- Distribution of malware or viruses
- Harassment or threats of other users
- Unauthorized system access
- Violation of privacy laws
- Abuse of the platform or its resources`
    },
    {
      id: 'termination',
      title: 'Termination',
      content: `We may terminate or suspend your account immediately if:

- You violate these terms
- You engage in illegal activities
- There is reasonable cause for security concerns

When deleting your account, you can request a data backup.`
    },
    {
      id: 'governing-law',
      title: 'Governing Law',
      content: `These terms are governed by and construed in accordance with German law and applicable EU law.

**Jurisdiction:** Courts in Germany
**Language:** The German version is the authoritative version`
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: `If you have questions about these terms:

**Email**: legal@smartbudget.de
**Address**: SmartBudget, Germany

Last Updated: March 2026`
    }
  ];

  return (
    <AppShell tab="terms" txsLength={0} exportCSV={() => {}} taxResult={{}} setTab={() => {}}>
      <div className="max-w-4xl mx-auto">
            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {language === 'de' ? 'Nutzungsbedingungen' : 'Terms of Service'}
                </span>
              </h1>
              <p className="text-lg opacity-60">
                {language === 'de'
                  ? 'Verstehen Sie unsere Regeln für die Nutzung von SmartBudget'
                  : 'Understand our rules for using SmartBudget'}
              </p>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {sections.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="text-left">
                        {section.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose dark:prose-invert max-w-none text-sm opacity-80 whitespace-pre-wrap">
                          {section.content}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact CTA */}
            <Card className="mt-8">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">
                  {language === 'de' ? 'Fragen?' : 'Questions?'}
                </h3>
                <p className="opacity-80 mb-4">
                  {language === 'de'
                    ? 'Kontaktieren Sie unser Rechtsteam'
                    : 'Contact our legal team'}
                </p>
                <Button asChild>
                  <a href="mailto:legal@smartbudget.de">
                    legal@smartbudget.de
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </AppShell>
  );
}
