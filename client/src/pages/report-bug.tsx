import { useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function ReportBugPage() {
  const [, navigate] = useLocation();
  const [summary, setSummary] = useState('');
  const [multipleOccurrence, setMultipleOccurrence] = useState(false);
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [comments, setComments] = useState('');
  const [includeLogs, setIncludeLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!summary.trim()) {
      alert('Please provide a summary of the issue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the bug report data
      const bugReport = {
        summary: summary.trim(),
        hasHappenedMoreThanOnce: multipleOccurrence ? 'yes' : 'no',
        stepsToReproduce: stepsToReproduce.trim(),
        expectedResult: expectedResult.trim(),
        actualResult: actualResult.trim(),
        comments: comments.trim(),
        includeLogs,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Send the bug report to local file system
      const response = await fetch('/api/report-bug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bugReport }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Bug report submitted successfully! Thank you for helping improve the app. Your report ID: ' + result.reportId);
        navigate('/settings');
      } else {
        throw new Error('Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      alert('Failed to submit bug report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold text-white">Report a problem</h1>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <p className="text-slate-300 text-sm">
          ---To help us help you, please provide as many details as possible---
        </p>
      </div>

      {/* Bug Report Form */}
      <div className="bg-slate-800 rounded-xl p-6 space-y-6">
        {/* Summary */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Summary:</Label>
          <Textarea
            value={summary}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(e.target.value)}
            placeholder="Brief description of the issue"
            className="bg-slate-700 border-slate-600 text-white min-h-[80px] resize-none"
          />
        </div>

        {/* Multiple Occurrence */}
        <div className="flex items-center justify-between">
          <Label className="text-white font-medium">Has the issue happened more than once:</Label>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-sm">{multipleOccurrence ? 'yes' : 'no'}</span>
            <Switch
              checked={multipleOccurrence}
              onCheckedChange={setMultipleOccurrence}
            />
          </div>
        </div>

        {/* Steps to Reproduce */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Steps to reproduce the issue:</Label>
          <Textarea
            value={stepsToReproduce}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStepsToReproduce(e.target.value)}
            placeholder="1. Go to...\n2. Click on...\n3. See error..."
            className="bg-slate-700 border-slate-600 text-white min-h-[100px] resize-none"
          />
        </div>

        {/* Expected Result */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Expected result:</Label>
          <Textarea
            value={expectedResult}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpectedResult(e.target.value)}
            placeholder="What should have happened?"
            className="bg-slate-700 border-slate-600 text-white min-h-[80px] resize-none"
          />
        </div>

        {/* Actual Result */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Actual result:</Label>
          <Textarea
            value={actualResult}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActualResult(e.target.value)}
            placeholder="What actually happened?"
            className="bg-slate-700 border-slate-600 text-white min-h-[80px] resize-none"
          />
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Comments:</Label>
          <Textarea
            value={comments}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
            placeholder="Any additional information"
            className="bg-slate-700 border-slate-600 text-white min-h-[80px] resize-none"
          />
        </div>

        {/* Include Logs */}
        <div className="flex items-center justify-between">
          <Label className="text-white font-medium">Include logs</Label>
          <Switch
            checked={includeLogs}
            onCheckedChange={setIncludeLogs}
          />
        </div>
      </div>
    </div>
  );
}