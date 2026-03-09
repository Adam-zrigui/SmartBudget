"use client"

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Plus, Edit, Trash2, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  currency: string;
  purchaseDate: Date;
  portfolio?: string;
  riskLevel?: string;
  expectedReturn?: number;
  broker?: string;
  notes?: string;
  totalValue?: number;
  totalCost?: number;
  unrealizedGain?: number;
}

interface InvestmentTrackerProps {
  investments?: Investment[];
  addInvestment?: (investment: any) => void;
  updateInvestment?: (investment: any) => void;
  deleteInvestment?: (id: string) => void;
  updatePrices?: (investments: Investment[]) => void;
}

const INVESTMENT_TYPES = [
  { value: 'stocks', label: { de: 'Aktien', en: 'Stocks' } },
  { value: 'crypto', label: { de: 'Kryptowährungen', en: 'Cryptocurrency' } },
  { value: 'bonds', label: { de: 'Anleihen', en: 'Bonds' } },
  { value: 'real_estate', label: { de: 'Immobilien', en: 'Real Estate' } },
  { value: 'mutual_fund', label: { de: 'Investmentfonds', en: 'Mutual Funds' } },
  { value: 'etf', label: { de: 'ETFs', en: 'ETFs' } },
  { value: 'other', label: { de: 'Sonstige', en: 'Other' } }
];

const RISK_LEVELS = [
  { value: 'low', label: { de: 'Niedrig', en: 'Low' }, color: 'default' },
  { value: 'medium', label: { de: 'Mittel', en: 'Medium' }, color: 'secondary' },
  { value: 'high', label: { de: 'Hoch', en: 'High' }, color: 'destructive' }
];

const PORTFOLIOS = [
  { value: 'conservative', label: { de: 'Konservativ', en: 'Conservative' } },
  { value: 'balanced', label: { de: 'Ausgewogen', en: 'Balanced' } },
  { value: 'aggressive', label: { de: 'Aggressiv', en: 'Aggressive' } },
  { value: 'retirement', label: { de: 'Altersvorsorge', en: 'Retirement' } },
  { value: 'growth', label: { de: 'Wachstum', en: 'Growth' } }
];

