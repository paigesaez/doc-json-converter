import React, { useState, useEffect, useMemo } from 'react';
import { Send, Trash2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import type { Conversion, SubmitPayload, SubmitResponse } from './types';
import { extractMainTopic, extractSubTopics, extractEdgeCases } from './parser';
import { prettyJson, sha256, nowIso } from './utils';

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://webhook.site/your-webhook-url';

export default function App() {
  const [sourceDoc, setSourceDoc] = useState('');
  const [mainTopic, setMainTopic] = useState('');
  const [subTopics, setSubTopics] = useState('');
  const [edgeCases, setEdgeCases] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (sourceDoc) {
      const extractedMain = extractMainTopic(sourceDoc);
      const extractedSub = extractSubTopics(sourceDoc);
      const extractedEdge = extractEdgeCases(sourceDoc);
      
      setMainTopic(extractedMain);
      setSubTopics(extractedSub.join('\n'));
      setEdgeCases(extractedEdge.join('\n'));
    }
  }, [sourceDoc]);

  const conversion = useMemo<Conversion>(() => {
    return {
      main_topic: mainTopic.trim(),
      sub_topics: subTopics
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean),
      edge_cases: edgeCases
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean),
    };
  }, [mainTopic, subTopics, edgeCases]);

  const isValid = useMemo(() => {
    return conversion.main_topic.length > 0 && conversion.sub_topics.length > 0;
  }, [conversion]);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const payload: SubmitPayload = {
        json: conversion,
        meta: {
          source_hash: await sha256(sourceDoc),
          submitted_at: nowIso(),
          app_version: 'doc-json-ui@0.1.0',
        },
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data: SubmitResponse = await response.json().catch(() => ({}));
        setSheetUrl(data.sheet_url || null);
        setSubmitStatus('success');
      } else {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setSourceDoc('');
    setMainTopic('');
    setSubTopics('');
    setEdgeCases('');
    setSubmitStatus('idle');
    setSheetUrl(null);
    setErrorMessage('');
  };

  const handleReset = () => {
    handleClear();
  };

  if (submitStatus === 'success') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-green-900">Submitted</h2>
          <p className="text-gray-700">
            Your sheet is being generated. This usually takes a couple of minutes.
            Check Google Sheets for <strong>{conversion.main_topic} – Labeled Template</strong>.
          </p>
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open in Google Sheets
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={handleReset}
            className="block mx-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Doc → JSON → Submit</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Document
          </label>
          <textarea
            value={sourceDoc}
            onChange={(e) => setSourceDoc(e.target.value)}
            placeholder="Paste source doc here..."
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Topic
          </label>
          <input
            type="text"
            value={mainTopic}
            onChange={(e) => setMainTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Sub-Topics
            </label>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {conversion.sub_topics.length} items
            </span>
          </div>
          <textarea
            value={subTopics}
            onChange={(e) => setSubTopics(e.target.value)}
            placeholder="One item per line"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Edge Cases
            </label>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {conversion.edge_cases.length} items
            </span>
          </div>
          <textarea
            value={edgeCases}
            onChange={(e) => setEdgeCases(e.target.value)}
            placeholder="One item per line"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              JSON Preview
            </label>
            <span className={`text-xs px-2 py-1 rounded ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isValid ? 'Valid' : 'Invalid: ' + (!conversion.main_topic ? 'main_topic required' : 'sub_topics required')}
            </span>
          </div>
          <pre className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto text-sm">
            {prettyJson(conversion)}
          </pre>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Review and confirm. When you click Submit, we'll send this JSON to our system to generate 
            a Google Sheet for labeling. This usually takes a couple of minutes. Check Google Sheets 
            for a new document titled <strong>{conversion.main_topic || '<main_topic>'} – Labeled Template</strong>.
          </p>
        </div>

        {submitStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Submission failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}