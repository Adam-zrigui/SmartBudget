import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Target, TrendingUp, Plus, CheckCircle, Clock, AlertTriangle, Trash2, Edit, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { auth } from '@/lib/firebase';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: Date;
  priority: number;
  category?: string;
  description?: string;
  isCompleted: boolean;
  progress: number;
  daysLeft?: number;
  monthlyNeeded?: number;
}

interface GoalContribution {
  id: string;
  amount: number;
  date: Date;
  description?: string;
}

interface SavingsGoalsProps {
  goals?: any[];
  addGoal?: (goal: any) => void;
  updateGoal?: (goal: any) => void;
  deleteGoal?: (id: string) => void;
  addContribution?: (contribution: any) => void;
}

const GOAL_CATEGORIES = [
  { value: 'vacation', label: { de: 'Urlaub', en: 'Vacation' } },
  { value: 'car', label: { de: 'Auto', en: 'Car' } },
  { value: 'house', label: { de: 'Haus', en: 'House' } },
  { value: 'emergency', label: { de: 'Notgroschen', en: 'Emergency Fund' } },
  { value: 'retirement', label: { de: 'Rente', en: 'Retirement' } },
  { value: 'education', label: { de: 'Bildung', en: 'Education' } },
  { value: 'business', label: { de: 'Geschaeft', en: 'Business' } },
  { value: 'other', label: { de: 'Sonstiges', en: 'Other' } }
];

const PRIORITY_LEVELS = [
  { value: 0, label: { de: 'Niedrig', en: 'Low' }, color: 'secondary' },
  { value: 1, label: { de: 'Mittel', en: 'Medium' }, color: 'default' },
  { value: 2, label: { de: 'Hoch', en: 'High' }, color: 'destructive' }
];

