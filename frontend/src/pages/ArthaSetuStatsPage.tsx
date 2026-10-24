import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Receipt,
  Lightbulb,
  BarChart2,
  PieChart,
  ShieldAlert,
  ListTodo,
  Target,
  PiggyBank,
  Calculator,
  Gift,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Mic,
  Plus,
  Sparkles,
  TrendingUp,
  CreditCard,
  Fuel,
  Smartphone,
  Wrench,
  Utensils,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Download,
  Share2,
  HelpCircle,
  AlertCircle,
  Building
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';

// --- Sample Data matching live ArthaSetu app ---
const monthlyCashflowData = [
  { month: 'Jun', income: 42000, expenses: 24000, savings: 18000 },
  { month: 'Jul', income: 48500, expenses: 26500, savings: 22000 },
  { month: 'Aug', income: 51200, expenses: 28000, savings: 23200 },
  { month: 'Sep', income: 49800, expenses: 25400, savings: 24400 },
  { month: 'Oct', income: 54600, expenses: 27100, savings: 27500 },
];

const dailyCashflowData = [
  { day: 'Oct 17', income: 1100, expenses: 280 },
  { day: 'Oct 18', income: 950, expenses: 140 },
  { day: 'Oct 19', income: 1350, expenses: 320 },
  { day: 'Oct 20', income: 820, expenses: 190 },
  { day: 'Oct 21', income: 1400, expenses: 220 },
  { day: 'Oct 22', income: 1650, expenses: 350 },
  { day: 'Oct 23', income: 1150, expenses: 180 },
];

const expenseBreakdownData = [
  { name: 'Phone & Recharge', value: 37.8, amount: 498, color: '#2563EB', icon: Smartphone },
  { name: 'Bike Maintenance', value: 34.1, amount: 450, color: '#059669', icon: Wrench },
  { name: 'Fuel & Petrol', value: 19.0, amount: 251, color: '#F59E0B', icon: Fuel },
  { name: 'Food & Refreshment', value: 9.1, amount: 120, color: '#DC2626', icon: Utensils },
];

const incomeVelocityData = [
  { day: '1', velocity: 62, target: 50 },
  { day: '5', velocity: 68, target: 50 },
  { day: '10', velocity: 74, target: 50 },
  { day: '15', velocity: 71, target: 50 },
  { day: '20', velocity: 82, target: 50 },
  { day: '25', velocity: 89, target: 50 },
  { day: '30', velocity: 85, target: 50 },
];

const recentTransactions = [
  { id: 'TX-9021', date: 'Today, 2:40 PM', platform: 'Swiggy', category: 'Delivery Payout', type: 'credit', amount: 420, status: 'Settled' },
  { id: 'TX-9020', date: 'Today, 11:15 AM', platform: 'Zomato', category: 'Rush Hour Bonus', type: 'credit', amount: 310, status: 'Settled' },
  { id: 'TX-9019', date: 'Yesterday', platform: 'HPCL Station', category: 'Fuel Expense', type: 'debit', amount: 250, status: 'Logged' },
  { id: 'TX-9018', date: '21 Oct 2026', platform: 'Uber Moto', category: 'Trip Fares', type: 'credit', amount: 840, status: 'Settled' },
  { id: 'TX-9017', date: '20 Oct 2026', platform: 'Jio Prepaid', category: 'Phone Recharge', type: 'debit', amount: 299, status: 'Logged' },
];

