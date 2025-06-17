export const getSemesterFromDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  if (month >= 7 && month <= 12) {
    return `Ganjil ${year}/${year + 1}`;
  } else if (month === 1) {
    return `Ganjil ${year - 1}/${year}`;
  } else if (month >= 2 && month <= 6) {
    return `Genap ${year - 1}/${year}`;
  }
};

export const calculateMaxSKS = (nominal) => {
  return Math.floor(parseFloat(nominal || 0) / 300000);
};

export const calculateTotalSKS = (selectedMataKuliah) => {
  return selectedMataKuliah.reduce((total, mk) => total + mk.sks, 0);
};

export const canAddMataKuliah = (selectedMataKuliah, nominal, newSKS) => {
  const currentTotalSKS = calculateTotalSKS(selectedMataKuliah);
  const maxSKS = calculateMaxSKS(nominal);
  return (currentTotalSKS + newSKS) <= maxSKS;
};

export const formatCurrency = (amount) => {
  return `Rp ${parseFloat(amount).toLocaleString()}`;
};