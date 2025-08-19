import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@shared/schema";
import { Link } from "wouter";

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
}

const statusConfig = {
  DRAFT: { 
    variant: "outline" as const, 
    className: "border-slate-500 text-slate-500", 
    icon: "fas fa-edit" 
  },
  SENT: { 
    variant: "secondary" as const, 
    className: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: "fas fa-clock" 
  },
  PAID: { 
    variant: "default" as const, 
    className: "bg-green-100 text-green-800 border-green-200", 
    icon: "fas fa-check-circle" 
  },
};

export function InvoiceTable({ invoices, onDelete }: InvoiceTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Invoices</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filter-button">
                  <i className="fas fa-filter mr-2"></i>
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All Statuses</DropdownMenuItem>
                <DropdownMenuItem>Draft</DropdownMenuItem>
                <DropdownMenuItem>Sent</DropdownMenuItem>
                <DropdownMenuItem>Paid</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600 font-medium">Invoice #</TableHead>
                <TableHead className="text-slate-600 font-medium">Client</TableHead>
                <TableHead className="text-slate-600 font-medium">Amount</TableHead>
                <TableHead className="text-slate-600 font-medium">Status</TableHead>
                <TableHead className="text-slate-600 font-medium">Date</TableHead>
                <TableHead className="text-slate-600 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const config = statusConfig[invoice.status];
                return (
                  <TableRow key={invoice.id} className="hover:bg-slate-50">
                    <TableCell>
                      <span 
                        className="font-mono text-sm font-medium"
                        data-testid={`invoice-number-${invoice.id}`}
                      >
                        #{invoice.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div 
                          className="font-medium text-slate-800"
                          data-testid={`client-name-${invoice.id}`}
                        >
                          {invoice.clientName}
                        </div>
                        <div className="text-sm text-slate-500">
                          {invoice.clientEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span 
                        className="font-semibold text-slate-800"
                        data-testid={`amount-${invoice.id}`}
                      >
                        ${invoice.total}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={config.variant}
                        className={config.className}
                        data-testid={`status-${invoice.id}`}
                      >
                        <i className={`${config.icon} text-xs mr-1`}></i>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/invoice/${invoice.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`view-invoice-${invoice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/edit/${invoice.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`edit-invoice-${invoice.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDelete(invoice.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-invoice-${invoice.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
