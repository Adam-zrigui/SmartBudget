'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';
import AppShell from '@/components/AppShell';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function DataProcessing() {
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
      id: 'controller',
      title: 'Verantwortlicher für Datenverarbeitung',
      content: `SmartBudget
Deutschland

Email: privacy@smartbudget.de
Datenschutzbeauftragter: Ein separater Datenschutzbeauftragter ist benannt und erreichbar unter den obigen Kontaktdaten.`
    },
    {
      id: 'legal-basis',
      title: 'Rechtsgrundlagen der Verarbeitung',
      content: `Die Verarbeitung personenbezogener Daten erfolgt auf folgenden Grundlagen:

**Artikel 6(1)(c) GDPR - Erfüllung einer rechtlichen Verpflichtung:**
- Aufbewahrung von Transaktionsdaten für Steuerzwecke
- Compliance mit deutschen Buchhaltungsgesetzen
- Sicherheitsprotokollierung

**Artikel 6(1)(b) GDPR - Erfüllung eines Vertrags:**
- Bereitstellung der SmartBudget-Dienste
- Verwaltung von Benutzerkonten
- Sicherung von Transaktionsdaten

**Artikel 6(1)(a) GDPR - Freiwillige Zustimmung:**
- Marketing-E-Mails
- Analytik und Leistungsmessungen
- Optionale Features

**Berechtigtes Interesse (Artikel 6(1)(f) GDPR):**
- Sicherheit und Betrugsprävention
- Systemverwaltung und Wartung
- Verbessert Produkte und Dienste`
    },
    {
      id: 'categories',
      title: 'Kategorien verarbeiteter Daten',
      content: `**Authentifizierungsdaten:**
- Google-Konto-ID
- E-Mail-Adresse
- Google-Profildaten
- Anmelde-Token

**Finanzielle Daten:**
- Transaktionen (manuell eingegeben oder importiert)
- Kontobezeichnungen
- Budgetinformationen
- Kategoriedaten
- Gehalt und Steuerdaten

**Gerätedaten:**
- Browser-Typ und Version
- IP-Adresse
- Betriebssystem
- Cookie-IDs
- Analytics-Events

**Sonstiges:**
- Spracheinstellungen
- Design-Präferenzen
- Zugriffsloggen
- Fehlerberichte`
    },
    {
      id: 'duration',
      title: 'Aufbewahrungsdauer',
      content: `Die Aufbewahrungsdauer Ihrer Daten hängt von der Art der Daten ab:

**Authentifizierungsdaten:**
- Solange das Konto aktiv ist
- Maximal 7 Jahre nach Löschung für Sicherheitsprotokolle

**Transaktionsdaten:**
- 10 Jahre (deutsche Buchhaltungsgesetze)
- Zur Verfügung gestellt für Steuerzwecke
- Kann auf Anfrage gelöscht werden, vorbehaltlich rechtlicher Verpflichtungen

**Cookies:**
- Authentifizierungs-Cookies: 7 Tage (aktive Sitzung)
- Analytics-Cookies: 13 Monate

**Gelöschte Konten:**
- Persönliche Daten werden sofort anonymisiert
- Transaktionsdaten werden für Compliance aufbewahrt
- Systemlogs: 90 Tage

**Automatische Löschung:**
- Inaktive Konten: Nach 2 Jahren ohne Aktivität`
    },
    {
      id: 'recipients',
      title: 'Empfänger der Daten',
      content: `Ihre persönlichen Daten werden an folgende Empfänger weitergegeben:

**Direkter Zugang:**
1. **Google Firebase** (USA)
   - Authentifizierung
   - Sicherheit
   - Privacy Policy: https://policies.google.com/privacy

2. **Neon Database** (USA)
   - Datenbanksicherung
   - PostgreSQL-Verwaltung
   - Privacy Policy: https://neon.tech/privacy

3. **Vercel Analytics** (USA)
   - Anonyme Leistungsmetriken
   - SLA: uptime.com

**Processor-Vereinbarungen:**
- Alle genannten Empfänger sind als Data Processor gemäß GDPR vertraglich verpflichtet
- Standard Contractual Clauses (SCCs) sind in Kraft
- Für USA-ansässige Unternehmen: Reihe für Datenschutz

**Keine Weitergabe an:**
- Marketer oder Werbetreibende
- Datenbroker
- Kreditauskunfteien (außer bei rechtlicher Verpflichtung)`
    },
    {
      id: 'transfer',
      title: 'Internationale Datenübertragungen',
      content: `SmartBudget verwendet Cloud-Services in den USA. Diese Übertragungen sind geschützt durch:

**Rechtliche Rahmenbedingungen:**
- Standard Contractual Clauses (SCCs) zwischen EU und USA-Servern
- Adequacy-Beschlüsse wo zutreffend
- Binding Corporate Rules (für Verarbeitendienste)

**Schutzmechanismen:**
- End-to-End Verschlüsslung für sensible Daten
- Zugriffskontrollen
- Regelmäßige Sicherheitsprüfungen
- Incident Response Pläne

**US-basierte Dienste:**
- Google Firebase (USA)
- Neon Database (USA)
- Vercel (USA)

**Ihre Rechte:**
- Sie können der Übertragung widersprechen
- Wir werden versuchen, EU-basierte Alternativen zu finden
- Kontaktieren Sie uns für spezifische Fragen`
    },
    {
      id: 'rights',
      title: 'Ihre Datenschutzrechte',
      content: `Sie haben folgende Rechte gemäß GDPR:

**1. Auskunftsrecht (Artikel 15)**
- Kostenlose Anfrage nach Ihren Daten
- Antwort innerhalb von 30 Tagen
- Häufigkeit: Einmal pro Kalenderjahr kostenlos

**2. Berichtigungsrecht (Artikel 16)**
- Korrektur ungenauen Daten
- Ergänzung unvollständiger Daten
- Kostenlos

**3. Recht auf Vergessenwerden (Artikel 17)**
- Löschung Ihrer Daten anfordern
- Mit Ausnahmen für Compliance und Sicherheit
- Kostenlos

**4. Einschränkung der Verarbeitung (Artikel 18)**
- Eingabe "Verarbeitungsstopps"
- Daten werden nicht gelöscht, aber nicht aktiv verwendet
- Kostenlos

**5. Datenübertragbarkeit (Artikel 20)**
- Erhalten Sie Ihre Daten in maschinenlesbarem Format
- Übertragung an andere Anbieter
- Kostenlos

**6. Widerspruchsrecht (Artikel 21)**
- Marketing-E-Mails abmelden
- Analytics abmelden
- Kostenlos

**Wie Sie Ihre Rechte ausüben:**
Senden Sie eine E-Mail mit Ihrer Anfrage an: privacy@smartbudget.de
Bitte fügen Sie folgendes bei:
- Vollständiger Name
- Mit dem Konto verknüpfte E-Mail
- Beschreibung Ihrer Anfrage
- Notwendige Anhänge

**Antwortfrist:** 30 Tage (kann verlängert werden)`
    },
    {
      id: 'security-measures',
      title: 'Sicherheitsmaßnahmen',
      content: `SmartBudget implementiert umfangreiche Sicherheitsmaßnahmen:

**Technische Maßnahmen:**
- TLS/SSL Verschlüsselung (mind. 256-bit)
- AES-256 Verschlüsselung für Datenbanken
- httpOnly und Secure Cookies
- CSRF-Token und XSS-Schutz
- Rate Limiting und DDoS-Schutz
- Web Application Firewall (WAF)

**Zugriffskontrolle:**
- Rollen-basierte Zugriffskontrolle (RBAC)
- Authentifizierung über Google OAuth
- Zwei-Faktor-Authentifizierung empfohlen
- Session Timeout
- Geolocation-Anomalieerkennung

**Betrieb:**
- Regelmäßige Penetrationstests
- Sicherheits-Patches innerhalb von 24 Stunden
- Backup und Disaster Recovery
- Incident Response Plan
- Security Audit Log (1 Jahr Speichern)

**Compliance:**
- ISO 27001 Readiness
- OWASP Top 10 Schutz
- CWE/SANS Top 25 Mitigation
- GDPR Security Requirements (Artikel 32)`
    },
    {
      id: 'complaints',
      title: 'Beschwerdeverfahren',
      content: `Wenn Sie mit der Datenverarbeitung unzufrieden sind:

**Schritt 1: Kontakt mit SmartBudget**
Schreiben Sie an: privacy@smartbudget.de
Wir werden Ihre Beschwerde innerhalb von 7 Tagen bearbeiten.

**Schritt 2: Aufsichtsbehörde**
Wenn Sie mit unserer Antwort unzufrieden sind, können Sie sich an Ihre regionale Datenschutzbehörde wenden:

**Deutsche Datenschutzbehörden:**
-Berlin: https://www.datenschutz-berlin.de
- Bayern: https://www.bfdi.bund.de
- Baden-Württemberg: https://www.baden-wuerttemberg.datenschutz.de
- Hessen: https://datenschutz.hessen.de
- Nordrhein-Westfalen: https://www.ldi.nrw.de
- Weitere:  https://www.datenschutz.de

**Ihre Rechte:**
- Beschwerde einreichen kostenlos
- Datenschutzbehörden müssen innerhalb von 90 Tagen Maßnahmen einleiten
- Keine Kosten für die Behörde`
    }
  ] : [
    {
      id: 'controller',
      title: 'Data Controller',
      content: `SmartBudget
Germany

Email: privacy@smartbudget.de
Data Protection Officer: Appointed and available at the above contact information.`
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis for Processing',
      content: `Personal data processing is based on the following legal bases:

**Article 6(1)(c) GDPR - Legal Obligation:**
- Retention of transaction data for tax purposes
- Compliance with German accounting laws
- Security logging

**Article 6(1)(b) GDPR - Contract Performance:**
- Provision of SmartBudget services
- User account management
- Transaction data security

**Article 6(1)(a) GDPR - Consent:**
- Marketing emails
- Analytics and performance measurements
- Optional features

**Legitimate Interest (Article 6(1)(f) GDPR):**
- Security and fraud prevention
- System administration and maintenance
- Product and service improvements`
    },
    {
      id: 'categories',
      title: 'Categories of Data Processed',
      content: `**Authentication Data:**
- Google account ID
- Email address
- Google profile data
- Login tokens

**Financial Data:**
- Transactions (manually entered or imported)
- Account names
- Budget information
- Category data
- Salary and tax data

**Device Data:**
- Browser type and version
- IP address
- Operating system
- Cookie IDs
- Analytics events

**Other Data:**
- Language settings
- Design preferences
- Access logs
- Error reports`
    },
    {
      id: 'duration',
      title: 'Data Retention Duration',
      content: `The retention period for your data depends on the type of data:

**Authentication Data:**
- As long as account is active
- Maximum 7 years after deletion for security logs

**Transaction Data:**
- 10 years (German accounting laws)
- Available for tax purposes
- Can be deleted upon request, subject to legal obligations

**Cookies:**
- Authentication cookies: 7 days (active session)
- Analytics cookies: 13 months

**Deleted Accounts:**
- Personal data immediately anonymized
- Transaction data retained for compliance
- System logs: 90 days

**Automatic Deletion:**
- Inactive accounts: After 2 years of no activity`
    },
    {
      id: 'recipients',
      title: 'Data Recipients',
      content: `Your personal data is shared with the following recipients:

**Direct Access:**
1. **Google Firebase** (USA)
   - Authentication
   - Security
   - Privacy Policy: https://policies.google.com/privacy

2. **Neon Database** (USA)
   - Database storage
   - PostgreSQL management
   - Privacy Policy: https://neon.tech/privacy

3. **Vercel Analytics** (USA)
   - Anonymous performance metrics
   - SLA: uptime.com

**Processor Agreements:**
- All recipients are contractually required to act as Data Processors under GDPR
- Standard Contractual Clauses (SCCs) are in place
- For US-based companies: Data Privacy Framework

**No Sharing With:**
- Marketers or advertisers
- Data brokers
- Credit agencies (except by legal requirement)`
    },
    {
      id: 'transfer',
      title: 'International Data Transfers',
      content: `SmartBudget uses cloud services in the USA. These transfers are protected by:

**Legal Framework:**
- Standard Contractual Clauses (SCCs) between EU and US servers
- Adequacy decisions where applicable
- Binding Corporate Rules (for processors)

**Protection Mechanisms:**
- End-to-end encryption for sensitive data
- Access controls
- Regular security audits
- Incident response plans

**US-Based Services:**
- Google Firebase (USA)
- Neon Database (USA)
- Vercel (USA)

**Your Rights:**
- You can object to transfers
- We will attempt to find EU-based alternatives
- Contact us for specific questions`
    },
    {
      id: 'rights',
      title: 'Your Data Protection Rights',
      content: `You have the following rights under GDPR:

**1. Right to Access (Article 15)**
- Free request for your data
- Response within 30 days
- Frequency: Once per calendar year free

**2. Right to Rectification (Article 16)**
- Correct inaccurate data
- Complete incomplete data
- Free of charge

**3. Right to Erasure (Article 17)**
- Request deletion of your data
- With exceptions for compliance and security
- Free of charge

**4. Right to Restrict Processing (Article 18)**
- Request processing "stop"
- Data not deleted but not actively used
- Free of charge

**5. Right to Data Portability (Article 20)**
- Receive your data in machine-readable format
- Transfer to other providers
- Free of charge

**6. Right to Object (Article 21)**
- Opt out of marketing emails
- Opt out of analytics
- Free of charge

**How to Exercise Your Rights:**
Send an email with your request to: privacy@smartbudget.de
Please include:
- Full name
- Email associated with account
- Description of your request
- Necessary attachments

**Response Time:** 30 days (may be extended)`
    },
    {
      id: 'security-measures',
      title: 'Security Measures',
      content: `SmartBudget implements comprehensive security measures:

**Technical Measures:**
- TLS/SSL encryption (minimum 256-bit)
- AES-256 encryption for databases
- httpOnly and Secure cookies
- CSRF tokens and XSS protection
- Rate limiting and DDoS protection
- Web Application Firewall (WAF)

**Access Control:**
- Role-based access control (RBAC)
- Authentication via Google OAuth
- Two-factor authentication recommended
- Session timeout
- Geolocation anomaly detection

**Operations:**
- Regular penetration testing
- Security patches within 24 hours
- Backup and disaster recovery
- Incident response plan
- Security audit logging (1 year retention)

**Compliance:**
- ISO 27001 readiness
- OWASP Top 10 protection
- CWE/SANS Top 25 mitigation
- GDPR Security Requirements (Article 32)`
    },
    {
      id: 'complaints',
      title: 'Complaint Procedure',
      content: `If you are unsatisfied with data processing:

**Step 1: Contact SmartBudget**
Email: privacy@smartbudget.de
We will address your complaint within 7 days.

**Step 2: Authority**
If unsatisfied with our response, contact your regional data protection authority:

**German Data Protection Authorities:**
- Berlin: https://www.datenschutz-berlin.de
- Bavaria: https://www.bfdi.bund.de
- Baden-Württemberg: https://www.baden-wuerttemberg.datenschutz.de
- Hesse: https://datenschutz.hessen.de
- North Rhine-Westphalia: https://www.ldi.nrw.de
- Others: https://www.datenschutz.de

**Your Rights:**
- File complaints free of charge
- Authorities must take action within 90 days
- No costs from the authority`
    }
  ];

  return (
    <AppShell tab="data-processing" txsLength={0} exportCSV={() => {}} taxResult={{}} setTab={() => {}}>
      <div className="max-w-4xl mx-auto">
            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {language === 'de' ? 'Datenverarbeitung' : 'Data Processing'}
                </span>
              </h1>
              <p className="text-lg opacity-60">
                {language === 'de'
                  ? 'Detaillierte Informationen zur Verarbeitung Ihrer Daten'
                  : 'Detailed information about how we process your data'}
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
                  {language === 'de' ? 'Fragen zur Verarbeitung?' : 'Questions About Processing?'}
                </h3>
                <p className="opacity-80 mb-4">
                  {language === 'de'
                    ? 'Kontaktieren Sie unser Datenschutzbehörde'
                    : 'Contact our data protection officer'}
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