export default function InvestmentTracker({
  investments: propInvestments,
  addInvestment: propAddInvestment,
  updateInvestment: propUpdateInvestment,
  deleteInvestment: propDeleteInvestment,
  updatePrices: propUpdatePrices
}: InvestmentTrackerProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const investmentsList = Array.isArray(propInvestments) ? propInvestments : [];

  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'stocks',
    symbol: '',
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    currency: 'EUR',
    purchaseDate: new Date().toISOString().split('T')[0],
    portfolio: '',
    riskLevel: 'medium',
    expectedReturn: 0,
    broker: '',
    notes: ''
  });

  // Calculate investment metrics
  const processedInvestments = investmentsList.map(investment => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    const totalValue = investment.quantity * currentPrice;
    const totalCost = investment.quantity * investment.purchasePrice;
    const unrealizedGain = totalValue - totalCost;
    const gainPercentage = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

    return {
      ...investment,
      currentPrice,
      totalValue,
      totalCost,
      unrealizedGain,
      gainPercentage
    };
  });

  // Portfolio summary
  const portfolioSummary = processedInvestments.reduce(
    (acc, inv) => ({
      totalValue: acc.totalValue + (inv.totalValue || 0),
      totalCost: acc.totalCost + (inv.totalCost || 0),
      totalGain: acc.totalGain + (inv.unrealizedGain || 0),
    }),
    { totalValue: 0, totalCost: 0, totalGain: 0 }
  );

  const handleCreateInvestment = () => {
    if (!newInvestment.name || !newInvestment.type || newInvestment.quantity <= 0 || newInvestment.purchasePrice <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte alle erforderlichen Felder ausfüllen' : 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (propAddInvestment) {
      propAddInvestment(newInvestment);
    }

    setNewInvestment({
      name: '',
      type: 'stocks',
      symbol: '',
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      currency: 'EUR',
      purchaseDate: new Date().toISOString().split('T')[0],
      portfolio: '',
      riskLevel: 'medium',
      expectedReturn: 0,
      broker: '',
      notes: ''
    });
    setIsCreateDialogOpen(false);

    toast({
      title: language === 'de' ? 'Investment erstellt' : 'Investment created',
      description: language === 'de' ? 'Neues Investment wurde erfolgreich erstellt' : 'New investment created successfully'
    });
  };

  const getInvestmentTypeLabel = (type: string) => {
    const typeObj = INVESTMENT_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label[language as keyof typeof typeObj.label] : type;
  };

  const getRiskLevelInfo = (riskLevel: string) => {
    return RISK_LEVELS.find(r => r.value === riskLevel) || RISK_LEVELS[1];
  };

  const getPortfolioLabel = (portfolio: string) => {
    const port = PORTFOLIOS.find(p => p.value === portfolio);
    return port ? port.label[language as keyof typeof port.label] : portfolio;
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'de' ? 'Investitionen' : 'Investments'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de'
              ? 'Verwalte deine Investment-Portfolio und verfolge die Performance'
              : 'Manage your investment portfolio and track performance'
            }
          </p>
        </div>

        <div className="flex gap-2">
          {propUpdatePrices && (
            <Button
              variant="outline"
              onClick={() => propUpdatePrices(processedInvestments)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {language === 'de' ? 'Preise aktualisieren' : 'Update Prices'}
            </Button>
          )}

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'de' ? 'Investment hinzufügen' : 'Add Investment'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'de' ? 'Neues Investment' : 'New Investment'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'de'
                    ? 'Füge ein neues Investment zu deinem Portfolio hinzu'
                    : 'Add a new investment to your portfolio'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investment-name">
                      {language === 'de' ? 'Name' : 'Name'}
                    </Label>
                    <Input
                      id="investment-name"
                      value={newInvestment.name}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={language === 'de' ? 'z.B. Apple Aktien' : 'e.g. Apple Stocks'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="investment-type">
                      {language === 'de' ? 'Typ' : 'Type'}
                    </Label>
                    <Select value={newInvestment.type} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label[language as keyof typeof type.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="symbol">
                      {language === 'de' ? 'Symbol' : 'Symbol'}
                    </Label>
                    <Input
                      id="symbol"
                      value={newInvestment.symbol}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="AAPL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">
                      {language === 'de' ? 'Anzahl' : 'Quantity'}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvestment.quantity || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">
                      {language === 'de' ? 'Währung' : 'Currency'}
                    </Label>
                    <Select value={newInvestment.currency} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase-price">
                      {language === 'de' ? 'Kaufpreis' : 'Purchase Price'}
                    </Label>
                    <Input
                      id="purchase-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvestment.purchasePrice || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="150.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current-price">
                      {language === 'de' ? 'Aktueller Preis (optional)' : 'Current Price (optional)'}
                    </Label>
                    <Input
                      id="current-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvestment.currentPrice || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="180.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purchase-date">
                    {language === 'de' ? 'Kaufdatum' : 'Purchase Date'}
                  </Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={newInvestment.purchaseDate}
                    onChange={(e) => setNewInvestment(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="portfolio">
                      {language === 'de' ? 'Portfolio' : 'Portfolio'}
                    </Label>
                    <Select value={newInvestment.portfolio} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, portfolio: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'de' ? 'Portfolio wählen' : 'Select portfolio'} />
                      </SelectTrigger>
                      <SelectContent>
                        {PORTFOLIOS.map(portfolio => (
                          <SelectItem key={portfolio.value} value={portfolio.value}>
                            {portfolio.label[language as keyof typeof portfolio.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="risk-level">
                      {language === 'de' ? 'Risikolevel' : 'Risk Level'}
                    </Label>
                    <Select value={newInvestment.riskLevel} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, riskLevel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_LEVELS.map(risk => (
                          <SelectItem key={risk.value} value={risk.value}>
                            {risk.label[language as keyof typeof risk.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expected-return">
                      {language === 'de' ? 'Erwartete Rendite (%)' : 'Expected Return (%)'}
                    </Label>
                    <Input
                      id="expected-return"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newInvestment.expectedReturn || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, expectedReturn: parseFloat(e.target.value) || 0 }))}
                      placeholder="7.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="broker">
                      {language === 'de' ? 'Broker' : 'Broker'}
                    </Label>
                    <Input
                      id="broker"
                      value={newInvestment.broker}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, broker: e.target.value }))}
                      placeholder={language === 'de' ? 'z.B. ING' : 'e.g. ING'}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">
                    {language === 'de' ? 'Notizen (optional)' : 'Notes (optional)'}
                  </Label>
                  <Input
                    id="notes"
                    value={newInvestment.notes}
                    onChange={(e) => setNewInvestment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={language === 'de' ? 'Zusätzliche Informationen' : 'Additional information'}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateInvestment} className="flex-1">
                    {language === 'de' ? 'Hinzufügen' : 'Add'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Gesamtwert' : 'Total Value'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioSummary.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Gesamtkosten' : 'Total Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioSummary.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Unrealisierter Gewinn' : 'Unrealized Gain'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioSummary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(portfolioSummary.totalGain)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {processedInvestments.map((investment) => {
          const riskInfo = getRiskLevelInfo(investment.riskLevel || 'medium');
          const isPositive = (investment.unrealizedGain || 0) >= 0;

          return (
            <Card key={investment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{investment.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getInvestmentTypeLabel(investment.type)}
                      </Badge>
                      {investment.symbol && (
                        <span className="text-sm font-mono">{investment.symbol}</span>
                      )}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={riskInfo.color as any}>
                      {riskInfo.label[language as keyof typeof riskInfo.label]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      {language === 'de' ? 'Anzahl' : 'Quantity'}
                    </p>
                    <p className="font-medium">{investment.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {language === 'de' ? 'Aktueller Wert' : 'Current Value'}
                    </p>
                    <p className="font-medium">
                      {formatCurrency(investment.totalValue || 0, investment.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {language === 'de' ? 'Gewinn/Verlust' : 'Gain/Loss'}
                    </p>
                    <div className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCurrency(investment.unrealizedGain || 0, investment.currency)}
                      <span className="text-xs">
                        ({formatPercentage(investment.gainPercentage || 0)})
                      </span>
                    </div>
                  </div>

                  {investment.portfolio && (
                    <Badge variant="secondary" className="text-xs">
                      {getPortfolioLabel(investment.portfolio)}
                    </Badge>
                  )}
                </div>

                {investment.expectedReturn && investment.expectedReturn > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Erwartete Rendite' : 'Expected Return'}: {investment.expectedReturn}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {processedInvestments.length === 0 && (
        <Card className="p-8 text-center">
          <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {language === 'de' ? 'Keine Investments' : 'No Investments'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'de'
              ? 'Füge dein erstes Investment hinzu, um mit der Verfolgung zu beginnen'
              : 'Add your first investment to start tracking your portfolio'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === 'de' ? 'Erstes Investment hinzufügen' : 'Add First Investment'}
          </Button>
        </Card>
      )}
    </div>
  );
}
