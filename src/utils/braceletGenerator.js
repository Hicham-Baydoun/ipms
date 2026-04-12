export const generateBraceletId = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random1 = Math.floor(1000 + Math.random() * 9000);
  const random2 = Math.floor(1000 + Math.random() * 9000);
  return `BRC-${month}${day}-${random1}${random2.toString().slice(0, 4 - String(random1).length)}`;
};
