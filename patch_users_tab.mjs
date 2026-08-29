import fs from 'fs';

const filePath = './src/components/SettingsModal.tsx';
const code = fs.readFileSync(filePath, 'utf8');

const startIndex = code.indexOf("{activeTab === 'users' && (");
const endIndex = code.indexOf("{activeTab === 'backup' && (");

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end bounds.");
  process.exit(1);
}

// We want to replace everything from startIndex up to the line before endIndex.
// Wait, there's a `{/* TAB 5` block before backup tab. Let's find that.
const endReplacementIndex = code.lastIndexOf("            {/* ===================================================================== */", endIndex);

if (endReplacementIndex === -1) {
  console.error("Could not find endReplacementIndex bounds.");
  process.exit(1);
}

const replacement = `{activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      إدارة الوصول والأمان
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      تكوين شاشة الدخول، إدارة المستخدمين، ومراجعة سجل النشاطات
                    </p>
                  </div>
                </div>

                {/* Require Login Toggle */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={\`p-2.5 rounded-xl \${formData.requireLogin ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}\`}>
                        <Lock size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">تفعيل شاشة تسجيل الدخول بكلمة مرور</h4>
                        <p className="text-xs text-slate-500 mt-1">عند التفعيل، سيُطلب من أي مستخدم إدخال رمز المرور قبل الدخول للمنظومة</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer relative w-12 h-6 rounded-full transition-colors duration-300 bg-slate-200 dark:bg-slate-700">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={formData.requireLogin || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, requireLogin: e.target.checked }))}
                      />
                      <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 \${formData.requireLogin ? 'transform translate-x-6 bg-indigo-500' : 'bg-white'}\`}></div>
                      <div className={\`absolute inset-0 rounded-full transition-colors duration-300 \${formData.requireLogin ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}\`}></div>
                      <div className={\`absolute left-1 top-1 w-4 h-4 rounded-full shadow-sm transition-transform duration-300 bg-white \${formData.requireLogin ? 'transform translate-x-6' : ''}\`}></div>
                    </label>
                  </div>
                </div>

                {/* Users List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-500" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">حسابات الموظفين</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 border border-indigo-200"
                    >
                      <Plus size={14} />
                      إضافة مستخدم
                    </button>
                  </div>
                  
                  {showAddUserModal && (
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/30 animate-in slide-in-from-top-2">
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل *</label>
                            <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="مثال: أحمد محمد" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم (للدخول) *</label>
                            <input type="text" required value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="مثال: ahmed" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">رمز المرور (PIN) *</label>
                            <input type="password" required value={newUserPin} onChange={e => setNewUserPin(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="****" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">الصلاحية *</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <option value="admin">مدير النظام (كامل الصلاحيات)</option>
                              <option value="cashier">موظف (تحصيل فقط)</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all active:scale-95">حفظ المستخدم</button>
                          <button type="button" onClick={() => setShowAddUserModal(false)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {formData.users.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
                              {user.id === 'user-admin-1' && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">الأساسي</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{user.username}</span>
                              <span>•</span>
                              <span className={user.role === 'admin' ? 'text-indigo-600' : 'text-emerald-600'}>
                                {user.role === 'admin' ? 'مدير نظام' : 'موظف'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {user.id !== 'user-admin-1' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف المستخدم"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Log Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-500" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">سجل النشاطات (Audit Log)</h4>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-start whitespace-nowrap text-sm border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-start">التاريخ والوقت</th>
                          <th className="px-4 py-3 text-start">المستخدم</th>
                          <th className="px-4 py-3 text-start">الإجراء</th>
                          <th className="px-4 py-3 text-start">التفاصيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs">
                              لا توجد نشاطات مسجلة حتى الآن.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 text-xs font-mono text-slate-500">
                                {new Date(log.timestamp).toLocaleString('ar-LY')}
                              </td>
                              <td className="px-4 py-3 font-bold text-xs">{log.userName}</td>
                              <td className="px-4 py-3 text-xs"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">{log.action}</span></td>
                              <td className="px-4 py-3 text-xs text-slate-500 whitespace-normal min-w-[200px]">{log.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
`;

const newCode = code.substring(0, startIndex) + replacement + code.substring(endReplacementIndex);
fs.writeFileSync(filePath, newCode);
console.log("Patched successfully!");
