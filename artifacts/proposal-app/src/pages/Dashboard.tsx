import { useListProposals, useDeleteProposal, getListProposalsQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Trash2, Edit, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: proposals = [], isLoading } = useListProposals();
  const deleteMutation = useDeleteProposal();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
        }
      });
    }
  };

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
                DT — Digital Transformation
              </CardTitle>
              <CardDescription>
                Create standardized Digital Transformation business proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/proposals/new" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Link>
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
                      <Link href={`/proposals/${proposal.id}/preview`} className="inline-flex p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/proposals/${proposal.id}/edit`} className="inline-flex p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(proposal.id)}
                        className="inline-flex p-2 text-gray-500 hover:text-destructive rounded-md hover:bg-red-50"
                        disabled={deleteMutation.isPending}
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
