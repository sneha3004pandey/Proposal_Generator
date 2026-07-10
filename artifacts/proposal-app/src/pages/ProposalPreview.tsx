import { useRoute, useLocation } from 'wouter';
import { useGetProposal, getGetProposalQueryKey } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { 
  PRE_REQUISITES_TEXT,
  COMMERCIAL_NOTES_TEXT,
  CONFIDENTIAL_TEXT_TEMPLATE
} from '@/constants';
import { format } from 'date-fns';

export default function ProposalPreview() {
  const [, params] = useRoute('/proposals/:id/preview');
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : null;

  const { data: proposal, isLoading } = useGetProposal(id as number, { 
    query: { enabled: !!id, queryKey: getGetProposalQueryKey(id as number) } 
  });

  const handleDownloadDocx = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/proposals/${id}/docx`, { credentials: 'include' });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `Proposal_${proposal?.data.customerName || 'Draft'}.docx`; 
      a.click();
    } catch (err) {
      console.error('Failed to download DOCX', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/proposals/${id}/pdf`, { credentials: 'include' });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `Proposal_${proposal?.data.customerName || 'Draft'}.pdf`; 
      a.click();
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  if (isLoading || !proposal) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const { data } = proposal;
  const confidentialText = CONFIDENTIAL_TEXT_TEMPLATE.replace('{CUSTOMER_NAME}', data.customerName || '[Customer Name]');

  return (
    <Layout>
      <div className="bg-gray-100 min-h-[calc(100vh-3.5rem)]">
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation(`/proposals/${id}/edit`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Edit Proposal
            </Button>
            <div>
              <h2 className="font-semibold text-gray-900">{data.proposalTitle || 'Untitled Proposal'}</h2>
              <p className="text-xs text-gray-500">{data.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleDownloadDocx} className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
              <FileText className="w-4 h-4 mr-2" />
              Download Word
            </Button>
            <Button onClick={handleDownloadPdf}>
              <Download className="w-4 h-4 mr-2" />
              Generate/Download PDF
            </Button>
          </div>
        </div>

        {/* A4 Pages Container */}
        <div className="py-8 px-4 flex flex-col items-center gap-8 font-serif">
          
          {/* Page 1: Title Page */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col justify-center items-center text-center relative">
            <div className="absolute top-16 right-16">
              <div className="w-16 h-16 bg-primary rounded flex items-center justify-center text-white font-bold text-2xl">
                OT
              </div>
            </div>
            <div className="space-y-6 max-w-lg">
              <h1 className="text-4xl font-bold text-primary leading-tight">{data.proposalTitle}</h1>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
              <p className="text-xl text-gray-600">Prepared for</p>
              <h2 className="text-3xl font-semibold text-gray-900">{data.customerName}</h2>
              <div className="pt-24 text-gray-500">
                <p>Orient Technologies Ltd.</p>
                <p>{format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Page 2: Document Control */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2">1. Document Control</h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">1.1 Document Properties</h3>
              <Table className="border font-sans">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Action</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.documentProperties.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.action}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">1.2 Document Version History</h3>
              <Table className="border font-sans">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Version</TableHead>
                    <TableHead>Date Released</TableHead>
                    <TableHead>Change Notice</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.versionHistory.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.version}</TableCell>
                      <TableCell>{row.dateReleased}</TableCell>
                      <TableCell>{row.changeNotice}</TableCell>
                      <TableCell>{row.remark}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 pt-8">
              <h3 className="text-lg font-semibold text-gray-900">1.3 Confidential</h3>
              <p className="bg-blue-50 p-6 border-l-4 border-primary text-gray-800 leading-relaxed italic">
                {confidentialText}
              </p>
            </div>
          </div>

          {/* Page 3: Summary & Scope */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col gap-10">
            <div>
              <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 mb-6">2. Project Summary</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                {data.projectSummary}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 mb-6">3. Scope of Work</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                {data.scopeOfWork}
              </div>
            </div>
          </div>

          {/* Page 4: Pre-reqs, Out of Scope, Commercials */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col gap-10">
            <div>
              <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 mb-6">4. Pre-Requisites</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800 bg-gray-50 p-6 rounded-md">
                {PRE_REQUISITES_TEXT}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 mb-6">5. Out of Scope</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                {data.outOfScope}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 mb-6">6. Commercials</h2>
              <Table className="border font-sans mb-6">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Description</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Total Cost (In INR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commercialRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.description}</TableCell>
                      <TableCell>{row.timeline}</TableCell>
                      <TableCell>{row.totalCost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="bg-gray-50 p-4 border rounded text-sm text-gray-700 whitespace-pre-wrap font-sans">
                <p className="font-semibold mb-2">Notes:</p>
                {COMMERCIAL_NOTES_TEXT}
              </div>
            </div>
          </div>

          {/* Page 5: Corporate Profile */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2">7. Corporate Profile of Orient</h2>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
              {data.corporateProfile}
            </div>
          </div>

          {/* Page 6: Orient's Strengths */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2">8. Orient's Strengths</h2>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
              {data.orientStrengths}
            </div>
          </div>

          {/* Page 7: Acceptance */}
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md p-16 flex flex-col gap-10">
            <h2 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2">9. Acceptance and Authorization</h2>
            
            <p className="text-gray-800 leading-relaxed mb-4">
              This proposal is accepted and authorized by the respective representatives from both parties.
            </p>

            <div className="grid grid-cols-2 gap-16 font-sans">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">For {data.customerName || '[Customer]'}</h3>
                <div className="space-y-4">
                  <div className="flex border-b border-gray-200 pb-1">
                    <span className="w-24 text-gray-500">Name:</span>
                    <span className="font-semibold">{data.customerAcceptance.name}</span>
                  </div>
                  <div className="flex border-b border-gray-200 pb-1">
                    <span className="w-24 text-gray-500">Designation:</span>
                    <span className="font-semibold">{data.customerAcceptance.designation}</span>
                  </div>
                  <div className="flex border-b border-gray-200 pb-1 h-16 items-end">
                    <span className="w-24 text-gray-500 mb-1">Signature:</span>
                    <span className="italic px-2">{data.customerAcceptance.signature}</span>
                  </div>
                  <div className="flex border-b border-gray-200 pb-1">
                    <span className="w-24 text-gray-500">Date:</span>
                    <span className="font-semibold">{data.customerAcceptance.date}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">For Orient Technologies</h3>
                <div className="space-y-4">
                  <div className="flex border-b border-gray-200 pb-1">
                    <span className="w-24 text-gray-500">Name:</span>
                    <span className="font-semibold">{data.orientAcceptance.name}</span>
                  </div>
                  <div className="flex border-b border-gray-200 pb-1">
                    <span className="w-24 text-gray-500">Designation:</span>
                    <span className="font-semibold">{data.orientAcceptance.designation}</span>
                  </div>
                  <div className="flex border-b border-gray-200 pb-1 h-16 items-end">
                    <span className="w-24 text-gray-500 mb-1">Signature:</span>
                    <span className="italic px-2">{data.orientAcceptance.signature}</span>
                  </div>
                  <div className="flex border-b border-gray-200 pb-1">
                    <span className="w-24 text-gray-500">Date:</span>
                    <span className="font-semibold">{data.orientAcceptance.date}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-16 text-center text-sm text-gray-400 border-t border-gray-100">
              <p>Orient Technologies Ltd. • Private & Confidential</p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