export default function SavingsGoals({ goals: propGoals, addGoal: propAddGoal, updateGoal: propUpdateGoal, deleteGoal: propDeleteGoal, addContribution: propAddContribution }: SavingsGoalsProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { toast } = useToast();
  const toNumber = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const normalizeGoal = (goal: any) => {
    const targetAmount = toNumber(goal?.targetAmount ?? goal?.target_amount);
    const currentAmount = toNumber(goal?.currentAmount ?? goal?.current_amount);
    const progress = toNumber(goal?.progress) || (targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0);
    const isCompleted = Boolean(goal?.isCompleted ?? (targetAmount > 0 && currentAmount >= targetAmount));
    return {
      ...goal,
      targetAmount,
      currentAmount,
      progress: Math.max(0, Math.min(progress, 100)),
      priority: toNumber(goal?.priority),
      isCompleted,
    };
  };
  const normalizeArray = (value: any, key?: string) => {
    if (Array.isArray(value)) return value.map(normalizeGoal);
    if (key && Array.isArray(value?.[key])) return value[key].map(normalizeGoal);
    return [];
  };

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  // Local state for standalone usage
  const [goals, setGoals] = useState<any[]>(normalizeArray(propGoals, 'goals'));

  // Load data if not provided via props
  useEffect(() => {
    if (!propGoals) {
      (async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch('/api/savings-goals', { headers });
          if (res.ok) {
            const data = await res.json();
            setGoals(normalizeArray(data, 'goals'));
          } else {
            console.error('Failed to load goals:', res.statusText);
          }
        } catch (err) {
          console.error('Failed to load goals:', err);
        }
      })();
    } else {
      setGoals(normalizeArray(propGoals, 'goals'));
    }
  }, [propGoals]);

  // Default functions for standalone usage
  const addGoal = propAddGoal || (async (goal: any) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers,
        body: JSON.stringify(goal)
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals(prev => [...prev, newGoal]);
        toast({
          title: t.savingsGoals?.goalAdded || "Goal added",
          description: `${goal.name} has been created.`,
        });
      } else {
        console.error('Failed to add goal:', res.statusText);
        toast({
          title: t.savingsGoals?.error || "Error",
          description: "Failed to add goal.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Failed to add goal:', err);
      toast({
        title: t.savingsGoals?.error || "Error",
        description: "Failed to add goal.",
        variant: "destructive",
      });
    }
  });

  const updateGoal = propUpdateGoal || (async (goal: any) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/savings-goals/${goal.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(goal)
      });
      if (res.ok) {
        const updatedGoal = await res.json();
        setGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g));
        toast({
          title: t.savingsGoals?.goalUpdated || "Goal updated",
          description: `${goal.name} has been updated.`,
        });
      } else {
        console.error('Failed to update goal:', res.statusText);
        toast({
          title: t.savingsGoals?.error || "Error",
          description: "Failed to update goal.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Failed to update goal:', err);
      toast({
        title: t.savingsGoals?.error || "Error",
        description: "Failed to update goal.",
        variant: "destructive",
      });
    }
  });

  const deleteGoal = propDeleteGoal || (async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/savings-goals/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== id));
        toast({
          title: t.savingsGoals?.goalDeleted || "Goal deleted",
          description: "The goal has been removed.",
        });
      } else {
        console.error('Failed to delete goal:', res.statusText);
        toast({
          title: t.savingsGoals?.error || "Error",
          description: "Failed to delete goal.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
      toast({
        title: t.savingsGoals?.error || "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
    }
  });

  const addContribution = propAddContribution || (async (contribution: any) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/goal-contributions', {
        method: 'POST',
        headers,
        body: JSON.stringify(contribution)
      });
      if (res.ok) {
        // Refresh goals data
        const refreshHeaders = await getAuthHeaders();
        const refreshRes = await fetch('/api/savings-goals', { headers: refreshHeaders });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setGoals(normalizeArray(data, 'goals'));
        }
        toast({
          title: t.savingsGoals?.contributionAdded || "Contribution added",
          description: "Your contribution has been recorded.",
        });
      } else {
        console.error('Failed to add contribution:', res.statusText);
        toast({
          title: t.savingsGoals?.error || "Error",
          description: "Failed to add contribution.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Failed to add contribution:', err);
      toast({
        title: t.savingsGoals?.error || "Error",
        description: "Failed to add contribution.",
        variant: "destructive",
      });
    }
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const goalsList = Array.isArray(goals) ? goals : [];

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    dueDate: '',
    priority: 0,
    category: '',
    description: ''
  });

  const [newContribution, setNewContribution] = useState({
    amount: 0,
    description: ''
  });

  const handleCreateGoal = () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte Name und Zielbetrag angeben' : 'Please provide name and target amount',
        variant: 'destructive'
      });
      return;
    }

    const goalData = {
      ...newGoal,
      dueDate: newGoal.dueDate ? new Date(newGoal.dueDate) : undefined
    };

    if (editingGoalId) {
      updateGoal({ id: editingGoalId, ...goalData });
    } else {
      addGoal(goalData);
    }
    setNewGoal({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      dueDate: '',
      priority: 0,
      category: '',
      description: ''
    });
    setIsCreateDialogOpen(false);
    setEditingGoalId(null);

    toast({
      title: editingGoalId
        ? (language === 'de' ? 'Sparziel aktualisiert' : 'Savings goal updated')
        : (language === 'de' ? 'Sparziel erstellt' : 'Savings goal created'),
      description: editingGoalId
        ? (language === 'de' ? 'Sparziel wurde erfolgreich aktualisiert' : 'Savings goal updated successfully')
        : (language === 'de' ? 'Neues Sparziel wurde erfolgreich erstellt' : 'New savings goal created successfully')
    });
  };

  const openEditGoal = (goal: any) => {
    setNewGoal({
      name: goal.name || '',
      targetAmount: toNumber(goal.targetAmount),
      currentAmount: toNumber(goal.currentAmount),
      dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : '',
      priority: toNumber(goal.priority),
      category: goal.category || '',
      description: goal.description || '',
    });
    setEditingGoalId(goal.id);
    setIsCreateDialogOpen(true);
  };

  const handleAddContribution = () => {
    if (!selectedGoalId || newContribution.amount <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte Betrag angeben' : 'Please provide amount',
        variant: 'destructive'
      });
      return;
    }

    addContribution({
      goalId: selectedGoalId,
      amount: newContribution.amount,
      date: new Date(),
      description: newContribution.description
    });

    setNewContribution({ amount: 0, description: '' });
    setIsContributionDialogOpen(false);
    setSelectedGoalId('');

    toast({
      title: language === 'de' ? 'Beitrag hinzugefügt' : 'Contribution added',
      description: language === 'de' ? 'Beitrag wurde erfolgreich hinzugefügt' : 'Contribution added successfully'
    });
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    const confirmed = window.confirm(
      language === 'de'
        ? `Moechtest du das Sparziel "${goalName}" wirklich loeschen?`
        : `Do you really want to delete the savings goal "${goalName}"?`
    );
    if (!confirmed) return;

    try {
      await Promise.resolve(deleteGoal(goalId));
      toast({
        title: language === 'de' ? 'Sparziel geloescht' : 'Savings goal deleted',
        description: language === 'de'
          ? 'Das Sparziel wurde entfernt.'
          : 'The savings goal has been removed.',
      });
    } catch (err) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Sparziel konnte nicht geloescht werden.'
          : 'Savings goal could not be deleted.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleGoalCompletion = async (goal: any) => {
    const nextCompleted = !goal.isCompleted;
    const updatedGoal = {
      ...goal,
      isCompleted: nextCompleted,
      currentAmount: nextCompleted
        ? Math.max(toNumber(goal.currentAmount), toNumber(goal.targetAmount))
        : Math.min(toNumber(goal.currentAmount), toNumber(goal.targetAmount)),
    };

    try {
      await Promise.resolve(updateGoal(updatedGoal));
      toast({
        title: nextCompleted
          ? (language === 'de' ? 'Ziel abgeschlossen' : 'Goal completed')
          : (language === 'de' ? 'Ziel wieder geoeffnet' : 'Goal reopened'),
        description: nextCompleted
          ? (language === 'de' ? 'Das Sparziel wurde als erreicht markiert.' : 'The goal was marked as achieved.')
          : (language === 'de' ? 'Das Sparziel ist wieder aktiv.' : 'The goal is active again.'),
      });
    } catch (err) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Status konnte nicht aktualisiert werden.'
          : 'Could not update goal status.',
        variant: 'destructive',
      });
    }
  };

  const getPriorityInfo = (priority: number) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[0];
  };

  const getCategoryLabel = (category: string) => {
    const cat = GOAL_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label[language as keyof typeof cat.label] : category;
  };

  const getGoalStatus = (goal: SavingsGoal) => {
    if (goal.isCompleted) return { status: 'completed', icon: CheckCircle, color: 'default' };
    if (goal.daysLeft && goal.daysLeft < 0) return { status: 'overdue', icon: AlertTriangle, color: 'destructive' };
    if (goal.progress >= 75) return { status: 'on-track', icon: TrendingUp, color: 'default' };
    return { status: 'in-progress', icon: Clock, color: 'secondary' };
  };

  const formatCurrency = (amount: number) => `€${toNumber(amount).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'de' ? 'Sparziele' : 'Savings Goals'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de'
              ? 'Setze dir finanzielle Ziele und verfolge deinen Fortschritt'
              : 'Set financial goals and track your progress'
            }
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'de' ? 'Beitrag' : 'Contribute'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'de' ? 'Beitrag hinzufuegen' : 'Add Contribution'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'de'
                    ? 'Fuege einen Beitrag zu einem deiner Sparziele hinzu'
                    : 'Add a contribution to one of your savings goals'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal-select">
                    {language === 'de' ? 'Sparziel' : 'Savings Goal'}
                  </Label>
                  <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'de' ? 'Ziel waehlen' : 'Select goal'} />
                    </SelectTrigger>
                    <SelectContent>
                      {goalsList.filter(g => !g.isCompleted).map((goal, index) => (
                        <SelectItem key={goal.id ?? `goal-option-${index}`} value={goal.id ?? `goal-${index}`}>
                          {goal.name} - {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contribution-amount">
                    {language === 'de' ? 'Betrag (EUR)' : 'Amount (€)'}
                  </Label>
                  <Input
                    id="contribution-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newContribution.amount || ''}
                    onChange={(e) => setNewContribution(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <Label htmlFor="contribution-description">
                    {language === 'de' ? 'Beschreibung (optional)' : 'Description (optional)'}
                  </Label>
                  <Textarea
                    id="contribution-description"
                    value={newContribution.description}
                    onChange={(e) => setNewContribution(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={language === 'de' ? 'z.B. Monatliche Einzahlung' : 'e.g. Monthly deposit'}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddContribution} className="flex-1">
                    {language === 'de' ? 'Hinzufügen' : 'Add'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsContributionDialogOpen(false)}>
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setEditingGoalId(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Target className="h-4 w-4" />
                {language === 'de' ? 'Ziel erstellen' : 'Create Goal'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoalId
                    ? (language === 'de' ? 'Sparziel bearbeiten' : 'Edit Savings Goal')
                    : (language === 'de' ? 'Neues Sparziel' : 'New Savings Goal')}
                </DialogTitle>
                <DialogDescription>
                  {language === 'de'
                    ? 'Erstelle ein neues Sparziel und verfolge deinen Fortschritt'
                    : 'Create a new savings goal and track your progress'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal-name">
                    {language === 'de' ? 'Name des Ziels' : 'Goal Name'}
                  </Label>
                  <Input
                    id="goal-name"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'de' ? 'z.B. Urlaub 2025' : 'e.g. Vacation 2025'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target-amount">
                      {language === 'de' ? 'Zielbetrag (EUR)' : 'Target Amount (€)'}
                    </Label>
                    <Input
                      id="target-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newGoal.targetAmount || ''}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                      placeholder="5000.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current-amount">
                      {language === 'de' ? 'Aktueller Betrag (EUR)' : 'Current Amount (€)'}
                    </Label>
                    <Input
                      id="current-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newGoal.currentAmount || ''}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                      placeholder="500.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="due-date">
                    {language === 'de' ? 'Zieldatum (optional)' : 'Target Date (optional)'}
                  </Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">
                      {language === 'de' ? 'Prioritaet' : 'Priority'}
                    </Label>
                    <Select value={newGoal.priority.toString()} onValueChange={(value) => setNewGoal(prev => ({ ...prev, priority: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map(priority => (
                          <SelectItem key={priority.value} value={priority.value.toString()}>
                            {priority.label[language as keyof typeof priority.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">
                      {language === 'de' ? 'Kategorie' : 'Category'}
                    </Label>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'de' ? 'Kategorie' : 'Category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label[language as keyof typeof category.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">
                    {language === 'de' ? 'Beschreibung (optional)' : 'Description (optional)'}
                  </Label>
                  <Textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={language === 'de' ? 'Zusaetzliche Details zu deinem Ziel' : 'Additional details about your goal'}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateGoal} className="flex-1">
                    {editingGoalId
                      ? (language === 'de' ? 'Speichern' : 'Save')
                      : (language === 'de' ? 'Erstellen' : 'Create')}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goalsList.map((goal, index) => {
          const status = getGoalStatus(goal);
          const priority = getPriorityInfo(goal.priority);
          const StatusIcon = status.icon;
          const goalKey = goal.id ?? `${goal.name ?? 'goal'}-${index}`;

          return (
            <Card key={goalKey} className={`hover:shadow-md transition-shadow ${goal.isCompleted ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{goal.name}</CardTitle>
                    {goal.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getCategoryLabel(goal.category)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={priority.color as any} className="text-xs">
                      {priority.label[language as keyof typeof priority.label]}
                    </Badge>
                    <StatusIcon className={`h-4 w-4 ${status.color === 'destructive' ? 'text-destructive' : status.color === 'default' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteGoal(goal.id, goal.name)}
                      aria-label={language === 'de' ? 'Sparziel loeschen' : 'Delete savings goal'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEditGoal(goal)}
                      aria-label={language === 'de' ? 'Sparziel bearbeiten' : 'Edit savings goal'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardDescription className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {toNumber(goal.progress).toFixed(1)}% {language === 'de' ? 'erreicht' : 'achieved'}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Progress value={goal.progress} className="h-3" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">
                      {language === 'de' ? 'Verbleibend' : 'Remaining'}
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(goal.targetAmount - goal.currentAmount)}
                    </div>
                  </div>

                  {goal.monthlyNeeded && (
                    <div>
                      <div className="text-muted-foreground">
                        {language === 'de' ? 'Monatlich benoetigt' : 'Monthly needed'}
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(goal.monthlyNeeded)}
                      </div>
                    </div>
                  )}
                </div>

                {goal.daysLeft !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={goal.daysLeft < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                      {goal.daysLeft < 0
                        ? `${Math.abs(goal.daysLeft)} ${language === 'de' ? 'Tage überfällig' : 'days overdue'}`
                        : `${goal.daysLeft} ${language === 'de' ? 'Tage verbleibend' : 'days remaining'}`
                      }
                    </span>
                  </div>
                )}

                {goal.isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      {language === 'de' ? 'Ziel erreicht!' : 'Goal achieved!'}
                    </span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleToggleGoalCompletion(goal)}
                >
                  <RotateCcw className="h-4 w-4" />
                  {goal.isCompleted
                    ? (language === 'de' ? 'Wieder aktivieren' : 'Reopen Goal')
                    : (language === 'de' ? 'Als erreicht markieren' : 'Mark as Completed')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goalsList.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'de' ? 'Keine Sparziele vorhanden' : 'No savings goals yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'de'
              ? 'Erstelle dein erstes Sparziel und beginne mit dem Sparen'
              : 'Create your first savings goal and start saving'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Target className="h-4 w-4" />
            {language === 'de' ? 'Sparziel erstellen' : 'Create Savings Goal'}
          </Button>
        </Card>
      )}
    </div>
  );
}
