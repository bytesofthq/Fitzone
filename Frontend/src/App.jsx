import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Printer, Search, Filter, 
  CheckCircle, Calendar, IndianRupee, Users, 
  Check, LogOut, User, Lock, Phone, ShieldAlert, 
  RefreshCw, AlertTriangle, X, Activity, UserPlus, Info
} from 'lucide-react';
import { api } from './api';
import Logo from './components/Logo';
import logoBytesoft from './assets/logo-bytesoft.png';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [admin, setAdmin] = useState(api.getCurrentAdmin());
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', phone: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Members & Dashboard State
  const [members, setMembers] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals Toggle State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  // Focus Objects
  const [currentMember, setCurrentMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberToExtend, setMemberToExtend] = useState(null);

  // Add/Edit Member Form State
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    plan: 'Strength',
    startDate: '',
    expiryDate: '',
    fees: 600
  });

  // Load Data on Authentication Change
  useEffect(() => {
    if (isAuthenticated) {
      fetchMembers();
      fetchExpiryAlerts();
    }
  }, [isAuthenticated, selectedPlan, selectedStatus]); // Trigger fetch on auth or filter selection

  // Separate trigger for search with a slight debounce or direct trigger
  useEffect(() => {
    if (isAuthenticated) {
      const delayDebounce = setTimeout(() => {
        fetchMembers();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery]);

  // Fetch Member Directory
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await api.getMembers({
        search: searchQuery,
        plan: selectedPlan,
        status: selectedStatus
      });
      setMembers(data);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch members');
      if (err.message?.includes('Not authorized') || err.message?.includes('token failed')) {
        handleLogout();
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch Expiry Alerts (Expiring Today/Tomorrow)
  const fetchExpiryAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const data = await api.checkExpiry();
      setExpiryAlerts(data);
    } catch (err) {
      console.error('Failed to load expiry alerts', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (isRegister) {
        if (!authForm.name || !authForm.phone || !authForm.password) {
          throw new Error('All fields are required');
        }
        await api.register(authForm.name, authForm.phone, authForm.password);
        setAuthSuccess('Admin account registered successfully! You can now Sign In.');
        setIsRegister(false);
        setAuthForm({ name: '', phone: authForm.phone, password: '' });
      } else {
        if (!authForm.phone || !authForm.password) {
          throw new Error('Please enter phone and password');
        }
        const data = await api.login(authForm.phone, authForm.password);
        setAdmin(data.admin);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setAdmin(null);
    setMembers([]);
    setExpiryAlerts([]);
  };

  // Form Field Event Listeners
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate values
    let updatedForm = { ...memberForm, [name]: value };

    if (name === 'plan') {
      updatedForm.fees = value === 'Strength' ? 600 : 1200;
    }

    if (name === 'startDate' && value) {
      const start = new Date(value);
      if (!isNaN(start.getTime())) {
        const expiry = new Date(start);
        expiry.setMonth(expiry.getMonth() + 1);
        updatedForm.expiryDate = expiry.toISOString().split('T')[0];
      }
    }

    setMemberForm(updatedForm);
  };

  // Trigger Add Member Modal
  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultExpiry = new Date();
    defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
    const expiryStr = defaultExpiry.toISOString().split('T')[0];

    setMemberForm({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      plan: 'Strength',
      startDate: today,
      expiryDate: expiryStr,
      fees: 600
    });
    setIsAddModalOpen(true);
  };

  // Handle Add Member Submit
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.createMember(memberForm);
      setIsAddModalOpen(false);
      fetchMembers();
      fetchExpiryAlerts();
    } catch (err) {
      alert(err.message || 'Error registering member');
    }
  };

  // Trigger Edit Member Modal
  const openEditModal = (member) => {
    setCurrentMember(member);
    setMemberForm({
      name: member.name,
      phone: member.phone,
      age: member.age,
      gender: member.gender,
      plan: member.plan,
      startDate: member.startDate ? new Date(member.startDate).toISOString().split('T')[0] : '',
      expiryDate: member.expiryDate ? new Date(member.expiryDate).toISOString().split('T')[0] : '',
      fees: member.fees || (member.plan === 'Strength' ? 600 : 1200)
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Member Submit
  const handleEditMember = async (e) => {
    e.preventDefault();
    try {
      await api.updateMember(currentMember._id, memberForm);
      setIsEditModalOpen(false);
      setCurrentMember(null);
      fetchMembers();
      fetchExpiryAlerts();
    } catch (err) {
      alert(err.message || 'Error updating member');
    }
  };

  // Trigger Quick Mark Paid Confirmation
  const openExtendConfirm = (member) => {
    setMemberToExtend(member);
    setIsExtendModalOpen(true);
  };

  // Handle Quick Mark Paid Execute
  const handleExtendMember = async () => {
    if (!memberToExtend) return;
    try {
      // Calculate new expiry date as exactly 1 month from current expiryDate
      const currentExpiry = new Date(memberToExtend.expiryDate);
      currentExpiry.setMonth(currentExpiry.getMonth() + 1);
      const newExpiryStr = currentExpiry.toISOString().split('T')[0];

      await api.updateMember(memberToExtend._id, {
        expiryDate: newExpiryStr
      });

      setIsExtendModalOpen(false);
      setMemberToExtend(null);
      fetchMembers();
      fetchExpiryAlerts();
    } catch (err) {
      alert(err.message || 'Error extending validity');
    }
  };

  // Trigger Delete Member Confirmation
  const openDeleteConfirm = (member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete Member Execute
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await api.deleteMember(memberToDelete._id);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
      fetchExpiryAlerts();
    } catch (err) {
      alert(err.message || 'Error removing member');
    }
  };

  // Trigger Printable Receipt Modal
  const openReceiptModal = (member) => {
    setCurrentMember(member);
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Dashboard Stats Calculations
  const totalCount = members.length;
  const activeCount = members.filter(m => m.status === 'Active').length;
  const expiredCount = members.filter(m => m.status === 'Expired').length;
  const monthlyRevenue = members
    .filter(m => m.status === 'Active')
    .reduce((sum, m) => sum + (m.fees || 0), 0);

  // Helper date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Auth Screen Render
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neutral-100/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo className="h-20 w-auto" showText={false} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              FIT<span className="text-orange-500">ZONE</span> PORTAL
            </h1>
            <p className="text-neutral-400 mt-2">Gym Membership Management System</p>
          </div>

          <div className="bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-neutral-800 pb-4 mb-6">
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 text-center font-semibold py-2 transition-colors ${!isRegister ? 'text-orange-500 border-b-2 border-orange-500' : 'text-neutral-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 text-center font-semibold py-2 transition-colors ${isRegister ? 'text-orange-500 border-b-2 border-orange-500' : 'text-neutral-400 hover:text-white'}`}
              >
                Register Admin
              </button>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg p-3 text-sm mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-500" />
                    <input 
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-500" />
                  <input 
                    type="tel"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-500" />
                  <input 
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                {authLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : isRegister ? (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Admin Account</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Access Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Main Screen Render
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row relative">
      {/* Background Accent Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800/80 p-6 flex flex-col justify-between shrink-0 no-print">
        <div className="space-y-8">
          <div className="pb-4 border-b border-neutral-800">
            <Logo className="h-10 w-auto" />
          </div>
          
          <nav className="space-y-1">
            <button 
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 text-orange-500 font-semibold border border-orange-500/20"
            >
              <Activity className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="mt-8 pt-4 border-t border-neutral-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-orange-500 font-bold uppercase">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold truncate text-white">{admin?.name || 'Admin User'}</p>
              <p className="text-xs text-neutral-400 truncate">{admin?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all font-medium text-sm"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>

          {/* Developer Branding Footer */}
          <div className="pt-4 border-t border-neutral-800/60 flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold font-sans">Developed by</span>
            <a 
              href="https://bytesoft.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            >
              <img 
                src={logoBytesoft} 
                alt="Bytesoft Logo" 
                className="h-6 w-auto border border-neutral-800 rounded px-1.5 py-0.5 bg-white/5 group-hover:border-orange-500/30 transition-colors"
              />
              <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors">
                Bytesoft
              </span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden no-print">
        {/* Header Greeting */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">GYM MANAGEMENT</h2>
            <p className="text-neutral-400 mt-1">Configure members, renew subscriptions, and track cash revenues</p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/10 shrink-0 self-start md:self-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add Member</span>
          </button>
        </header>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat 1 */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-6 shadow-md hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">Total Members</span>
              <div className="p-2.5 bg-neutral-800 rounded-lg text-white">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black">{totalCount}</div>
            <p className="text-xs text-neutral-400 mt-2">Registered in Fitzone database</p>
          </div>

          {/* Stat 2 */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-6 shadow-md hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">Active Members</span>
              <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-500">{activeCount}</div>
            <p className="text-xs text-neutral-400 mt-2">Currently valid subscriptions</p>
          </div>

          {/* Stat 3 */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-6 shadow-md hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">Expired Members</span>
              <div className="p-2.5 bg-red-500/10 rounded-lg text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-red-500">{expiredCount}</div>
            <p className="text-xs text-neutral-400 mt-2">Validity duration exceeded</p>
          </div>

          {/* Stat 4 */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-6 shadow-md hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">Monthly Revenue</span>
              <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-500">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-orange-500">₹{monthlyRevenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-neutral-400 mt-2">Sum of active subscription fees</p>
          </div>
        </section>

        {/* Expiry Alerts Panel */}
        <section className="mb-8">
          <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-orange-500 animate-pulse" />
              <h3 className="text-lg font-bold">Membership Expiry Panel</h3>
              <span className="ml-2 text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                Alerts (Today & Tomorrow)
              </span>
            </div>
            
            {loadingAlerts ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
              </div>
            ) : expiryAlerts.length === 0 ? (
              <p className="text-neutral-500 text-sm py-2">No memberships expiring today or tomorrow.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiryAlerts.map(alertMember => {
                  const isToday = new Date(alertMember.expiryDate).toDateString() === new Date().toDateString();
                  return (
                    <div 
                      key={alertMember._id} 
                      className={`border rounded-xl p-4 flex items-center justify-between bg-neutral-950/80 transition-colors ${
                        isToday ? 'border-red-500/30 hover:border-red-500/50' : 'border-orange-500/30 hover:border-orange-500/50'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">{alertMember.name}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{alertMember.phone}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isToday ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {isToday ? 'Expires TODAY' : 'Expires TOMORROW'}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            {formatDate(alertMember.expiryDate)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openExtendConfirm(alertMember)}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow shadow-orange-500/10"
                        title="Quick Mark Paid"
                      >
                        <Check className="h-4.5 w-4.5 font-bold" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Directory Controls & Table */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl shadow-md overflow-hidden">
          {/* Controls Bar */}
          <div className="p-6 border-b border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>Member Directory</span>
              {loadingMembers && <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />}
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Plan Filter */}
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none pr-8 cursor-pointer"
                  >
                    <option value="">All Plans</option>
                    <option value="Strength">Strength (₹600)</option>
                    <option value="Cardio">Cardio (₹1200)</option>
                  </select>
                  <Filter className="absolute right-3 top-3 h-3 w-3 text-neutral-500 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none pr-8 cursor-pointer"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                  <Filter className="absolute right-3 top-3 h-3 w-3 text-neutral-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            {errorMsg && (
              <div className="m-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {members.length === 0 && !loadingMembers ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 font-medium">No members found matching the filters</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-semibold text-xs tracking-wider uppercase bg-neutral-950/20">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Name / Contact</th>
                    <th className="px-6 py-4">Age / Sex</th>
                    <th className="px-6 py-4">Gym Plan</th>
                    <th className="px-6 py-4">Validity Range</th>
                    <th className="px-6 py-4">Fees</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {members.map((member, index) => {
                    const statusClass = member.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20';

                    const borderQuickRenewClass = member.status === 'Active'
                      ? 'border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500'
                      : 'border-orange-500/50 hover:bg-orange-500/10 text-orange-500';

                    return (
                      <tr 
                        key={member._id}
                        className="hover:bg-neutral-800/20 transition-colors"
                      >
                        {/* Short index display */}
                        <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                          #{String(index + 1).padStart(3, '0')}
                        </td>
                        
                        {/* Name and Phone */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{member.name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{member.phone}</p>
                        </td>

                        {/* Age / Gender */}
                        <td className="px-6 py-4 text-sm text-neutral-300">
                          {member.age} yrs / {member.gender}
                        </td>

                        {/* Gym Plan */}
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            member.plan === 'Strength' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {member.plan}
                          </span>
                        </td>

                        {/* Validity dates */}
                        <td className="px-6 py-4 text-xs text-neutral-300 leading-normal">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500">Start:</span>
                            <span>{formatDate(member.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-neutral-500">End:</span>
                            <span className="font-semibold text-neutral-100">{formatDate(member.expiryDate)}</span>
                          </div>
                        </td>

                        {/* Fee amount */}
                        <td className="px-6 py-4 font-bold text-sm text-white">
                          ₹{member.fees || 0}
                        </td>

                        {/* Expiry badge status */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 border rounded ${statusClass}`}>
                            {member.status}
                          </span>
                        </td>

                        {/* Control Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Quick Mark Paid Button */}
                            <button
                              onClick={() => openExtendConfirm(member)}
                              className={`p-1.5 border rounded-lg transition-all flex items-center justify-center shrink-0 ${borderQuickRenewClass}`}
                              title="Extend Membership 1 Month"
                            >
                              <Check className="h-4 w-4" />
                            </button>

                            {/* View printable receipt */}
                            <button
                              onClick={() => openReceiptModal(member)}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              title="Print Receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              title="Edit Member"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => openDeleteConfirm(member)}
                              className="p-1.5 bg-neutral-800 hover:bg-red-500/10 border border-neutral-700 hover:border-red-500/20 text-neutral-300 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              title="Delete Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* --- ADD MEMBER MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                <span>Register Gym Member</span>
              </h4>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Name</label>
                  <input 
                    type="text"
                    name="name"
                    value={memberForm.name}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Phone Number</label>
                  <input 
                    type="tel"
                    name="phone"
                    value={memberForm.phone}
                    onChange={handleFormChange}
                    placeholder="Phone number"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Age</label>
                  <input 
                    type="number"
                    name="age"
                    value={memberForm.age}
                    onChange={handleFormChange}
                    placeholder="Age"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={memberForm.gender}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Gym Plan</label>
                  <select
                    name="plan"
                    value={memberForm.plan}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm font-semibold text-orange-500"
                  >
                    <option value="Strength">Strength Plan (₹600)</option>
                    <option value="Cardio">Cardio Plan (₹1200)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Subscription Fees (₹)</label>
                  <input 
                    type="number"
                    name="fees"
                    value={memberForm.fees}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Start Date</label>
                  <input 
                    type="date"
                    name="startDate"
                    value={memberForm.startDate}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Expiry Date</label>
                  <input 
                    type="date"
                    name="expiryDate"
                    value={memberForm.expiryDate}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MEMBER MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Edit className="h-5 w-5 text-orange-500" />
                <span>Modify Member Profile</span>
              </h4>
              <button 
                onClick={() => { setIsEditModalOpen(false); setCurrentMember(null); }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditMember} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Name</label>
                  <input 
                    type="text"
                    name="name"
                    value={memberForm.name}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Phone Number</label>
                  <input 
                    type="tel"
                    name="phone"
                    value={memberForm.phone}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Age</label>
                  <input 
                    type="number"
                    name="age"
                    value={memberForm.age}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={memberForm.gender}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Gym Plan</label>
                  <select
                    name="plan"
                    value={memberForm.plan}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm font-semibold text-orange-500"
                  >
                    <option value="Strength">Strength Plan (₹600)</option>
                    <option value="Cardio">Cardio Plan (₹1200)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Subscription Fees (₹)</label>
                  <input 
                    type="number"
                    name="fees"
                    value={memberForm.fees}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Start Date</label>
                  <input 
                    type="date"
                    name="startDate"
                    value={memberForm.startDate}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Expiry Date</label>
                  <input 
                    type="date"
                    name="expiryDate"
                    value={memberForm.expiryDate}
                    onChange={handleFormChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setCurrentMember(null); }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK MARK PAID CONFIRM MODAL --- */}
      {isExtendModalOpen && memberToExtend && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 no-print">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Renew Membership Validity?</h4>
                <p className="text-sm text-neutral-400">Confirm payment and extension</p>
              </div>
            </div>
            
            <div className="bg-neutral-950 border border-neutral-800/50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Member:</span>
                <span className="font-bold text-white">{memberToExtend.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Plan type:</span>
                <span className="font-semibold text-orange-400">{memberToExtend.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Current Expiry:</span>
                <span className="text-neutral-300 font-mono">{formatDate(memberToExtend.expiryDate)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-800/80 text-emerald-400 font-semibold">
                <span>New Expiry (+1 Month):</span>
                <span className="font-mono">
                  {(() => {
                    const date = new Date(memberToExtend.expiryDate);
                    date.setMonth(date.getMonth() + 1);
                    return formatDate(date);
                  })()}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-white font-bold">
                <span>Cash Amount Due:</span>
                <span>₹{memberToExtend.fees || 0}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setIsExtendModalOpen(false); setMemberToExtend(null); }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendMember}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm shadow shadow-orange-500/10"
              >
                Record payment & Extend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {isDeleteModalOpen && memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 no-print">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Remove Gym Member?</h4>
                <p className="text-sm text-neutral-400">This action is permanent and cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-neutral-300 mb-6">
              Are you sure you want to permanently delete member <span className="font-bold text-white">{memberToDelete.name}</span> ({memberToDelete.phone}) from the database?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setMemberToDelete(null); }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE RECEIPT MODAL --- */}
      {isReceiptModalOpen && currentMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto no-print">
          <div className="bg-white text-neutral-950 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal controls bar (hides in print) */}
            <div className="px-6 py-4 bg-neutral-950 text-white flex justify-between items-center">
              <h4 className="text-md font-bold flex items-center gap-2">
                <Printer className="h-5 w-5 text-orange-500" />
                <span>Invoice Cash Receipt</span>
              </h4>
              <button 
                onClick={() => { setIsReceiptModalOpen(false); setCurrentMember(null); }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt invoice body (visible in print) */}
            <div className="p-8 print-container text-neutral-950" id="receipt-invoice">
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-6">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase text-neutral-900 flex items-center gap-2">
                    {/* Embedded logo */}
                    <Logo className="h-10 w-10 shrink-0" showText={false} />
                    <span>FIT<span className="text-orange-600">ZONE</span></span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium mt-1">Fitzone Gym & Fitness Studio</p>
                  <p className="text-xs text-neutral-400">123 Gym Street, Delhi, India</p>
                </div>
                <div className="text-right">
                  <h4 className="text-lg font-bold text-neutral-800 uppercase tracking-widest">Receipt</h4>
                  <p className="text-xs font-semibold font-mono mt-1 text-neutral-600">
                    NO: #FZ-{currentMember._id ? currentMember._id.slice(-6).toUpperCase() : '000000'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Date: {new Date().toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="my-6">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Member Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                  <div>
                    <p className="text-neutral-400 text-xs">Full Name</p>
                    <p className="font-bold text-neutral-900 mt-0.5">{currentMember.name}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Contact</p>
                    <p className="font-semibold text-neutral-900 mt-0.5">{currentMember.phone}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Age / Gender</p>
                    <p className="text-neutral-900 mt-0.5">{currentMember.age} yrs / {currentMember.gender}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Payment Method</p>
                    <p className="text-neutral-900 font-semibold mt-0.5">Cash</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="my-6">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-neutral-500 font-bold">
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-center">Period</th>
                      <th className="py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-200">
                      <td className="py-4">
                        <p className="font-bold text-neutral-900">{currentMember.plan} Gym Membership Plan</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Access to gym floor, locker and trainers</p>
                      </td>
                      <td className="py-4 text-center text-xs text-neutral-700 leading-relaxed font-mono">
                        {formatDate(currentMember.startDate)} <br />to<br /> {formatDate(currentMember.expiryDate)}
                      </td>
                      <td className="py-4 text-right font-bold text-neutral-950">
                        ₹{(currentMember.fees || 0).toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3"></td>
                      <td className="py-3 text-right font-bold text-neutral-500 text-xs uppercase">Subtotal</td>
                      <td className="py-3 text-right font-bold text-neutral-900">
                        ₹{(currentMember.fees || 0).toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                    <tr className="border-t border-neutral-300">
                      <td className="py-3"></td>
                      <td className="py-3 text-right font-bold text-neutral-800 uppercase tracking-wider text-sm">Total Paid</td>
                      <td className="py-3 text-right font-black text-lg text-neutral-950">
                        ₹{(currentMember.fees || 0).toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Receipt Footer */}
              <div className="border-t-2 border-neutral-900 pt-6 mt-8 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-neutral-800">Thank you for your business!</p>
                  <p className="text-neutral-500 mt-0.5">Please keep this copy for your records.</p>
                </div>
                <div className="text-center font-semibold">
                  <div className="h-10 w-24 border-b border-neutral-400 mx-auto"></div>
                  <p className="text-neutral-500 mt-1">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Print Controls (Hides in print) */}
            <div className="px-6 py-4 bg-neutral-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setIsReceiptModalOpen(false); setCurrentMember(null); }}
                className="bg-neutral-300 hover:bg-neutral-400 text-neutral-800 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Close Window
              </button>
              <button
                onClick={handlePrintReceipt}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm flex items-center gap-2 shadow"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Actual Hidden container used exclusively for Browser Printing redirection */}
      {isReceiptModalOpen && currentMember && (
        <div className="hidden print-container text-neutral-950 p-8">
          <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-6">
            <div>
              <h3 className="text-3xl font-black tracking-tighter uppercase text-neutral-900">
                FIT<span className="text-orange-600">ZONE</span>
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">Fitzone Gym & Fitness Studio</p>
              <p className="text-xs text-neutral-400">123 Gym Street, Delhi, India</p>
            </div>
            <div className="text-right">
              <h4 className="text-lg font-bold text-neutral-800 uppercase tracking-widest">Receipt</h4>
              <p className="text-xs font-semibold font-mono mt-1 text-neutral-600">
                NO: #FZ-{currentMember._id ? currentMember._id.slice(-6).toUpperCase() : '000000'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Date: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="my-6">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Member Details</h5>
            <div className="grid grid-cols-2 gap-4 text-sm bg-neutral-50 rounded-xl p-4 border border-neutral-100">
              <div>
                <p className="text-neutral-400 text-xs">Full Name</p>
                <p className="font-bold text-neutral-900 mt-0.5">{currentMember.name}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs">Contact</p>
                <p className="font-semibold text-neutral-900 mt-0.5">{currentMember.phone}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs">Age / Gender</p>
                <p className="text-neutral-900 mt-0.5">{currentMember.age} yrs / {currentMember.gender}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs">Payment Method</p>
                <p className="text-neutral-900 font-semibold mt-0.5">Cash</p>
              </div>
            </div>
          </div>

          <div className="my-6">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-neutral-500 font-bold">
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 text-center">Period</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="py-4">
                    <p className="font-bold text-neutral-900">{currentMember.plan} Gym Membership Plan</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Access to gym floor, locker and trainers</p>
                  </td>
                  <td className="py-4 text-center text-xs text-neutral-700 leading-relaxed font-mono">
                    {formatDate(currentMember.startDate)} to {formatDate(currentMember.expiryDate)}
                  </td>
                  <td className="py-4 text-right font-bold text-neutral-950">
                    ₹{(currentMember.fees || 0).toLocaleString('en-IN')}.00
                  </td>
                </tr>
                <tr>
                  <td className="py-3"></td>
                  <td className="py-3 text-right font-bold text-neutral-500 text-xs uppercase">Subtotal</td>
                  <td className="py-3 text-right font-bold text-neutral-900">
                    ₹{(currentMember.fees || 0).toLocaleString('en-IN')}.00
                  </td>
                </tr>
                <tr className="border-t border-neutral-300">
                  <td className="py-3"></td>
                  <td className="py-3 text-right font-bold text-neutral-800 uppercase tracking-wider text-sm">Total Paid</td>
                  <td className="py-3 text-right font-black text-lg text-neutral-950">
                    ₹{(currentMember.fees || 0).toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-neutral-900 pt-6 mt-8 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-neutral-800">Thank you for your business!</p>
              <p className="text-neutral-500 mt-0.5">Please keep this copy for your records.</p>
            </div>
            <div className="text-center font-semibold">
              <div className="h-10 w-24 border-b border-neutral-400 mx-auto"></div>
              <p className="text-neutral-500 mt-1">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
