import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';
import {
  useAdminDashboard,
  useAdminUsers,
  useAdminFriendRequests,
  useAdminSettings,
  useDeleteAdminUser,
  useToggleAdmin,
  useUpdateAdminSettings,
  useSetMaintenance,
} from '../hooks/useAdmin';

const AdminPage = () => {
  const { mutate: logout } = useLogout();
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');

  const { data: dashboardData, isLoading: dashLoading } = useAdminDashboard();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(search ? { search } : { limit: 20 });
  const { data: requestsData, isLoading: reqLoading } = useAdminFriendRequests({ limit: 20 });
  const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();

  const { mutate: deleteUser } = useDeleteAdminUser();
  const { mutate: toggleAdmin } = useToggleAdmin();
  const { mutate: updateSettings } = useUpdateAdminSettings();
  const { mutate: setMaintenance } = useSetMaintenance();

  const [settingsForm, setSettingsForm] = useState(null);
  const settings = settingsData?.data;

  const dashboard = dashboardData?.data;
  const users = usersData?.data ?? [];
  const requests = requestsData?.data ?? [];

  const handleSettingsChange = (e) => {
    setSettingsForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveSettings = () => {
    updateSettings(settingsForm || {});
  };

  const handleMaintenance = (mode) => {
    setMaintenance({ maintenanceMode: mode });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-base-100/75 backdrop-blur-2xl border-r border-white/10 hidden md:flex flex-col p-4 gap-2 z-10">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">
            🛡️ Administration
          </div>
          <div className="text-sm font-semibold text-white">System Command</div>
        </div>

        <ul className="menu p-0 gap-1.5">
          <li>
            <button
              onClick={() => setTab('dashboard')}
              className={`rounded-xl py-2.5 transition-all ${
                tab === 'dashboard'
                  ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-md'
                  : 'text-base-content/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>📊</span>
              <span>Overview &amp; Stats</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setTab('users')}
              className={`rounded-xl py-2.5 transition-all ${
                tab === 'users'
                  ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-md'
                  : 'text-base-content/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>👥</span>
              <span>User Directory</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setTab('requests')}
              className={`rounded-xl py-2.5 transition-all ${
                tab === 'requests'
                  ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-md'
                  : 'text-base-content/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>📩</span>
              <span>Friend Requests</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setTab('settings')}
              className={`rounded-xl py-2.5 transition-all ${
                tab === 'settings'
                  ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-md'
                  : 'text-base-content/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>⚙️</span>
              <span>System Settings</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full z-10">
        {/* Mobile Tab Nav */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
          {['dashboard', 'users', 'requests', 'settings'].map((t) => (
            <button
              key={t}
              className={`btn btn-sm rounded-full ${
                tab === t
                  ? 'btn-primary text-white shadow-md'
                  : 'btn-ghost border border-white/10 text-base-content/80'
              }`}
              onClick={() => setTab(t)}
            >
              {t === 'dashboard' ? '📊 Overview' : t === 'users' ? '👥 Users' : t === 'requests' ? '📩 Requests' : '⚙️ Settings'}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                System Overview
              </h1>
              <p className="text-sm text-base-content/60 mt-1">
                Real-time telemetry of user registrations and interaction volume.
              </p>
            </div>

            {dashLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card bg-base-100/80 backdrop-blur-xl border border-white/5 h-28 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : dashboard ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', val: dashboard.users?.total ?? 0, color: 'text-amber-400', icon: '👤' },
                    { label: 'Onboarded', val: dashboard.users?.onboarded ?? 0, color: 'text-purple-400', icon: '✅' },
                    { label: 'Email Verified', val: dashboard.users?.verified ?? 0, color: 'text-cyan-400', icon: '📧' },
                    { label: 'New Today', val: dashboard.users?.today ?? 0, color: 'text-emerald-400', icon: '⚡' },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="card bg-base-100/75 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs text-base-content/60 mb-2">
                        <span>{card.label}</span>
                        <span>{card.icon}</span>
                      </div>
                      <div className={`text-3xl font-black ${card.color} tracking-tight`}>
                        {card.val}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Requests', val: dashboard.friendRequests?.total ?? 0, color: 'text-white' },
                    { label: 'Pending', val: dashboard.friendRequests?.pending ?? 0, color: 'text-amber-400' },
                    { label: 'Accepted', val: dashboard.friendRequests?.accepted ?? 0, color: 'text-emerald-400' },
                    { label: 'Rejected', val: dashboard.friendRequests?.rejected ?? 0, color: 'text-red-400' },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="card bg-base-100/75 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl"
                    >
                      <div className="text-xs text-base-content/60 mb-2">{card.label}</div>
                      <div className={`text-3xl font-black ${card.color}`}>{card.val}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="card bg-base-100/80 backdrop-blur-xl border border-white/10 p-8 text-center text-base-content/60 rounded-2xl">
                Error loading dashboard telemetry
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  User Directory
                </h1>
                <p className="text-sm text-base-content/60 mt-0.5">
                  Manage roles, DevScores, and community accounts.
                </p>
              </div>
              <input
                type="text"
                className="input input-sm input-bordered bg-base-200/90 border-white/10 text-white rounded-xl sm:w-72"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card bg-base-100/80 backdrop-blur-xl border border-white/5 h-16 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : users.length ? (
              <div className="card bg-base-100/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-white/5 text-base-content/60 text-xs uppercase tracking-wider">
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>DevScore</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-white/5 transition-colors">
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full ring-1 ring-primary/20 overflow-hidden">
                                  <img
                                    src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                                    alt={u.fullname}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white">{u.fullname}</p>
                                <p className="text-xs text-base-content/50">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-sm text-base-content/80">{u.role || 'Developer'}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {u.isAdmin && (
                                <span className="badge badge-primary badge-xs py-1.5 px-2">
                                  Admin
                                </span>
                              )}
                              {u.isVerified && (
                                <span className="badge badge-success badge-xs py-1.5 px-2 text-white">
                                  Verified
                                </span>
                              )}
                              {u.isOnBoarded ? (
                                <span className="badge badge-info badge-xs py-1.5 px-2 text-white">
                                  Onboarded
                                </span>
                              ) : (
                                <span className="badge badge-ghost badge-xs py-1.5 px-2">
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="font-bold text-amber-400">{u.devScore ?? 0}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-xs btn-outline border-white/20 hover:bg-white/10 rounded-lg text-white"
                                onClick={() => toggleAdmin(u._id)}
                              >
                                {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                className="btn btn-xs btn-error btn-outline rounded-lg"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${u.fullname}?`)) {
                                    deleteUser(u._id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 p-8 text-center text-base-content/60 rounded-2xl">
                No users match your query
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Friend Requests Log
            </h1>
            {reqLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card bg-base-100/80 backdrop-blur-xl border border-white/5 h-16 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : requests.length ? (
              <div className="card bg-base-100/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-white/5 text-base-content/60 text-xs uppercase tracking-wider">
                      <tr>
                        <th>Sender</th>
                        <th>Recipient</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.map((r) => (
                        <tr key={r._id} className="hover:bg-white/5 transition-colors">
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                  <img
                                    src={r.sender?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                                    alt={r.sender?.fullname}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {r.sender?.fullname || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                  <img
                                    src={r.recipient?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                                    alt={r.recipient?.fullname}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {r.recipient?.fullname || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge badge-sm rounded-full py-1 px-2.5 ${
                                r.status === 'accepted'
                                  ? 'badge-success text-white'
                                  : r.status === 'pending'
                                  ? 'badge-warning text-white'
                                  : 'badge-error text-white'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 p-8 text-center text-base-content/60 rounded-2xl">
                No friend requests found
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Global Platform Configuration
            </h1>
            {settingsLoading ? (
              <div className="card bg-base-100/80 backdrop-blur-xl border border-white/5 h-48 animate-pulse rounded-2xl"></div>
            ) : settings ? (
              <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm font-semibold text-white">Platform Name</span>
                  </label>
                  <input
                    type="text"
                    name="appName"
                    className="input input-bordered bg-base-200/80 border-white/10 text-white rounded-xl"
                    defaultValue={settings.appName || 'DevSync'}
                    onChange={handleSettingsChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm font-semibold text-white">App Version</span>
                  </label>
                  <input
                    type="text"
                    name="appVersion"
                    className="input input-bordered bg-base-200/80 border-white/10 text-white rounded-xl"
                    defaultValue={settings.appVersion || '2.0.0'}
                    onChange={handleSettingsChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm font-semibold text-white">Global Announcement</span>
                  </label>
                  <textarea
                    name="announcement"
                    className="textarea textarea-bordered bg-base-200/80 border-white/10 text-white rounded-xl h-24"
                    defaultValue={settings.announcement || ''}
                    placeholder="Broadcast message to all connected developers..."
                    onChange={handleSettingsChange}
                  ></textarea>
                </div>
                <button className="btn btn-primary rounded-xl px-6" onClick={saveSettings}>
                  Save Platform Settings
                </button>

                <div className="divider border-white/10 my-4"></div>
                <div>
                  <h3 className="font-bold text-white mb-2">Emergency Maintenance Switch</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      className="btn btn-warning btn-sm rounded-xl"
                      onClick={() => handleMaintenance(true)}
                    >
                      ⚠️ Turn ON Maintenance
                    </button>
                    <button
                      className="btn btn-success btn-sm text-white rounded-xl"
                      onClick={() => handleMaintenance(false)}
                    >
                      🚀 Turn OFF Maintenance (Live)
                    </button>
                  </div>
                  <p className="text-xs text-base-content/60">
                    Current status:{' '}
                    {settings.maintenanceMode ? (
                      <span className="badge badge-warning badge-xs">MAINTENANCE ACTIVE</span>
                    ) : (
                      <span className="badge badge-success badge-xs text-white">SYSTEM ONLINE</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 p-8 text-center text-base-content/60 rounded-2xl">
                Error retrieving platform configuration
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
