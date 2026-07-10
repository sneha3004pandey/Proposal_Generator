import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { 
  useGetProposal, 
  useCreateProposal, 
  useUpdateProposal, 
  getGetProposalQueryKey,
  getListProposalsQueryKey
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ChevronRight, CheckCircle2, FileText, ArrowLeft, Eye } from 'lucide-react';
import { 
  DEFAULT_CORPORATE_PROFILE, 
  DEFAULT_ORIENT_STRENGTHS, 
  DEFAULT_PRE_REQUISITES_HTML,
  DEFAULT_COMMERCIAL_NOTES_HTML,
  CONFIDENTIAL_TEXT_TEMPLATE
} from '@/constants';
import { ProposalData } from '@workspace/api-client-react';
import { RichTextEditor } from '@/components/RichTextEditor';

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const STEPS = [
  { id: 1, label: 'Proposal Details', heading: 'Proposal Details' },
  { id: 2, label: 'Document Control', heading: '1. Document Control' },
  { id: 3, label: 'Project Summary', heading: '2. Project Summary' },
  { id: 4, label: 'Scope of Work', heading: '3. Scope of Work' },
  { id: 5, label: 'Pre-Requisites', heading: '4. Pre-Requisites' },
  { id: 6, label: 'Out of Scope', heading: '5. Out of Scope' },
  { id: 7, label: 'Commercials', heading: '6. Commercials' },
  { id: 8, label: 'Corporate Profile', heading: '7. Corporate Profile of Orient' },
  { id: 9, label: 'Orient\'s Strengths', heading: '8. Orient\'s Strengths' },
  { id: 10, label: 'Acceptance', heading: '9. Acceptance and Authorization' },
  { id: 11, label: 'Review', heading: 'Review Proposal' }
];

