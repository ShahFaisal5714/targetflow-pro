import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, History, FileJson, FileCode, Loader2 } from 'lucide-react';
import { useBackupSchedule, type BackupScheduleSettings } from '@/hooks/useBackupSchedule';
import { format, formatDistanceToNow } from 'date-fns';

export default function BackupScheduleCard() {
  const { settings, loading, saving, saveSettings } = useBackupSchedule();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (enabled: boolean) => {
    saveSettings({ enabled });
  };

  const handleFrequencyChange = (frequency: BackupScheduleSettings['frequency']) => {
    saveSettings({ frequency });
  };

  const handleRetentionChange = (days: string) => {
    saveSettings({ retentionDays: parseInt(days, 10) });
  };

  const handleFormatChange = (format: BackupScheduleSettings['format']) => {
    saveSettings({ format });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Backups
            </CardTitle>
            <CardDescription className="mt-1">
              Configure automatic database backups
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={settings.enabled ? "default" : "secondary"}>
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          {settings.enabled && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {settings.frequency.charAt(0).toUpperCase() + settings.frequency.slice(1)}
            </Badge>
          )}
          {settings.lastBackup && (
            <Badge variant="outline" className="gap-1">
              <History className="h-3 w-3" />
              Last: {formatDistanceToNow(new Date(settings.lastBackup), { addSuffix: true })}
            </Badge>
          )}
        </div>

        {/* Settings Grid */}
        <div className={`grid gap-4 sm:grid-cols-3 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm">Backup Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={(v) => handleFrequencyChange(v as BackupScheduleSettings['frequency'])}
              disabled={saving || !settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Retention */}
          <div className="space-y-2">
            <Label className="text-sm">Retention Period</Label>
            <Select
              value={String(settings.retentionDays)}
              onValueChange={handleRetentionChange}
              disabled={saving || !settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-sm">Backup Format</Label>
            <Select
              value={settings.format}
              onValueChange={(v) => handleFormatChange(v as BackupScheduleSettings['format'])}
              disabled={saving || !settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="sql">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    SQL
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Next Backup Info */}
        {settings.enabled && settings.nextBackup && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4" />
            <span>
              Next scheduled backup: <strong className="text-foreground">
                {format(new Date(settings.nextBackup), 'PPP p')}
              </strong>
            </span>
          </div>
        )}

        {/* Info Message */}
        <p className="text-xs text-muted-foreground">
          {settings.enabled 
            ? `Backups will be automatically created ${settings.frequency} and stored for ${settings.retentionDays} days. You'll receive a download prompt when backups are ready.`
            : 'Enable scheduled backups to automatically protect your data at regular intervals.'
          }
        </p>
      </CardContent>
    </Card>
  );
}