import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  Search,
  Filter,
  MoreHorizontal,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceTableNewProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isLoading?: boolean;
}

type StatusFilter = "ALL" | "DRAFT" | "SENT" | "PAID";
type SortField = "createdAt" | "total" | "clientName";
type SortOrder = "asc" | "desc";

const statusConfig = {
  DRAFT: { 
    variant: "secondary" as const, 
    className: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100", 
    label: "Draft"
  },
  SENT: { 
    variant: "warning" as const, 
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100", 
    label: "Sent"
  },
  PAID: { 
    variant: "success" as const, 
    className: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100", 
    label: "Paid"
  },
};

export function InvoiceTableNew({ invoices, onDelete, onDuplicate, isLoading = false }: InvoiceTableNewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "total":
          comparison = parseFloat(a.total) - parseFloat(b.total);
          break;
        case "clientName":
          comparison = a.clientName.localeCompare(b.clientName);
          break;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header with filters */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 min-h-[44px]"
                  data-testid="invoice-search"
                />
              </div>
              
              {/* Status filter */}
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-32 min-h-[44px]" data-testid="status-filter">
                  <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Headers */}
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50">
              <div className="col-span-2 text-sm font-medium text-muted-foreground">Invoice #</div>
              <div className="col-span-3 text-sm font-medium text-muted-foreground">Client</div>
              <div className="col-span-2 text-sm font-medium text-muted-foreground">Amount</div>
              <div className="col-span-2 text-sm font-medium text-muted-foreground">Status</div>
              <div className="col-span-2 text-sm font-medium text-muted-foreground">Date</div>
              <div className="col-span-1 text-sm font-medium text-muted-foreground">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {filteredInvoices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                  <p className="text-sm">
                    {searchQuery || statusFilter !== "ALL" 
                      ? "Try adjusting your search or filters."
                      : "Create your first invoice to get started."
                    }
                  </p>
                </div>
              ) : (
                filteredInvoices.map((invoice) => {
                  const config = statusConfig[invoice.status];
                  return (
                    <div key={invoice.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors">
                      {/* Mobile layout */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-sm font-medium text-foreground">
                              #{invoice.id.slice(0, 8)}
                            </span>
                            <div className="text-sm text-muted-foreground mt-1">
                              {invoice.clientName}
                            </div>
                          </div>
                          <Badge className={config.className}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-foreground">
                            ${parseFloat(invoice.total).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Link href={`/invoice/${invoice.id}`}>
                              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] touch-manipulation" data-testid={`view-invoice-${invoice.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] touch-manipulation" data-testid={`invoice-menu-${invoice.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/edit/${invoice.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDuplicate(invoice.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => onDelete(invoice.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden sm:contents">
                        <div className="col-span-2 flex items-center">
                          <span className="font-mono text-sm font-medium text-foreground" data-testid={`invoice-id-${invoice.id}`}>
                            #{invoice.id.slice(0, 8)}
                          </span>
                        </div>
                        <div className="col-span-3 flex items-center">
                          <div>
                            <div className="text-sm font-medium text-foreground" data-testid={`client-name-${invoice.id}`}>
                              {invoice.clientName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {invoice.clientEmail}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className="text-sm font-semibold text-foreground" data-testid={`amount-${invoice.id}`}>
                            ${parseFloat(invoice.total).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Badge className={config.className} data-testid={`status-${invoice.id}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className="text-sm text-muted-foreground" data-testid={`date-${invoice.id}`}>
                            {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <div className="flex items-center gap-1">
                            <Link href={`/invoice/${invoice.id}`}>
                              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] touch-manipulation" data-testid={`view-invoice-${invoice.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] touch-manipulation" data-testid={`invoice-menu-${invoice.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/edit/${invoice.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDuplicate(invoice.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => onDelete(invoice.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}