export default function ProposalForm() {
  const { user } = useAuth();
  const [, params] = useRoute('/proposals/:id/edit');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const id = params?.id ? parseInt(params.id) : null;
  const isNew = !id;

  const { data: existingProposal, isLoading: isLoadingProposal } = useGetProposal(id as number, { 
    query: { enabled: !!id, queryKey: getGetProposalQueryKey(id as number) } 
  });

  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal();

  const [activeStep, setActiveStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const getDefaultData = (): ProposalData => ({
    proposalTitle: '',
    customerName: '',
    documentProperties: [{ action: 'Prepared By', name: user?.fullName || '', date: new Date().toISOString().split('T')[0] }],
    versionHistory: [{ version: '1.0', dateReleased: new Date().toISOString().split('T')[0], changeNotice: 'Submitted', remark: 'New Proposal Submission' }],
    projectSummary: '',
    scopeOfWork: '',
    preRequisites: DEFAULT_PRE_REQUISITES_HTML,
    outOfScope: '',
    commercialRows: [{ description: '', timeline: '', totalCost: '' }],
    commercialNotes: DEFAULT_COMMERCIAL_NOTES_HTML,
    corporateProfile: DEFAULT_CORPORATE_PROFILE,
    orientStrengths: DEFAULT_ORIENT_STRENGTHS,
    orientAcceptance: { name: '', designation: '', signature: '', date: '' },
  });

  const [formData, setFormData] = useState<ProposalData>(getDefaultData());
  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (existingProposal && initializedForId.current !== existingProposal.id) {
      initializedForId.current = existingProposal.id;
      // Merge with defaults so proposals saved before newer fields (e.g.
      // preRequisites, commercialNotes) existed still load correctly.
      setFormData({ ...getDefaultData(), ...existingProposal.data });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProposal]);

  const handleSave = async (showToast = true) => {
    setSaveStatus('saving');
    try {
      if (isNew) {
        const res = await createMutation.mutateAsync({ 
          data: { businessUnit: 'DT', data: formData } 
        });
        queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
        setSaveStatus('saved');
        setLocation(`/proposals/${res.id}/edit`, { replace: true });
      } else {
        await updateMutation.mutateAsync({ 
          id: id as number, 
          data: { businessUnit: 'DT', data: formData } 
        });
        queryClient.setQueryData(getGetProposalQueryKey(id as number), (old: any) => 
          old ? { ...old, data: formData } : old
        );
        setSaveStatus('saved');
      }
      if (showToast) {
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const changeStep = async (step: number) => {
    if (step === activeStep) return;
    if (saveStatus !== 'saving') {
      await handleSave(false);
    }
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = (field: keyof ProposalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isNew && isLoadingProposal) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="proposalTitle">Proposal Title</Label>
              <Input 
                id="proposalTitle" 
                value={formData.proposalTitle} 
                onChange={e => updateField('proposalTitle', e.target.value)} 
                placeholder="e.g. Intranet Portal Revamp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input 
                id="customerName" 
                value={formData.customerName} 
                onChange={e => updateField('customerName', e.target.value)} 
                placeholder="e.g. Acme Corp"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">1.1 Document Properties</h3>
              <Table className="border rounded-md">
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.documentProperties.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Input value={row.action} onChange={e => {
                        const newProps = [...formData.documentProperties];
                        newProps[idx].action = e.target.value;
                        updateField('documentProperties', newProps);
                      }} /></TableCell>
                      <TableCell><Input value={row.name} onChange={e => {
                        const newProps = [...formData.documentProperties];
                        newProps[idx].name = e.target.value;
                        updateField('documentProperties', newProps);
                      }} /></TableCell>
                      <TableCell><Input type="date" value={row.date} onChange={e => {
                        const newProps = [...formData.documentProperties];
                        newProps[idx].date = e.target.value;
                        updateField('documentProperties', newProps);
                      }} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => {
                          updateField('documentProperties', formData.documentProperties.filter((_, i) => i !== idx));
                        }}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" onClick={() => {
                updateField('documentProperties', [...formData.documentProperties, { action: '', name: '', date: new Date().toISOString().split('T')[0] }]);
              }}>+ Add Row</Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">1.2 Document Version History</h3>
              <Table className="border rounded-md">
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Date Released</TableHead>
                    <TableHead>Change Notice</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.versionHistory.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Input value={row.version} onChange={e => {
                        const newHist = [...formData.versionHistory];
                        newHist[idx].version = e.target.value;
                        updateField('versionHistory', newHist);
                      }} /></TableCell>
                      <TableCell><Input type="date" value={row.dateReleased} onChange={e => {
                        const newHist = [...formData.versionHistory];
                        newHist[idx].dateReleased = e.target.value;
                        updateField('versionHistory', newHist);
                      }} /></TableCell>
                      <TableCell>
                        <Select value={row.changeNotice} onValueChange={val => {
                          const newHist = [...formData.versionHistory];
                          newHist[idx].changeNotice = val;
                          updateField('versionHistory', newHist);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Pending Review">Pending Review</SelectItem>
                            <SelectItem value="Revised">Revised</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={row.remark} onValueChange={val => {
                          const newHist = [...formData.versionHistory];
                          newHist[idx].remark = val;
                          updateField('versionHistory', newHist);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New Proposal Submission">New Proposal Submission</SelectItem>
                            <SelectItem value="Revised Proposal Submission">Revised Proposal Submission</SelectItem>
                            <SelectItem value="Commercial Revision">Commercial Revision</SelectItem>
                            <SelectItem value="Scope Revision">Scope Revision</SelectItem>
                            <SelectItem value="Final Submission">Final Submission</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => {
                          updateField('versionHistory', formData.versionHistory.filter((_, i) => i !== idx));
                        }}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" onClick={() => {
                updateField('versionHistory', [...formData.versionHistory, { version: '', dateReleased: new Date().toISOString().split('T')[0], changeNotice: 'Submitted', remark: 'New Proposal Submission' }]);
              }}>+ Add Row</Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">1.3 Confidential</h3>
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-md text-sm leading-relaxed">
                {CONFIDENTIAL_TEXT_TEMPLATE.replace('{CUSTOMER_NAME}', formData.customerName || '[Customer Name]')}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 max-w-4xl">
            <p className="text-sm text-gray-500">Provide a high-level summary of the project, objectives, and expected outcomes.</p>
            <RichTextEditor
              value={formData.projectSummary}
              onChange={html => updateField('projectSummary', html)}
              placeholder="Enter project summary..."
              minHeight="300px"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 max-w-4xl">
            <p className="text-sm text-gray-500">Detail the specific deliverables and scope boundaries for this engagement.</p>
            <RichTextEditor
              value={formData.scopeOfWork}
              onChange={html => updateField('scopeOfWork', html)}
              placeholder="Enter scope of work..."
              minHeight="400px"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 max-w-4xl">
            <p className="text-sm text-gray-500">The following pre-requisites are standard and pre-filled, but you can edit them for this proposal.</p>
            <RichTextEditor
              value={formData.preRequisites}
              onChange={html => updateField('preRequisites', html)}
              placeholder="Enter pre-requisites..."
              minHeight="300px"
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4 max-w-4xl">
            <p className="text-sm text-gray-500">List items explicitly excluded from the scope of work.</p>
            <RichTextEditor
              value={formData.outOfScope}
              onChange={html => updateField('outOfScope', html)}
              placeholder="Enter out of scope items..."
              minHeight="300px"
            />
          </div>
        );
      case 7: {
        const total = formData.commercialRows.reduce((sum, row) => {
          const numeric = parseFloat((row.totalCost || '').replace(/[^0-9.-]/g, ''));
          return sum + (isNaN(numeric) ? 0 : numeric);
        }, 0);
        return (
          <div className="space-y-6">
            <Table className="border rounded-md">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Description</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Total Cost (In INR)</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.commercialRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Input value={row.description} onChange={e => {
                      const newRows = [...formData.commercialRows];
                      newRows[idx].description = e.target.value;
                      updateField('commercialRows', newRows);
                    }} placeholder="e.g. Implementation Phase" /></TableCell>
                    <TableCell><Input value={row.timeline} onChange={e => {
                      const newRows = [...formData.commercialRows];
                      newRows[idx].timeline = e.target.value;
                      updateField('commercialRows', newRows);
                    }} placeholder="e.g. 4 Weeks" /></TableCell>
                    <TableCell><Input value={row.totalCost} onChange={e => {
                      const newRows = [...formData.commercialRows];
                      newRows[idx].totalCost = e.target.value;
                      updateField('commercialRows', newRows);
                    }} placeholder="e.g. 5,00,000" /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => {
                        updateField('commercialRows', formData.commercialRows.filter((_, i) => i !== idx));
                      }}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={2} className="text-right">Total</TableCell>
                  <TableCell data-testid="text-commercial-total">{total.toLocaleString('en-IN')}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" onClick={() => {
              updateField('commercialRows', [...formData.commercialRows, { description: '', timeline: '', totalCost: '' }]);
            }}>+ Add Commercial Row</Button>

            <div className="mt-8 space-y-2">
              <h4 className="font-semibold text-gray-900">Standard Commercial Notes</h4>
              <p className="text-sm text-gray-500">These notes are standard and pre-filled, but you can edit them for this proposal.</p>
              <RichTextEditor
                value={formData.commercialNotes}
                onChange={html => updateField('commercialNotes', html)}
                minHeight="200px"
              />
            </div>
          </div>
        );
      }
      case 8:
        return (
          <div className="space-y-4 max-w-4xl">
            <p className="text-sm text-gray-500">Standard corporate profile (fixed, not editable).</p>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-md whitespace-pre-wrap font-sans text-sm text-gray-800">
              {DEFAULT_CORPORATE_PROFILE}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-4 max-w-4xl">
            <p className="text-sm text-gray-500">Standard strengths profile (fixed, not editable).</p>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-md whitespace-pre-wrap font-sans text-sm text-gray-800">
              {DEFAULT_ORIENT_STRENGTHS}
            </div>
          </div>
        );
      case 10:
        return (
          <div className="max-w-md">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Orient Technologies Ltd</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.orientAcceptance.name} onChange={e => updateField('orientAcceptance', { ...formData.orientAcceptance, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input value={formData.orientAcceptance.designation} onChange={e => updateField('orientAcceptance', { ...formData.orientAcceptance, designation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Signature</Label>
                  <Input value={formData.orientAcceptance.signature} onChange={e => updateField('orientAcceptance', { ...formData.orientAcceptance, signature: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.orientAcceptance.date} onChange={e => updateField('orientAcceptance', { ...formData.orientAcceptance, date: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        );
      case 11:
        return (
          <div className="space-y-8 max-w-4xl pb-16">
            <div className="flex justify-between items-center bg-gray-50 p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Review Complete</h3>
                <p className="text-sm text-gray-500">Ensure all sections are filled correctly before previewing or downloading.</p>
              </div>
              <div className="space-x-3">
                <Button variant="outline" onClick={() => changeStep(1)}>Edit Content</Button>
                {id && (
                  <Button onClick={() => setLocation(`/proposals/${id}/preview`)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview & Download
                  </Button>
                )}
              </div>
            </div>

            {/* Read-only quick review of critical fields */}
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Proposal Title</h4>
                  <p className="font-semibold text-gray-900">{formData.proposalTitle || <span className="text-red-500">Missing</span>}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Customer Name</h4>
                  <p className="font-semibold text-gray-900">{formData.customerName || <span className="text-red-500">Missing</span>}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Commercial Rows</h4>
                  <p className="font-semibold text-gray-900">{formData.commercialRows.length} item(s)</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Project Summary</h4>
                  {stripHtml(formData.projectSummary) ? (
                    <p className="text-gray-900 line-clamp-2">{stripHtml(formData.projectSummary)}</p>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Scope of Work</h4>
                  {stripHtml(formData.scopeOfWork) ? (
                    <p className="text-gray-900 line-clamp-2">{stripHtml(formData.scopeOfWork)}</p>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 mb-2">Notice: Pre-requisites and Standard Commercial Notes will be appended automatically.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200">
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900" onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => changeStep(step.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between group
                  ${activeStep === step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span>{step.id}. {step.label}</span>
                {activeStep === step.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{STEPS.find(s => s.id === activeStep)?.heading}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {formData.proposalTitle ? `${formData.proposalTitle} - ` : ''}
                {formData.customerName || 'Draft Proposal'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {saveStatus === 'saving' && <span className="text-sm text-gray-500 flex items-center"><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</span>}
              {saveStatus === 'saved' && <span className="text-sm text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Saved</span>}
              {saveStatus === 'error' && <span className="text-sm text-red-600">Error saving</span>}
              <Button onClick={() => handleSave(true)} disabled={saveStatus === 'saving'}>
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>
              {activeStep < 11 && (
                <Button variant="secondary" onClick={() => changeStep(activeStep + 1)}>
                  Next Section
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-full">
              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
