import fs from 'fs';
let code = fs.readFileSync('./src/components/FinancialsPage.tsx', 'utf8');

const searchStr = `  useEffect(() => {
    fetchTransactions();`;

const replaceStr = `  useEffect(() => {
    const handleOpenAddPayment = () => {
      setShowAddModal(true);
    };
    window.addEventListener('open-add-payment', handleOpenAddPayment);
    return () => window.removeEventListener('open-add-payment', handleOpenAddPayment);
  }, []);

  useEffect(() => {
    fetchTransactions();`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('./src/components/FinancialsPage.tsx', code);
