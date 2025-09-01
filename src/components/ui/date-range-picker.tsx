
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { subDays } from 'date-fns';
import { Separator } from './separator';

interface DateRangePickerProps {
  dateRange?: DateRange;
  onUpdate: (range?: DateRange) => void;
  className?: string;
}

const PRESETS = [
    { value: 'all', label: 'All time'},
    { value: '30d', label: 'Last 30 days', range: { from: subDays(new Date(), 29), to: new Date() }},
    { value: '90d', label: 'Last 90 days', range: { from: subDays(new Date(), 89), to: new Date() }},
    { value: '1y', label: 'Last year', range: { from: subDays(new Date(), 364), to: new Date() }},
]

export function DateRangePicker({
  dateRange: date,
  onUpdate,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(date);

  React.useEffect(() => {
    setSelectedRange(date);
  }, [date]);

  const handlePresetChange = (value: string) => {
    if(value === 'all') {
        onUpdate(undefined);
    } else {
        const preset = PRESETS.find(p => p.value === value);
        if(preset) {
            onUpdate(preset.range);
        }
    }
  }

  const handleApply = () => {
    onUpdate(selectedRange);
    setOpen(false);
  }
  
  const handleCancel = () => {
    setSelectedRange(date);
    setOpen(false);
  }

  const getActivePreset = () => {
    if (!date?.from && !date?.to) return 'all';
    for (const preset of PRESETS) {
      if (preset.range && date?.from?.getTime() === preset.range.from.getTime() && date.to?.getTime() === preset.range.to.getTime()) {
        return preset.value;
      }
    }
    return 'custom';
  }
  
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={(isOpen) => {
          if (!isOpen) {
              handleCancel();
          }
          setOpen(isOpen);
      }}>
        <div className="flex items-center gap-2">
             <Select value={getActivePreset()} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                    {PRESETS.map(preset => (
                        <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
                    ))}
                     <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>
            <PopoverTrigger asChild>
                <Button
                id="date"
                variant={'outline'}
                className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                    date.to ? (
                    <>
                        {format(date.from, 'dd/MM/yyyy')} -{' '}
                        {format(date.to, 'dd/MM/yyyy')}
                    </>
                    ) : (
                    format(date.from, 'dd/MM/yyyy')
                    )
                ) : (
                    <span>Pick a date</span>
                )}
                </Button>
            </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={setSelectedRange}
            numberOfMonths={2}
          />
           <div className="p-4 pt-2">
            <Separator />
             <div className="flex items-center justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleApply}>OK</Button>
            </div>
           </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
