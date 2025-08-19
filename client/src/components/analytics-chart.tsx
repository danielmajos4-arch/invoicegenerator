import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Invoice } from '@shared/schema';
import { format, subMonths, startOfMonth } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsChartProps {
  invoices: Invoice[];
}

export function AnalyticsChart({ invoices }: AnalyticsChartProps) {
  // Generate last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      date: startOfMonth(date),
      label: format(date, 'MMM yyyy'),
    };
  });

  const chartData = months.map(month => {
    const monthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return (
        invoiceDate >= month.date &&
        invoiceDate < new Date(month.date.getFullYear(), month.date.getMonth() + 1, 1)
      );
    });

    const paid = monthInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    const pending = monthInvoices
      .filter(inv => inv.status === 'SENT')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    return {
      month: month.label,
      paid,
      pending,
    };
  });

  const data = {
    labels: chartData.map(d => d.month),
    datasets: [
      {
        label: 'Paid',
        data: chartData.map(d => d.paid),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Pending',
        data: chartData.map(d => d.pending),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Revenue Analytics',
        font: {
          size: 16,
          weight: '600',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}