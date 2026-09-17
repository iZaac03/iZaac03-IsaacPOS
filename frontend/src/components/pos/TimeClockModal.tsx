import React, { useState, useEffect } from 'react';
import { TimeLog } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  Calendar,
  User,
  History,
  AlertCircle,
} from 'lucide-react';

interface TimeClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (isTimedIn: boolean, log: TimeLog | null) => void;
}

export const TimeClockModal: React.FC<TimeClockModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { user, store } = useAuth();
  const [isTimedIn, setIsTimedIn] = useState<boolean>(false);
  const [currentLog, setCurrentLog] = useState<TimeLog | null>(null);
  const [todayLogs, setTodayLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [liveTime, setLiveTime] = useState<string>('');
  const [liveDate, setLiveDate] = useState<string>('');
  const [elapsedString, setElapsedString] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Clock Tick
  useEffect(() => {
    const updateLiveClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setLiveDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );

      if (currentLog?.time_in) {
        const start = new Date(currentLog.time_in).getTime();
        const diffMs = Math.max(0, now.getTime() - start);
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        setElapsedString(`${hours} hr${hours === 1 ? '' : 's'} ${mins} min${mins === 1 ? '' : 's'}`);
      } else {
        setElapsedString('');
      }
    };

    updateLiveClock();
    const interval = setInterval(updateLiveClock, 1000);
    return () => clearInterval(interval);
  }, [currentLog]);

  // Fetch status
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/time-logs/status');
      setIsTimedIn(res.data.is_timed_in);
      setCurrentLog(res.data.current_log);
      setTodayLogs(res.data.today_logs || []);
      onStatusChange?.(res.data.is_timed_in, res.data.current_log);
    } catch (err) {
      console.error('Failed to load time clock status', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setFeedback(null);
      fetchStatus();
    }
  }, [isOpen]);

  const handleTimeIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post('/time-logs/time-in', { notes: notes.trim() || undefined });
      const newLog = res.data.time_log;
      setIsTimedIn(true);
      setCurrentLog(newLog);
      setNotes('');
      setFeedback({ type: 'success', message: res.data.message || 'Clocked in successfully!' });
      onStatusChange?.(true, newLog);
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to clock in. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post('/time-logs/time-out', { notes: notes.trim() || undefined });
      setIsTimedIn(false);
      setCurrentLog(null);
      setNotes('');
      setFeedback({ type: 'success', message: res.data.message || 'Clocked out successfully!' });
      onStatusChange?.(false, null);
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to clock out. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (dtString: string) => {
    try {
      const d = new Date(dtString);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dtString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cashier Attendance Time Clock"
      subtitle="Log shift Time In and Time Out for register attendance audit"
      maxWidth="md"
      darkTheme={false}
    >
      <div className="space-y-4 text-xs text-slate-900">
        {/* Cashier Identity & Live Clock Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center font-bold text-emerald-400 font-mono text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>{user?.name || 'Cashier Staff'}</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono uppercase bg-slate-700 text-slate-300 font-semibold">
                  {user?.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {store?.store_name || 'Daumar Supermarket'}
              </div>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 border-slate-700 pt-2 sm:pt-0">
            <div className="font-mono text-lg font-black tracking-tight text-emerald-400 tabular-nums">
              {liveTime}
            </div>
            <div className="text-[11px] text-slate-300 flex items-center sm:justify-end gap-1 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{liveDate}</span>
            </div>
          </div>
        </div>

        {/* Current Attendance Status Card */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ${
            isTimedIn
              ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
              : 'bg-amber-50/70 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span
                className={`w-3 h-3 rounded-full ${
                  isTimedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>
                {isTimedIn ? 'Shift Status: Currently TIMED IN (On Duty)' : 'Shift Status: Currently NOT TIMED IN (Off Duty)'}
              </span>
            </div>
            {isTimedIn && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-xs">
                ACTIVE SHIFT
              </span>
            )}
          </div>

          {isTimedIn && currentLog && (
            <div className="grid grid-cols-2 gap-3 pt-2 mt-2 border-t border-emerald-200 text-xs">
              <div>
                <span className="text-slate-600 block text-[11px]">Clocked In At:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatTimestamp(currentLog.time_in)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-600 block text-[11px]">Current Shift Elapsed:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  {elapsedString || '0 mins'}
                </span>
              </div>
              {currentLog.notes && (
                <div className="col-span-2 text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-emerald-200">
                  <span className="font-semibold text-slate-700">Opening remarks: </span>
                  {currentLog.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-100/70 text-emerald-900 border-emerald-300'
                : 'bg-rose-100/70 text-rose-900 border-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        )}

        {/* Action Form: Time In or Time Out */}
        {!isTimedIn ? (
          <form onSubmit={handleTimeIn} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>Start Shift: Time In</span>
            </h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Starting Cash Float / Opening Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Starting register cash drawer ₱2,000"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>{isSubmitting ? 'Clocking In...' : 'Confirm TIME IN (Start Shift)'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleTimeOut} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>End Shift: Time Out</span>
            </h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Handover Notes / Closing Cash Float Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Register balanced, drawer handed over to next shift"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:border-rose-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSubmitting ? 'Clocking Out...' : 'Confirm TIME OUT (End Shift)'}</span>
            </button>
          </form>
        )}

        {/* Today's Shift Logs History */}
        {todayLogs.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Today&apos;s Recorded Shift Logs</span>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
              {todayLogs.map((log) => (
                <div key={log.time_log_id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-emerald-700">In: {formatTimestamp(log.time_in)}</span>
                      <span className="text-slate-400">→</span>
                      <span className={log.time_out ? 'text-rose-700' : 'text-amber-600 font-semibold'}>
                        {log.time_out ? `Out: ${formatTimestamp(log.time_out)}` : 'On Duty'}
                      </span>
                    </div>
                    {log.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                        {log.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {log.total_hours ? (
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.total_hours} hrs
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
