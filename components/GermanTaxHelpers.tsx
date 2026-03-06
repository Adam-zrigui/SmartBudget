'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Euro, FileText, Heart, Home, GraduationCap } from 'lucide-react';
import { GERMAN_TAX_DEDUCTIONS, GERMAN_SOCIAL_BENEFITS, fmt } from '@/lib/utils';

export default function GermanTaxHelpers() {
  const language = useLanguageStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<'deductions' | 'benefits'>('deductions');

  const [deductionInputs, setDeductionInputs] = useState({
    werbungskosten: '',
    sonderausgaben: '',
    außergewöhnliche_belastungen: '',
    kinderfreibetrag: ''
  });

  const [benefitInputs, setBenefitInputs] = useState({
    kindergeld: '',
    wohngeld: '',
    bafoeg: ''
  });

  const calculateDeductions = () => {
    const total = Object.values(deductionInputs).reduce((sum, val) => {
      const num = parseFloat(val) || 0;
      return sum + num;
    }, 0);
    return total;
  };

  const calculateBenefits = () => {
    const total = Object.values(benefitInputs).reduce((sum, val) => {
      const num = parseFloat(val) || 0;
      return sum + num;
    }, 0);
    return total;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {language === 'de' ? 'Deutsche Steuerhilfen' : 'German Tax Helpers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'deductions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('deductions')}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              {language === 'de' ? 'Steuerabzüge' : 'Tax Deductions'}
            </Button>
            <Button
              variant={activeTab === 'benefits' ? 'default' : 'outline'}
              onClick={() => setActiveTab('benefits')}
              className="flex-1"
            >
              <Heart className="w-4 h-4 mr-2" />
              {language === 'de' ? 'Sozialleistungen' : 'Social Benefits'}
            </Button>
          </div>

          {activeTab === 'deductions' && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {GERMAN_TAX_DEDUCTIONS.map((deduction) => (
                  <Card key={deduction.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{deduction.name}</h4>
                        <p className="text-sm text-base-content/70">{deduction.description}</p>
                      </div>
                      <Badge variant="secondary">
                        {language === 'de' ? 'Max' : 'Max'} {deduction.maxAmount}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={deduction.id}>
                        {language === 'de' ? 'Ihr Betrag (€)' : 'Your Amount (€)'}
                      </Label>
                      <Input
                        id={deduction.id}
                        type="number"
                        placeholder="0.00"
                        value={deductionInputs[deduction.id as keyof typeof deductionInputs]}
                        onChange={(e) => setDeductionInputs(prev => ({
                          ...prev,
                          [deduction.id]: e.target.value
                        }))}
                      />
                    </div>

                    {deduction.examples && (
                      <div className="mt-3">
                        <p className="text-xs text-base-content/60 mb-1">
                          {language === 'de' ? 'Beispiele:' : 'Examples:'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {deduction.examples.map((example, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-primary">
                      {language === 'de' ? 'Gesamte Steuerersparnis' : 'Total Tax Savings'}
                    </h4>
                    <p className="text-sm text-base-content/70">
                      {language === 'de' ? 'Potenzielle jährliche Ersparnis' : 'Potential annual savings'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {fmt(calculateDeductions())}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {language === 'de' ? 'pro Jahr' : 'per year'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {GERMAN_SOCIAL_BENEFITS.map((benefit) => (
                  <Card key={benefit.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{benefit.name}</h4>
                        <p className="text-sm text-base-content/70">{benefit.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{benefit.amount}</div>
                        <div className="text-xs text-base-content/60">{benefit.duration}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={benefit.id}>
                        {language === 'de' ? 'Ihr Anspruch (€)' : 'Your Entitlement (€)'}
                      </Label>
                      <Input
                        id={benefit.id}
                        type="number"
                        placeholder="0.00"
                        value={benefitInputs[benefit.id as keyof typeof benefitInputs]}
                        onChange={(e) => setBenefitInputs(prev => ({
                          ...prev,
                          [benefit.id]: e.target.value
                        }))}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-4 bg-success/5 border-success/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-success">
                      {language === 'de' ? 'Monatliche Sozialleistungen' : 'Monthly Social Benefits'}
                    </h4>
                    <p className="text-sm text-base-content/70">
                      {language === 'de' ? 'Ihr geschätzter monatlicher Anspruch' : 'Your estimated monthly entitlement'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success">
                      {fmt(calculateBenefits())}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {language === 'de' ? 'pro Monat' : 'per month'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}