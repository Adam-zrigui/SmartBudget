'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';
import AppShell from '@/components/AppShell';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function PrivacyPolicy() {
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
      id: 'intro',
      title: 'Einleitung',
      content: `SmartBudget ("wir", "uns" oder "unser") betreibt die SmartBudget-Anwendung. Diese Seite informiert Sie über unsere Richtlinien zum Umgang mit persönlichen Daten bei der Nutzung unserer Anwendung sowie über die Möglichkeiten in Bezug auf Ihre Privatsphäre.`
    },
    {
      id: 'data-collection',
      title: 'Erfassung und Verwendung von Daten',
      content: `Wir erfassen mehrere verschiedene Arten von Informationen für verschiedene Zwecke, um unsere Dienstleistungen für Sie zu verbessern.

**Arten von erfassten Daten:**
- Authentifizierungsdaten (Google OAuth)
- Finanzielle Transaktionsdaten (freiwillig eingegeben)
- Budgetinformationen
- Steuereinstellungen und Berechnungen
- Verwendungsanalysen zur Verbesserung der App

**Verwendungszweck:**
- Bereitstellung und Verwaltung der Services
- Persönliche Finanzplanung und Analyse
- Steuerberechnung und -planung
- Kommunikation über Updates und Änderungen
- Verbesserung der Anwendungsleistung und Benutzerfreundlichkeit`
    },
    {
      id: 'security',
      title: 'Sicherheit Ihrer Daten',
      content: `Wir nehmen Ihre Datensicherheit sehr ernst. SmartBudget implementiert mehrere Sicherheitsmaßnahmen:

- **Firebase Authentication**: Sichere OAuth-Authentifizierung durch Google
- **Verschlüsselte Übertragung**: HTTPS für alle Verbindungen
- **httpOnly Cookies**: Token werden sicher in httpOnly Cookies gespeichert
- **PostgreSQL-Datenbankenwirkung**: Verschlüsselte Datenbankspeicherung
- **Keine Passwörter gespeichert**: Wir speichern keine Passwörter, da wir OAuth verwenden
- **Regelmäßige Sicherheitsprüfungen**: Kontinuierliche Überwachung auf Schwachstellen`
    },
    {
      id: 'cookies',
      title: 'Cookies und lokale Speicherung',
      content: `Die Anwendung verwendet folgende Cookie-Typen:

**Authentifizierungs-Cookies:**
- _auth_token: Speichert Ihr Firebase-ID-Token (httpOnly, sicher)
- Gültig für 7 Tage

**Analytics-Cookies:**
- Verfolgen Seiten-Leistungsmetriken
- Core Web Vitals (Seitenladezeit, Stabilität)
- Keine persönlich identifizierbaren Informationen

Sie können Cookies jederzeit in Ihren Browser-Einstellungen deaktivieren.`
    },
    {
      id: 'your-rights',
      title: 'Ihre Rechte nach GDPR',
      content: `Sie haben gemäß der Europäischen Datenschutzerverordnung (GDPR) folgende Rechte:

- **Recht auf Zugriff**: Sie können eine Kopie aller Ihre persönlichen Daten anfordern
- **Recht auf Berichtigung**: Sie können ungenaue Daten korrigieren
- **Recht auf Vergessenwerden**: Sie können die Löschung Ihrer Daten anfordern
- **Recht auf Datenübertragbarkeit**: Sie können eine Kopie Ihrer Daten in maschinenlesbarem Format erhalten
- **Recht, Verarbeitung zu widersprechen**: Sie können der Datenverarbeitung widersprechen

Um diese Rechte auszuüben, kontaktieren Sie uns bitte unter: privacy@smartbudget.de`
    },
    {
      id: 'third-parties',
      title: 'Weitergabe an Dritte',
      content: `Wir geben Ihre persönlichen Daten nicht an Dritte weiter, außer:

- **Google Firebase**: Für Authentifizierung (Firebase Privacy Policy befolgt)
- **Neon Database**: Für sichere PostgreSQL-Datenspeicherung
- **Vercel Analytics**: Für anonyme Leistungsmetriken
- **Gesetzkräftige Anforderungen**: Falls von Behörden gefordert
- **Mit Ihrer ausdrücklichen Zustimmung**`
    },
    {
      id: 'contact',
      title: 'Kontakt zum Datenschutz',
      content: `Wenn Sie Fragen zu dieser Datenschutzerklärung haben oder Ihre Datenschutzrechte ausüben möchten:

**Email**: privacy@smartbudget.de
**Adresse**: SmartBudget, Deutschland
**Antwortzeit**: 30 Tage

Letzte Aktualisierung: März 2026`
    }
  ] : [
    {
      id: 'intro',
      title: 'Introduction',
      content: `SmartBudget ("we", "us" or "our") operates the SmartBudget application. This page informs you of our policies regarding the collection and use of personal data when you use our application and the choices you have associated with that data.`
    },
    {
      id: 'data-collection',
      title: 'Data Collection and Use',
      content: `We collect various types of information for different purposes to improve our services for you.

**Types of Data Collected:**
- Authentication data (Google OAuth)
- Financial transaction data (voluntarily entered)
- Budget information
- Tax settings and calculations
- Usage analytics to improve the app

**Purpose of Use:**
- Provision and management of services
- Personal financial planning and analysis
- Tax calculation and planning
- Communication about updates and changes
- Improvement of application performance and usability`
    },
    {
      id: 'security',
      title: 'Data Security',
      content: `We take your data security very seriously. SmartBudget implements multiple security measures:

- **Firebase Authentication**: Secure OAuth authentication through Google
- **Encrypted Transfer**: HTTPS for all connections
- **httpOnly Cookies**: Tokens securely stored in httpOnly cookies
- **PostgreSQL Database**: Encrypted data storage
- **No Passwords Stored**: We don't store passwords as we use OAuth
- **Regular Security Audits**: Continuous monitoring for vulnerabilities`
    },
    {
      id: 'cookies',
      title: 'Cookies and Local Storage',
      content: `The application uses the following types of cookies:

**Authentication Cookies:**
- _auth_token: Stores your Firebase ID token (httpOnly, secure)
- Valid for 7 days

**Analytics Cookies:**
- Track page performance metrics
- Core Web Vitals (page load time, stability)
- No personally identifiable information

You can disable cookies anytime in your browser settings.`
    },
    {
      id: 'your-rights',
      title: 'Your Rights Under GDPR',
      content: `You have the following rights under the European General Data Protection Regulation (GDPR):

- **Right to Access**: You can request a copy of all your personal data
- **Right to Rectification**: You can correct inaccurate data
- **Right to be Forgotten**: You can request deletion of your data
- **Right to Data Portability**: You can receive a copy of your data in machine-readable format
- **Right to Object**: You can object to data processing

To exercise these rights, please contact us at: privacy@smartbudget.de`
    },
    {
      id: 'third-parties',
      title: 'Third-Party Sharing',
      content: `We do not share your personal data with third parties except for:

- **Google Firebase**: For authentication (Firebase Privacy Policy applies)
- **Neon Database**: For secure PostgreSQL data storage
- **Vercel Analytics**: For anonymous performance metrics
- **Legal Requirements**: If required by authorities
- **With Your Explicit Consent**`
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: `If you have questions about this Privacy Policy or wish to exercise your privacy rights:

**Email**: privacy@smartbudget.de
**Address**: SmartBudget, Germany
**Response Time**: 30 days

Last Updated: March 2026`
    }
  ];

  return (
    <AppShell tab="privacy" txsLength={0} exportCSV={() => {}} taxResult={{}} setTab={() => {}}>
      <div className="max-w-4xl mx-auto">
            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {language === 'de' ? 'Datenschutzrichtlinie' : 'Privacy Policy'}
                </span>
              </h1>
              <p className="text-lg opacity-60">
                {language === 'de'
                  ? 'Ihr Vertrauen ist uns wichtig. Erfahren Sie, wie wir Ihre Daten schützen.'
                  : 'Your trust matters to us. Learn how we protect your data.'}
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
                    ? 'Kontaktieren Sie unser Datenschutzteam'
                    : 'Contact our privacy team'}
                </p>
                <Button asChild>
                  <a href="mailto:privacy@smartbudget.de">
                    privacy@smartbudget.de
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
      </AppShell>
  );
}