export const ArthaSetuStatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('stats');
  const [dateRange, setDateRange] = useState<string>('Sep 23 - Oct 23');
  const [frequency, setFrequency] = useState<string>('Daily');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isFabModalOpen, setIsFabModalOpen] = useState<boolean>(false);
  const [quickInput, setQuickInput] = useState<string>('');

  const sidebarLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'tips', label: 'Tips & Insights', icon: Lightbulb },
    { id: 'stats', label: 'Stats', icon: BarChart2, badge: 'Live' },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
    { id: 'action-plan', label: 'Action Plan', icon: ListTodo },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'tax', label: 'Tax Estimator', icon: Calculator },
    { id: 'benefits', label: 'Govt Benefits', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#1F2937] font-sans overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      {/* --- SIDEBAR COMPONENT (255.2px width, tokens aligned) --- */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[255px] bg-[#FFFFFF] border-r border-[#E1E7EF] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="ArthaSetu Navigation Sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#E1E7EF] flex items-center justify-between">
            <button
              onClick={() => setActiveTab('stats')}
              className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-85 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] rounded-lg"
              aria-label="ArthaSetu Home"
            >
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1 shrink-0 shadow-sm border border-slate-800 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="block text-[15px] font-bold tracking-tight text-[#0F172A]">
                  ArthaSetu
                </span>
                <span className="block text-[11px] text-[#65758B] -mt-0.5 font-medium">
                  Financial Companion
                </span>
              </div>
            </button>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
              aria-label="Close sidebar navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            <div className="px-2.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Main Menu
            </div>
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[4px] text-xs font-medium transition-all group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'text-[#65758B] hover:text-[#0F172A] hover:bg-slate-100/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F172A]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Platform Switcher Footer */}
          <div className="p-3 border-t border-[#E1E7EF] bg-slate-50/70">
            <div className="flex items-center justify-between text-[11px] text-[#65758B] mb-2 font-medium">
              <span>ACTIVE DISASTER EOC</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LINKED
              </span>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:text-black bg-white hover:bg-slate-100 border border-[#E1E7EF] rounded-lg shadow-xs transition"
              title="Return to Greenfield City Evacuation Simulation"
            >
              <span>Back to SurakshaSathi Platform</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* --- MAIN APPLICATION CANVAS --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header Bar */}
        <header className="h-16 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-semibold tracking-tight text-[#0F172A]">
                  Stats
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                  Real-Time Verified
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] hidden sm:block">
                Interactive financial intelligence, cash flow velocity & expense analytics
              </p>
            </div>
          </div>

          {/* Right Header Filters & User Profile Pill */}
          <div className="flex items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-medium text-slate-700 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Frequency Selector Button */}
            <button
              onClick={() => setFrequency(frequency === 'Daily' ? 'Weekly' : 'Daily')}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition"
              aria-label="Toggle Frequency"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>{frequency} View</span>
            </button>

            {/* User Profile Pill with Gradient Avatar */}
            <button
              className="flex items-center gap-2.5 h-auto px-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label="User Profile Rahul Sharma"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-600 flex items-center justify-center text-white font-semibold text-[13px] border border-slate-200 shadow-xs shrink-0">
                RS
              </div>
              <div className="text-left hidden md:block pr-1">
                <span className="block text-[13px] font-medium text-[#0F172A] leading-tight">
                  Rahul Sharma
                </span>
                <span className="block text-[11px] text-[#64748B] leading-tight">
                  Gig Partner • 3 Platforms
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          {/* Financial Health Intelligence Banner */}
          <section className="bg-white border border-[#E1E7EF] rounded-2xl p-4 lg:p-5 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bharat Gig Worker Financial Health Index: 88/100 (Optimal)</span>
                </div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Cashflow Velocity is up +18.4% this cycle
                </h2>
                <p className="text-[13px] text-[#64748B] max-w-3xl leading-relaxed">
                  Your disposable buffer has exceeded the recommended 25% emergency threshold. Based on your active delivery schedule across Swiggy and Zomato, we project an end-of-month liquidity reserve of ₹27,500.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsFabModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-black hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Simulate Tax Buffer</span>
                </button>
                <button
                  onClick={() => alert("Detailed Financial Report downloaded in PDF.")}
                  className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                  title="Export Statement"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* --- 4-COLUMN TOP METRIC CARDS (Tokens: gap-3.5, font-30px, rounded-2xl) --- */}
          <section aria-label="Key Performance Indicators">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Metric 1: Total Income */}
              <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-medium text-[#64748B] mb-1.5">
                  <span>Total Income</span>
                  <span className="flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    +12.5%
                  </span>
                </div>
                <div className="text-[30px] font-bold tracking-tight text-[#0F172A] leading-tight">
                  ₹6,600
                </div>
                <div className="mt-2 text-[11px] text-[#94A3B8] flex items-center gap-1">
                  <span>Inflow across Swiggy, Zomato, Uber</span>
                </div>
              </div>

              {/* Metric 2: Total Expenses */}
              <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-medium text-[#64748B] mb-1.5">
                  <span>Total Expenses</span>
                  <span className="flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    -4.2%
                  </span>
                </div>
                <div className="text-[30px] font-bold tracking-tight text-[#0F172A] leading-tight">
                  ₹1,319
                </div>
                <div className="mt-2 text-[11px] text-[#94A3B8]">
                  <span>Outflow & living costs (Fuel, Phone, Maintenance)</span>
                </div>
              </div>

              {/* Metric 3: Net Savings */}
              <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-medium text-[#64748B] mb-1.5">
                  <span>Net Savings</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Buffer Healthy
                  </span>
                </div>
                <div className="text-[30px] font-bold tracking-tight text-[#059669] leading-tight">
                  ₹5,281
                </div>
                <div className="mt-2 text-[11px] text-[#94A3B8]">
                  <span>Disposable surplus allocated to savings buffer</span>
                </div>
              </div>

              {/* Metric 4: Savings Rate */}
              <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-medium text-[#64748B] mb-1.5">
                  <span>Savings Rate</span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Target &gt; 25%
                  </span>
                </div>
                <div className="text-[30px] font-bold tracking-tight text-[#0F172A] leading-tight">
                  80%
                </div>
                <div className="mt-2 text-[11px] text-[#94A3B8]">
                  <span>Top 5% financial discipline among delivery riders</span>
                </div>
              </div>
            </div>
          </section>

          {/* --- CHARTS ROW 1: Monthly Cashflow & Expense Breakdown --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Monthly Cash Flow (2 Columns) */}
            <div className="lg:col-span-2 bg-white border border-[#E1E7EF] rounded-2xl p-4 lg:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">
                    Monthly Cash Flow Velocity
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Comparison of gross income, operating costs, and net buffer accumulation
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-900"></span> Income
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span> Outflow
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> Net Buffer
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7EF" />
                    <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val.toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="income" fill="#0F172A" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
                    <Bar dataKey="savings" fill="#10B981" radius={[4, 4, 0, 0]} name="Savings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Expense Breakdown Donut (1 Column) */}
            <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 lg:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">
                    Expense Breakdown
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Oct 2026
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mb-3">
                  Categorized operational costs and deductions
                </p>

                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={expenseBreakdownData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseBreakdownData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, 'Share']}
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  {/* Center Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Outflow</span>
                    <span className="text-sm font-bold text-slate-900">₹1,319</span>
                  </div>
                </div>
              </div>

              {/* Categorical Legend list */}
              <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-2">
                {expenseBreakdownData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500">₹{item.amount}</span>
                      <span className="font-semibold text-slate-900 w-10 text-right">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- CHARTS ROW 2: Daily Cash Flow & Income Velocity Trend --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Cash Flow (7-day comparative) */}
            <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 lg:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">
                    Daily Earning Run-Rate (Last 7 Days)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Peak shifts vs fuel consumption across daily delivery windows
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Oct 17 - Oct 23
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7EF" />
                    <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, '']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="income" fill="#2563EB" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income Velocity Trend Curve */}
            <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 lg:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">
                    Income Velocity Index
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Real-time earning momentum score against personal benchmark target
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> 85 / 100
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeVelocityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7EF" />
                    <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickFormatter={(d) => `Day ${d}`} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} domain={[40, 100]} />
                    <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Target Base', fill: '#EF4444', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="velocity" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#velocityGradient)" name="Velocity Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* --- DATA-DENSE TRANSACTION INTELLIGENCE TABLE --- */}
          <section className="bg-white border border-[#E1E7EF] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E1E7EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">
                  Recent Multi-Platform Transactions
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Automated payout parsing and operational expense audit trail
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Opening full transaction ledger...")}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E1E7EF] hover:bg-slate-50 text-slate-700 transition"
                >
                  View All (42)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[#64748B] font-semibold border-b border-[#E1E7EF]">
                  <tr>
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Platform / Source</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7EF]">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{tx.id}</td>
                      <td className="py-3 px-4 text-slate-600">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {tx.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{tx.category}</td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          tx.status === 'Settled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* --- FLOATING ACTION BUTTON (FAB) COMPONENT (Tokens: w-16 h-16, fixed bottom-6 right-6, shadow-xl) --- */}
      <button
        onClick={() => setIsFabModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-slate-900/10 backdrop-blur-xs transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 shadow-xl cursor-pointer"
        aria-label="Open ArthaSetu AI Financial Assistant"
      >
        <div className="w-12 h-12 rounded-full bg-black group-hover:bg-slate-950 flex items-center justify-center shadow-lg transition-colors p-1.5 border border-slate-700/50">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
      </button>

      {/* --- QUICK AI DISASTER INTELLIGENCE MODAL (Suraksha EOC) --- */}
      {isFabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsFabModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Close Assistant Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Suraksha Disaster Operations AI</h3>
                <p className="text-xs text-slate-500">Incident Command & Evacuation Intelligence for Greenfield City</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active EOC Recommendation:</span>
              </div>
              <p>
                Old Town Commercial Way (R-8) is experiencing 3.84x capacity stress. Deploy dynamic route diversion to Highway 101 and rebalance eastern zone evacuees to East Regional Sports Complex.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="quick-query" className="text-xs font-semibold text-slate-700">
                Inquire on routes, shelters, or NDMA guidelines:
              </label>
              <div className="flex gap-2">
                <input
                  id="quick-query"
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="e.g. Which shelters have open beds? or What is the flood clearance time?"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickInput.trim()) {
                      alert(`EOC Query Recorded: "${quickInput}". Consult the Suraksha floating assistant for full conversational drill analytics.`);
                      setQuickInput('');
                      setIsFabModalOpen(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (quickInput.trim()) {
                      alert(`EOC Query Recorded: "${quickInput}". Consult the Suraksha floating assistant for full conversational drill analytics.`);
                      setQuickInput('');
                      setIsFabModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  alert("Emergency voice transcription: 'Checking bottleneck mitigation corridors and shelter quotas.'");
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
              >
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>Voice Command (EOC)</span>
              </button>
              <button
                onClick={() => {
                  alert("Shelter Status: East Regional Sports Complex has 181 surplus beds available. North High School is 100% full.");
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
              >
                <Building className="w-3.5 h-3.5 text-blue-500" />
                <span>Shelter Surplus Check</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
