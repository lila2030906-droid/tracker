import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, Download, X, Check, DollarSign, 
  TrendingUp, TrendingDown, Calendar, PieChart, BarChart3,
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard, ShoppingBag,
  Home, Car, Utensils, Zap, Phone, Globe, Briefcase, Heart,
  MoreHorizontal, Filter, SortAsc, SortDesc, RefreshCw, Moon, Sun,
  ChevronDown, ChevronUp, AlertCircle, Info, Star
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: Utensils, color: '#f59e0b' },
  { id: 'transport', name: 'Transportation', icon: Car, color: '#3b82f6' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: '#ec4899' },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: '#10b981' },
  { id: 'entertainment', name: 'Entertainment', icon: Globe, color: '#8b5cf6' },
  { id: 'health', name: 'Healthcare', icon: Heart, color: '#ef4444' },
  { id: 'work', name: 'Work & Business', icon: Briefcase, color: '#6366f1' },
  { id: 'housing', name: 'Housing', icon: Home, color: '#06b6d4' },
  { id: 'communication', name: 'Communication', icon: Phone, color: '#f97316' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: '#64748b' }
];

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: DollarSign },
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'wallet', name: 'Digital Wallet', icon: Wallet }
];

const INITIAL_DATA = [
  { id: 1, description: 'Grocery Shopping', amount: 125.50, category: 'food', paymentMethod: 'card', date: new Date().toISOString(), notes: 'Weekly groceries' },
  { id: 2, description: 'Gas Station', amount: 45.00, category: 'transport', paymentMethod: 'card', date: subDays(new Date(), 1).toISOString(), notes: 'Full tank' },
  { id: 3, description: 'Netflix Subscription', amount: 15.99, category: 'entertainment', paymentMethod: 'card', date: subDays(new Date(), 2).toISOString(), notes: 'Monthly subscription' },
  { id: 4, description: 'Electric Bill', amount: 89.50, category: 'utilities', paymentMethod: 'card', date: subDays(new Date(), 3).toISOString(), notes: 'Monthly electricity' },
  { id: 5, description: 'Restaurant Dinner', amount: 67.80, category: 'food', paymentMethod: 'card', date: subDays(new Date(), 4).toISOString(), notes: 'Birthday celebration' },
  { id: 6, description: 'Online Shopping', amount: 234.99, category: 'shopping', paymentMethod: 'card', date: subDays(new Date(), 5).toISOString(), notes: 'New clothes' },
  { id: 7, description: 'Gym Membership', amount: 50.00, category: 'health', paymentMethod: 'card', date: subDays(new Date(), 6).toISOString(), notes: 'Monthly gym' },
  { id: 8, description: 'Coffee Shop', amount: 8.50, category: 'food', paymentMethod: 'cash', date: subDays(new Date(), 7).toISOString(), notes: 'Morning coffee' },
];

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('biztrack_transactions');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    paymentMethod: 'card',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem('biztrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    const now = new Date();
    if (timeFilter === 'today') {
      filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), { start: startOfDay(now), end: endOfDay(now) }));
    } else if (timeFilter === 'week') {
      filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), { start: subDays(now, 7), end: now }));
    } else if (timeFilter === 'month') {
      filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: endOfMonth(now) }));
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'description') {
        comparison = a.description.localeCompare(b.description);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, selectedCategory, timeFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const today = transactions.filter(t => isWithinInterval(parseISO(t.date), { start: startOfDay(new Date()), end: endOfDay(new Date()) })).reduce((sum, t) => sum + t.amount, 0);
    const thisWeek = transactions.filter(t => isWithinInterval(parseISO(t.date), { start: subDays(new Date(), 7), end: new Date() })).reduce((sum, t) => sum + t.amount, 0);
    const thisMonth = transactions.filter(t => isWithinInterval(parseISO(t.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })).reduce((sum, t) => sum + t.amount, 0);
    const average = transactions.length > 0 ? total / transactions.length : 0;
    const byCategory = CATEGORIES.map(cat => ({
      ...cat,
      amount: transactions.filter(t => t.category === cat.id).reduce((sum, t) => sum + t.amount, 0)
    })).filter(c => c.amount > 0);

    return { total, today, thisWeek, thisMonth, average, byCategory, count: transactions.length };
  }, [transactions]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayTotal = transactions
        .filter(t => isWithinInterval(parseISO(t.date), { start: startOfDay(date), end: endOfDay(date) }))
        .reduce((sum, t) => sum + t.amount, 0);
      return { date: format(date, 'MMM dd'), amount: dayTotal };
    });

    return {
      labels: last7Days.map(d => d.date),
      datasets: [{
        label: 'Spending',
        data: last7Days.map(d => d.amount),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [transactions]);

  const categoryChartData = useMemo(() => {
    return {
      labels: stats.byCategory.map(c => c.name),
      datasets: [{
        data: stats.byCategory.map(c => c.amount),
        backgroundColor: stats.byCategory.map(c => c.color),
        borderWidth: 0
      }]
    };
  }, [stats.byCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      date: new Date(formData.date).toISOString(),
      notes: formData.notes
    };

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? transaction : t));
      showToast('Transaction updated successfully!');
    } else {
      setTransactions(prev => [transaction, ...prev]);
      showToast('Transaction added successfully!');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'food',
      paymentMethod: 'card',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingTransaction(null);
    setShowModal(false);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      paymentMethod: transaction.paymentMethod,
      date: format(parseISO(transaction.date), 'yyyy-MM-dd'),
      notes: transaction.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast('Transaction deleted successfully!');
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Description', 'Amount', 'Category', 'Payment Method', 'Date', 'Notes'].join(','),
      ...transactions.map(t => [
        t.id,
        `"${t.description}"`,
        t.amount,
        t.category,
        t.paymentMethod,
        format(parseISO(t.date), 'yyyy-MM-dd'),
        `"${t.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biztrack_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
  };

  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    const Icon = category ? category.icon : MoreHorizontal;
    return <Icon size={18} />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    },
    exit: { opacity: 0, x: -100 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-0 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white font-medium`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-6xl font-bold mb-4 gradient-text"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            BizTrack Pro
          </motion.h1>
          <p className="text-xl text-gray-300">Advanced Expense Tracking with Beautiful Analytics</p>
        </motion.header>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { title: 'Total Spent', value: `$${stats.total.toFixed(2)}`, icon: DollarSign, gradient: 'from-blue-500 to-purple-600', change: '+12%' },
            { title: 'Today', value: `$${stats.today.toFixed(2)}`, icon: Calendar, gradient: 'from-green-500 to-emerald-600', change: stats.today > stats.average ? '+Above Avg' : '-Below Avg' },
            { title: 'This Week', value: `$${stats.thisWeek.toFixed(2)}`, icon: TrendingUp, gradient: 'from-orange-500 to-red-600' },
            { title: 'Transactions', value: stats.count, icon: Briefcase, gradient: 'from-pink-500 to-rose-600' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`glass rounded-2xl p-6 bg-gradient-to-br ${stat.gradient} glow-effect`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-white/80" />
                {stat.change && (
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-300' : 'text-yellow-300'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-2">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{typeof stat.value === 'number' && stat.value < 1000 ? stat.value : stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Spending Trends (Last 7 Days)
            </h3>
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                  }
                }
              }} 
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-pink-400" />
              Category Breakdown
            </h3>
            {stats.byCategory.length > 0 ? (
              <Doughnut 
                data={categoryChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#f1f5f9', padding: 15 }
                    }
                  }
                }} 
              />
            ) : (
              <div className="text-center text-gray-400 py-12">No data available</div>
            )}
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setEditingTransaction(null); resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Transaction
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all ${showFilters ? 'bg-purple-500' : 'bg-slate-800/50'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>

                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="description">Sort by Name</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition-all"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Category</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Payment</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredTransactions.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                      className="border-b border-slate-800 hover:border-purple-500/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <motion.div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${CATEGORIES.find(c => c.id === transaction.category)?.color}20` }}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <span style={{ color: CATEGORIES.find(c => c.id === transaction.category)?.color }}>
                            {getCategoryIcon(transaction.category)}
                          </span>
                        </motion.div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.notes && <p className="text-sm text-gray-400">{transaction.notes}</p>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-sm capitalize">
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-lg font-bold text-green-400">
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(transaction)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-400"
              >
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">No transactions found</p>
                <p className="text-sm mt-2">Try adjusting your filters or add a new transaction</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={resetForm}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="glass rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold gradient-text">
                    {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Description *</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g., Grocery Shopping"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Payment Method</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                      >
                        {PAYMENT_METHODS.map(method => (
                          <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Notes</label>
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional notes"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all transform hover:scale-105"
                    >
                      {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
