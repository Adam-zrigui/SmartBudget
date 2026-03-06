'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calculator,
  Banknote,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';
import { DE_TAX_CLASSES, DE_STATES } from '@/lib/utils';

interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
  };
  taxInfo: {
    taxClass: string;
    state: string;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
  };
  preferences: {
    language: 'de' | 'en';
    currency: string;
    notifications: boolean;
    dataSharing: boolean;
  };
}

const STEPS = [
  { id: 'personal', title: { de: 'Persönliche Daten', en: 'Personal Information' }, icon: User },
  { id: 'tax', title: { de: 'Steuerinformationen', en: 'Tax Information' }, icon: Calculator },
  { id: 'preferences', title: { de: 'Einstellungen', en: 'Preferences' }, icon: Shield },
  { id: 'complete', title: { de: 'Fertig', en: 'Complete' }, icon: CheckCircle }
];

export default function GermanUserOnboarding({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const language = useLanguageStore((s) => s.language);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: ''
    },
    taxInfo: {
      taxClass: '',
      state: '',
      maritalStatus: 'single',
      dependents: 0
    },
    preferences: {
      language: 'de',
      currency: 'EUR',
      notifications: true,
      dataSharing: false
    }
  });

  const updateData = (section: keyof OnboardingData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(data);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return data.personalInfo.firstName && data.personalInfo.lastName &&
               data.personalInfo.email && data.personalInfo.dateOfBirth;
      case 1: // Tax Info
        return data.taxInfo.taxClass && data.taxInfo.state;
      case 2: // Preferences
        return true; // All optional
      default:
        return true;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {language === 'de' ? 'Willkommen bei SmartBudget!' : 'Welcome to SmartBudget!'}
              </h2>
              <p className="text-base-content/70">
                {language === 'de'
                  ? 'Lassen Sie uns Ihr Profil einrichten, damit wir Ihnen die besten Empfehlungen geben können.'
                  : 'Let\'s set up your profile so we can give you the best recommendations.'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {language === 'de' ? 'Vorname' : 'First Name'} *
                </Label>
                <Input
                  id="firstName"
                  value={data.personalInfo.firstName}
                  onChange={(e) => updateData('personalInfo', { firstName: e.target.value })}
                  placeholder={language === 'de' ? 'Max' : 'Max'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {language === 'de' ? 'Nachname' : 'Last Name'} *
                </Label>
                <Input
                  id="lastName"
                  value={data.personalInfo.lastName}
                  onChange={(e) => updateData('personalInfo', { lastName: e.target.value })}
                  placeholder={language === 'de' ? 'Mustermann' : 'Mustermann'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'de' ? 'E-Mail-Adresse' : 'Email Address'} *
              </Label>
              <Input
                id="email"
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => updateData('personalInfo', { email: e.target.value })}
                placeholder="max.mustermann@email.de"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                {language === 'de' ? 'Geburtsdatum' : 'Date of Birth'} *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={data.personalInfo.dateOfBirth}
                onChange={(e) => updateData('personalInfo', { dateOfBirth: e.target.value })}
              />
            </div>
          </div>
        );

      case 1: // Tax Information
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {language === 'de' ? 'Steuerliche Informationen' : 'Tax Information'}
              </h2>
              <p className="text-base-content/70">
                {language === 'de'
                  ? 'Diese Informationen helfen uns, genaue Steuerberechnungen durchzuführen.'
                  : 'This information helps us perform accurate tax calculations.'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'de' ? 'Steuerklasse' : 'Tax Class'} *</Label>
                <Select
                  value={data.taxInfo.taxClass}
                  onValueChange={(value) => updateData('taxInfo', { taxClass: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'de' ? 'Steuerklasse auswählen' : 'Select tax class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {DE_TAX_CLASSES.map((taxClass) => (
                      <SelectItem key={taxClass.id} value={taxClass.id.toString()}>
                        {language === 'de' ? taxClass.label : taxClass.label} - {taxClass.id === 1 ? 'Single' : taxClass.id === 2 ? 'Single Parent' : `Married Class ${taxClass.id - 2}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'de' ? 'Bundesland' : 'State'} *</Label>
                <Select
                  value={data.taxInfo.state}
                  onValueChange={(value) => updateData('taxInfo', { state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'de' ? 'Bundesland auswählen' : 'Select state'} />
                  </SelectTrigger>
                  <SelectContent>
                    {DE_STATES.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'de' ? 'Familienstand' : 'Marital Status'}</Label>
                <RadioGroup
                  value={data.taxInfo.maritalStatus}
                  onValueChange={(value: any) => updateData('taxInfo', { maritalStatus: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">{language === 'de' ? 'Ledig' : 'Single'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="married" id="married" />
                    <Label htmlFor="married">{language === 'de' ? 'Verheiratet' : 'Married'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="divorced" id="divorced" />
                    <Label htmlFor="divorced">{language === 'de' ? 'Geschieden' : 'Divorced'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="widowed" id="widowed" />
                    <Label htmlFor="widowed">{language === 'de' ? 'Verwitwet' : 'Widowed'}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dependents">
                  {language === 'de' ? 'Anzahl der Kinder' : 'Number of Children'}
                </Label>
                <Input
                  id="dependents"
                  type="number"
                  min="0"
                  value={data.taxInfo.dependents}
                  onChange={(e) => updateData('taxInfo', { dependents: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        );

      case 2: // Preferences
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {language === 'de' ? 'Ihre Einstellungen' : 'Your Preferences'}
              </h2>
              <p className="text-base-content/70">
                {language === 'de'
                  ? 'Passen Sie die App an Ihre Bedürfnisse an.'
                  : 'Customize the app to your needs.'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'de' ? 'Bevorzugte Sprache' : 'Preferred Language'}</Label>
                <Select
                  value={data.preferences.language}
                  onValueChange={(value: 'de' | 'en') => updateData('preferences', { language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'de' ? 'Währung' : 'Currency'}</Label>
                <Select
                  value={data.preferences.currency}
                  onValueChange={(value) => updateData('preferences', { currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={data.preferences.notifications}
                  onCheckedChange={(checked) => updateData('preferences', { notifications: checked })}
                />
                <Label htmlFor="notifications">
                  {language === 'de' ? 'Benachrichtigungen aktivieren' : 'Enable notifications'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dataSharing"
                  checked={data.preferences.dataSharing}
                  onCheckedChange={(checked) => updateData('preferences', { dataSharing: checked })}
                />
                <Label htmlFor="dataSharing">
                  {language === 'de'
                    ? 'Anonyme Nutzungsdaten teilen (für Verbesserungen)'
                    : 'Share anonymous usage data (for improvements)'
                  }
                </Label>
              </div>
            </div>
          </div>
        );

      case 3: // Complete
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {language === 'de' ? 'Einrichtung abgeschlossen!' : 'Setup Complete!'}
              </h2>
              <p className="text-base-content/70">
                {language === 'de'
                  ? 'Ihr Profil wurde erfolgreich eingerichtet. Sie können jetzt mit SmartBudget beginnen.'
                  : 'Your profile has been set up successfully. You can now start using SmartBudget.'
                }
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">
                  {language === 'de' ? 'Ihre Konfiguration:' : 'Your Configuration:'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>{language === 'de' ? 'Name:' : 'Name:'}</strong> {data.personalInfo.firstName} {data.personalInfo.lastName}</div>
                  <div><strong>{language === 'de' ? 'Steuerklasse:' : 'Tax Class:'}</strong> {
                    DE_TAX_CLASSES.find(tc => tc.id === parseInt(data.taxInfo.taxClass))?.label || data.taxInfo.taxClass
                  }</div>
                  <div><strong>{language === 'de' ? 'Bundesland:' : 'State:'}</strong> {
                    DE_STATES.find(s => s.id === data.taxInfo.state)?.label || data.taxInfo.state
                  }</div>
                  <div><strong>{language === 'de' ? 'Sprache:' : 'Language:'}</strong> {data.preferences.language === 'de' ? 'Deutsch' : 'English'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content/50'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs text-center ${
                  isActive ? 'text-primary font-semibold' : 'text-base-content/70'
                }`}>
                  {step.title[language]}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'de' ? 'Zurück' : 'Back'}
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={nextStep}
            disabled={!isStepValid()}
          >
            {language === 'de' ? 'Weiter' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            className="bg-green-500 hover:bg-green-600"
          >
            {language === 'de' ? 'Los geht\'s!' : 'Get Started!'}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}