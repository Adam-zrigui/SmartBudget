'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Clock, Shield, Zap, Building, Smartphone } from 'lucide-react';
import { GERMAN_PAYMENT_METHODS } from '@/lib/utils';

interface PaymentMethodSelectorProps {
  selectedMethod?: string;
  onMethodChange?: (method: string) => void;
  showComparison?: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  showComparison = true
}: PaymentMethodSelectorProps) {
  const language = useLanguageStore((s) => s.language);
  const [selected, setSelected] = useState(selectedMethod || '');

  const handleSelection = (methodId: string) => {
    setSelected(methodId);
    onMethodChange?.(methodId);
  };

  const selectedData = GERMAN_PAYMENT_METHODS.find(m => m.id === selected);

  const getIcon = (methodId: string) => {
    switch (methodId) {
      case 'sepa': return <CreditCard className="w-5 h-5" />;
      case 'instant-sepa': return <Zap className="w-5 h-5" />;
      case 'giropay': return <Building className="w-5 h-5" />;
      case 'sofort': return <Smartphone className="w-5 h-5" />;
      case 'paypal': return <Shield className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {language === 'de' ? 'Deutsche Zahlungsmethoden' : 'German Payment Methods'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selected} onValueChange={handleSelection} className="space-y-4">
            {GERMAN_PAYMENT_METHODS.map((method) => (
              <div key={method.id} className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <Card className={`p-4 transition-all ${selected === method.id ? 'border-primary bg-primary/5' : 'hover:bg-base-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{method.icon}</div>
                        <div>
                          <h4 className="font-semibold">{method.name}</h4>
                          <p className="text-sm text-base-content/70">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{method.fees}</div>
                        <div className="text-xs text-base-content/60">{method.processingTime}</div>
                      </div>
                    </div>
                  </Card>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedData && showComparison && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'de' ? 'Details zu' : 'Details for'} {selectedData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">
                      {language === 'de' ? 'Bearbeitungszeit' : 'Processing Time'}
                    </div>
                    <div className="text-sm text-base-content/70">{selectedData.processingTime}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">
                      {language === 'de' ? 'Gebühren' : 'Fees'}
                    </div>
                    <div className="text-sm text-base-content/70">{selectedData.fees}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium">
                      {language === 'de' ? 'Maximale Summe' : 'Maximum Amount'}
                    </div>
                    <div className="text-sm text-base-content/70">{selectedData.maxAmount}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-medium">
                      {language === 'de' ? 'Verfügbarkeit' : 'Availability'}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {language === 'de' ? 'EU-weit verfügbar' : 'Available EU-wide'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-base-200 rounded-lg">
              <h4 className="font-semibold mb-2">
                {language === 'de' ? 'Sicherheit & Compliance' : 'Security & Compliance'}
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">PSD2</Badge>
                <Badge variant="secondary">SCA</Badge>
                <Badge variant="secondary">SSL/TLS</Badge>
                <Badge variant="secondary">
                  {language === 'de' ? 'GDPR konform' : 'GDPR compliant'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'de' ? 'Vergleichstabelle' : 'Comparison Table'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">
                      {language === 'de' ? 'Methode' : 'Method'}
                    </th>
                    <th className="text-left py-2">
                      {language === 'de' ? 'Gebühren' : 'Fees'}
                    </th>
                    <th className="text-left py-2">
                      {language === 'de' ? 'Bearbeitung' : 'Processing'}
                    </th>
                    <th className="text-left py-2">
                      {language === 'de' ? 'Max. Betrag' : 'Max Amount'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {GERMAN_PAYMENT_METHODS.map((method) => (
                    <tr key={method.id} className="border-b">
                      <td className="py-2 font-medium">{method.name}</td>
                      <td className="py-2">{method.fees}</td>
                      <td className="py-2">{method.processingTime}</td>
                      <td className="py-2">{method.maxAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}