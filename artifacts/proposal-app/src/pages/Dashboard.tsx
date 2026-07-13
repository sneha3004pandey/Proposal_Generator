import { useListProposals, useDeleteProposal, useDuplicateProposal, getListProposalsQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Plus, Trash2, Edit, Eye, Download, Copy, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Layout } from '@/components/Layout';

const BUSINESS_UNITS = [
  { value: 'cloud-devops', label: 'Cloud & DevOps' },
  { value: 'dt', label: 'Digital Transformation (DT)' },
  { value: 'ims', label: 'Infrastructure Managed Services (IMS)' },
  { value: 'toss', label: 'Toss' },
  { value: 'cyber-security', label: 'Cyber Security' },
  { value: 'data-centre', label: 'Data Centre Solutions' },
  { value: 'euc', label: 'End User Computing' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: proposals = [], isLoading } = useListProposals();
  const deleteMutation = useDeleteProposal();
  const duplicateMutation = useDuplicateProposal();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedBU, setSelectedBU] = useState<string>('');

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
        }
      });
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ id }, {
      onSuccess: (duplicate) => {
        queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
        navigate(`/proposals/${duplicate.id}/edit`);
      },
    });
  };

  const handleDownload = async (id: number, format: 'docx' | 'pdf', customerName: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}/${format}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposal_${customerName || 'Draft'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download ${format}`, err);
    }
  };

  const isDT = selectedBU === 'dt';
  const hasSelection = selectedBU !== '';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.fullName}</h1>
          <p className="text-gray-600 mt-1">Business Proposal Generator</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-md">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                New Proposal
              </CardTitle>
              <CardDescription>
                Select a business unit to create a proposal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedBU} onValueChange={setSelectedBU}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select business unit…" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_UNITS.map((bu) => (
                    <SelectItem key={bu.value} value={bu.value}>
                      {bu.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isDT ? (
                <Link href="/proposals/new" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Link>
              ) : hasSelection ? (
                <div className="w-full flex flex-col items-center gap-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-200">
                  <span className="text-sm font-medium text-gray-400">Template coming soon</span>
                  <span className="text-xs text-gray-400">This business unit is not yet available</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Proposals</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No proposals yet</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new Digital Transformation proposal.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium text-gray-900">{proposal.proposalTitle}</TableCell>
                    <TableCell>{proposal.customerName}</TableCell>
                    <TableCell className="text-gray-500">
                      {format(new Date(proposal.updatedAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/proposals/${proposal.id}/preview`} className="inline-flex p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100" title="Preview">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/proposals/${proposal.id}/edit`} className="inline-flex p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100" title="Open/Edit">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100" title="Download">
                            <Download className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(proposal.id, 'docx', proposal.customerName)}>
                            Download Word (.docx)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(proposal.id, 'pdf', proposal.customerName)}>
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button
                        onClick={() => handleDuplicate(proposal.id)}
                        className="inline-flex p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100"
                        disabled={duplicateMutation.isPending}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(proposal.id)}
                        className="inline-flex p-2 text-gray-500 hover:text-destructive rounded-md hover:bg-red-50"
                        disabled={deleteMutation.isPending}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
}
